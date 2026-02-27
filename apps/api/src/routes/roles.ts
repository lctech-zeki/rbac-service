import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, count } from 'drizzle-orm'
import { db, roles, userRoles, rolePermissions, rolePermissionGroups, permissionGroups } from '../db'
import { authMiddleware } from '../auth'
import {
  CreateRoleSchema, UpdateRoleSchema, PaginationQuerySchema, AssignPermissionSchema,
  SetRoleParentSchema, AssignPermissionGroupSchema,
} from '@rbac/shared'

const router = new Hono()

router.use('*', authMiddleware)

// List roles
router.get('/', zValidator('query', PaginationQuerySchema), async (c) => {
  const { page, limit } = c.req.valid('query')
  const [rows, [{ total }]] = await Promise.all([
    db.query.roles.findMany({ limit, offset: (page - 1) * limit }),
    db.select({ total: count() }).from(roles),
  ])
  return c.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

// Get role by ID (with permissions)
router.get('/:id', async (c) => {
  const role = await db.query.roles.findFirst({
    where: eq(roles.id, c.req.param('id')),
    with: { rolePermissions: { with: { permission: true } } },
  })
  if (!role) return c.json({ error: 'Role not found' }, 404)
  return c.json({ data: { ...role, permissions: role.rolePermissions.map((rp) => rp.permission) } })
})

// Create role
router.post('/', zValidator('json', CreateRoleSchema), async (c) => {
  const dto = c.req.valid('json')
  if (dto.parentId) {
    const parent = await db.query.roles.findFirst({ where: eq(roles.id, dto.parentId) })
    if (!parent) return c.json({ error: 'Parent role not found' }, 404)
  }
  const [role] = await db.insert(roles).values(dto).returning().catch(() => {
    throw Object.assign(new Error('Role name already exists'), { status: 409 })
  })
  return c.json({ data: role }, 201)
})

// Update role
router.patch('/:id', zValidator('json', UpdateRoleSchema), async (c) => {
  const id = c.req.param('id')
  const dto = c.req.valid('json')
  if (dto.parentId) {
    if (dto.parentId === id) return c.json({ error: 'Role cannot be its own parent' }, 422)
    const wouldCycle = await isAncestorOf(id, dto.parentId)
    if (wouldCycle) return c.json({ error: 'Circular role inheritance detected' }, 422)
  }
  const [updated] = await db
    .update(roles).set({ ...dto, updatedAt: new Date() })
    .where(eq(roles.id, id)).returning()
  if (!updated) return c.json({ error: 'Role not found' }, 404)
  return c.json({ data: updated })
})

// Delete role (fails if users are assigned)
router.delete('/:id', async (c) => {
  const [{ total }] = await db
    .select({ total: count() }).from(userRoles).where(eq(userRoles.roleId, c.req.param('id')))
  if (total > 0) return c.json({ error: 'Cannot delete role with assigned users' }, 422)

  const [deleted] = await db.delete(roles).where(eq(roles.id, c.req.param('id'))).returning()
  if (!deleted) return c.json({ error: 'Role not found' }, 404)
  return c.body(null, 204)
})

// Set parent role (with circular-dependency guard)
router.put('/:id/parent', zValidator('json', SetRoleParentSchema), async (c) => {
  const id = c.req.param('id')
  const { parentId } = c.req.valid('json')

  if (parentId === id) return c.json({ error: 'Role cannot be its own parent' }, 422)

  const parent = await db.query.roles.findFirst({ where: eq(roles.id, parentId) })
  if (!parent) return c.json({ error: 'Parent role not found' }, 404)

  const wouldCycle = await isAncestorOf(id, parentId)
  if (wouldCycle) return c.json({ error: 'Circular role inheritance detected' }, 422)

  const [updated] = await db
    .update(roles).set({ parentId, updatedAt: new Date() })
    .where(eq(roles.id, id)).returning()
  if (!updated) return c.json({ error: 'Role not found' }, 404)
  return c.json({ data: updated })
})

// Remove parent role
router.delete('/:id/parent', async (c) => {
  const [updated] = await db
    .update(roles).set({ parentId: null, updatedAt: new Date() })
    .where(eq(roles.id, c.req.param('id'))).returning()
  if (!updated) return c.json({ error: 'Role not found' }, 404)
  return c.json({ data: updated })
})

// List permissions for role
router.get('/:id/permissions', async (c) => {
  const rows = await db.query.rolePermissions.findMany({
    where: eq(rolePermissions.roleId, c.req.param('id')),
    with: { permission: true },
  })
  return c.json({ data: rows.map((r) => r.permission) })
})

// Assign permission to role
router.post('/:id/permissions', zValidator('json', AssignPermissionSchema), async (c) => {
  const { permissionId } = c.req.valid('json')
  await db.insert(rolePermissions)
    .values({ roleId: c.req.param('id'), permissionId })
    .onConflictDoNothing()
  return c.json({ data: { message: 'Permission assigned' } }, 201)
})

// Revoke permission from role
router.delete('/:id/permissions/:permissionId', async (c) => {
  await db.delete(rolePermissions).where(
    and(
      eq(rolePermissions.roleId, c.req.param('id')),
      eq(rolePermissions.permissionId, c.req.param('permissionId')),
    ),
  )
  return c.body(null, 204)
})

// List permission groups assigned to role
router.get('/:id/permission-groups', async (c) => {
  const rows = await db.query.rolePermissionGroups.findMany({
    where: eq(rolePermissionGroups.roleId, c.req.param('id')),
    with: { group: true },
  })
  return c.json({ data: rows.map((r) => r.group) })
})

// Assign permission group to role
router.post('/:id/permission-groups', zValidator('json', AssignPermissionGroupSchema), async (c) => {
  const { groupId } = c.req.valid('json')
  const group = await db.query.permissionGroups.findFirst({ where: eq(permissionGroups.id, groupId) })
  if (!group) return c.json({ error: 'Permission group not found' }, 404)
  await db.insert(rolePermissionGroups)
    .values({ roleId: c.req.param('id'), groupId })
    .onConflictDoNothing()
  return c.json({ data: { message: 'Permission group assigned' } }, 201)
})

// Revoke permission group from role
router.delete('/:id/permission-groups/:groupId', async (c) => {
  await db.delete(rolePermissionGroups).where(
    and(
      eq(rolePermissionGroups.roleId, c.req.param('id')),
      eq(rolePermissionGroups.groupId, c.req.param('groupId')),
    ),
  )
  return c.body(null, 204)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if `candidateAncestorId` is already an ancestor of `roleId`.
 * Used to prevent circular inheritance: before setting roleId.parentId = newParentId,
 * call isAncestorOf(roleId, newParentId) — if true, it's a cycle.
 */
async function isAncestorOf(roleId: string, candidateAncestorId: string): Promise<boolean> {
  let currentId: string | null = candidateAncestorId
  const visited = new Set<string>()
  while (currentId !== null) {
    if (visited.has(currentId)) break // already-broken cycle guard
    visited.add(currentId)
    if (currentId === roleId) return true
    const row = await db.query.roles.findFirst({
      where: eq(roles.id, currentId),
      columns: { parentId: true },
    })
    currentId = row?.parentId ?? null
  }
  return false
}

export default router
