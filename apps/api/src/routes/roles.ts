import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, count } from 'drizzle-orm'
import { db, roles, userRoles, rolePermissions, permissions } from '../db'
import { authMiddleware } from '../auth'
import {
  CreateRoleSchema, UpdateRoleSchema, PaginationQuerySchema, AssignPermissionSchema,
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
  const [role] = await db.insert(roles).values(dto).returning().catch(() => {
    throw Object.assign(new Error('Role name already exists'), { status: 409 })
  })
  return c.json({ data: role }, 201)
})

// Update role
router.patch('/:id', zValidator('json', UpdateRoleSchema), async (c) => {
  const [updated] = await db
    .update(roles).set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(roles.id, c.req.param('id'))).returning()
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

export default router
