import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { db, userRoles, rolePermissions, permissions } from '../db'
import { authMiddleware } from '../auth'
import { CheckPermissionSchema } from '@rbac/shared'
import { redis } from '../redis'

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

// Get all permissions for a user (flattened via roles)
router.get('/users/:userId/permissions', async (c) => {
  const rows = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, c.req.param('userId')),
    with: { role: { with: { rolePermissions: { with: { permission: true } } } } },
  })

  const perms = rows
    .flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i) // deduplicate

  return c.json({ data: perms })
})

async function checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
  const rows = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, userId),
    with: { role: { with: { rolePermissions: { with: { permission: true } } } } },
  })

  return rows.some((ur) =>
    ur.role.rolePermissions.some(
      (rp) => rp.permission.resource === resource && rp.permission.action === action,
    ),
  )
}

export { checkUserPermission }
export default router
