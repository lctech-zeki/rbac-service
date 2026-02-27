import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, inArray } from 'drizzle-orm'
import { db, userRoles, rolePermissions, permissions, roles, permissionGroupItems, rolePermissionGroups } from '../db'
import { authMiddleware } from '../auth'
import { CheckPermissionSchema } from '@rbac/shared'
import { redis } from '../redis'
import { matchesPattern } from '../utils/permission-utils'

const router = new Hono()

router.use('*', authMiddleware)

const CACHE_TTL = 300 // 5 minutes

// Check if a user has a given permission
router.post('/check', zValidator('json', CheckPermissionSchema), async (c) => {
  const { userId, resource, action } = c.req.valid('json')

  const cacheKey = `authz:${userId}:${resource}:${action}`
  const cached = await redis.get(cacheKey)
  if (cached !== null) {
    return c.json({ data: { allowed: cached === '1', userId, resource, action, cached: true } })
  }

  const allowed = await checkUserPermission(userId, resource, action)
  await redis.set(cacheKey, allowed ? '1' : '0', 'EX', CACHE_TTL)

  return c.json({ data: { allowed, userId, resource, action, cached: false } })
})

// Get all permissions for a user (flattened via roles + inheritance + permission groups)
router.get('/users/:userId/permissions', async (c) => {
  const perms = await getAllUserPermissions(c.req.param('userId'))
  return c.json({ data: perms })
})

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Check whether `userId` is allowed to perform `action` on `resource`.
 * Traverses role inheritance (collects all descendant roles) and permission
 * groups, then applies wildcard matching.
 */
async function checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
  const perms = await getAllUserPermissions(userId)
  return perms.some(
    (p) => matchesPattern(p.resource, resource) && matchesPattern(p.action, action),
  )
}

/**
 * Collect every unique permission for a user by:
 *  1. Getting directly assigned roles
 *  2. Expanding each role to all its descendants (role inheritance)
 *  3. Adding direct role → permission links
 *  4. Adding role → permission-group → permission links
 */
async function getAllUserPermissions(userId: string) {
  // Step 1: directly assigned role IDs
  const userRoleRows = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    columns: { roleId: true },
  })
  if (userRoleRows.length === 0) return []

  // Step 2: expand each role to all descendants (BFS down the role tree)
  const directRoleIds = userRoleRows.map((r) => r.roleId)
  const allRoleIds = await expandRoleDescendants(directRoleIds)

  // Step 3: direct permissions for all roles
  const directPermRows = await db.query.rolePermissions.findMany({
    where: inArray(rolePermissions.roleId, allRoleIds),
    with: { permission: true },
  })

  // Step 4: permission-group permissions for all roles
  const groupRows = await db.query.rolePermissionGroups.findMany({
    where: inArray(rolePermissionGroups.roleId, allRoleIds),
    columns: { groupId: true },
  })

  let groupPerms: (typeof permissions.$inferSelect)[] = []
  if (groupRows.length > 0) {
    const groupIds = [...new Set(groupRows.map((g) => g.groupId))]
    const groupItemRows = await db.query.permissionGroupItems.findMany({
      where: inArray(permissionGroupItems.groupId, groupIds),
      with: { permission: true },
    })
    groupPerms = groupItemRows.map((i) => i.permission)
  }

  // Deduplicate by permission ID
  const all = [...directPermRows.map((r) => r.permission), ...groupPerms]
  return all.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
}

/**
 * Given a set of role IDs, return those IDs plus all their descendants
 * (children, grandchildren, …) by traversing the role tree downward.
 */
async function expandRoleDescendants(rootIds: string[]): Promise<string[]> {
  const collected = new Set<string>(rootIds)
  const queue = [...rootIds]

  while (queue.length > 0) {
    const batch = queue.splice(0)
    const children = await db.query.roles.findMany({
      where: inArray(roles.parentId, batch),
      columns: { id: true },
    })
    for (const child of children) {
      if (!collected.has(child.id)) {
        collected.add(child.id)
        queue.push(child.id)
      }
    }
  }

  return [...collected]
}

export { checkUserPermission }
export default router
