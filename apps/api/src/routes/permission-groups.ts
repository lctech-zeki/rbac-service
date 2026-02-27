import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, count } from 'drizzle-orm'
import { db, permissionGroups, permissionGroupItems, rolePermissionGroups } from '../db'
import { authMiddleware } from '../auth'
import {
  CreatePermissionGroupSchema, UpdatePermissionGroupSchema,
  PaginationQuerySchema, AssignPermissionSchema,
} from '@rbac/shared'

const router = new Hono()

router.use('*', authMiddleware)

// List permission groups
router.get('/', zValidator('query', PaginationQuerySchema), async (c) => {
  const { page, limit } = c.req.valid('query')
  const [rows, [{ total }]] = await Promise.all([
    db.query.permissionGroups.findMany({ limit, offset: (page - 1) * limit }),
    db.select({ total: count() }).from(permissionGroups),
  ])
  return c.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

// Get permission group by ID (with permissions)
router.get('/:id', async (c) => {
  const group = await db.query.permissionGroups.findFirst({
    where: eq(permissionGroups.id, c.req.param('id')),
    with: { permissionGroupItems: { with: { permission: true } } },
  })
  if (!group) return c.json({ error: 'Permission group not found' }, 404)
  return c.json({
    data: { ...group, permissions: group.permissionGroupItems.map((i) => i.permission) },
  })
})

// Create permission group
router.post('/', zValidator('json', CreatePermissionGroupSchema), async (c) => {
  const dto = c.req.valid('json')
  const [group] = await db.insert(permissionGroups).values(dto).returning().catch(() => {
    throw Object.assign(new Error('Permission group name already exists'), { status: 409 })
  })
  return c.json({ data: group }, 201)
})

// Update permission group
router.patch('/:id', zValidator('json', UpdatePermissionGroupSchema), async (c) => {
  const [updated] = await db
    .update(permissionGroups)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(permissionGroups.id, c.req.param('id'))).returning()
  if (!updated) return c.json({ error: 'Permission group not found' }, 404)
  return c.json({ data: updated })
})

// Delete permission group (fails if assigned to a role)
router.delete('/:id', async (c) => {
  const [{ total }] = await db
    .select({ total: count() }).from(rolePermissionGroups)
    .where(eq(rolePermissionGroups.groupId, c.req.param('id')))
  if (total > 0) return c.json({ error: 'Cannot delete permission group assigned to a role' }, 422)

  const [deleted] = await db
    .delete(permissionGroups).where(eq(permissionGroups.id, c.req.param('id'))).returning()
  if (!deleted) return c.json({ error: 'Permission group not found' }, 404)
  return c.body(null, 204)
})

// List permissions in group
router.get('/:id/permissions', async (c) => {
  const rows = await db.query.permissionGroupItems.findMany({
    where: eq(permissionGroupItems.groupId, c.req.param('id')),
    with: { permission: true },
  })
  return c.json({ data: rows.map((r) => r.permission) })
})

// Add permission to group
router.post('/:id/permissions', zValidator('json', AssignPermissionSchema), async (c) => {
  const { permissionId } = c.req.valid('json')
  await db.insert(permissionGroupItems)
    .values({ groupId: c.req.param('id'), permissionId })
    .onConflictDoNothing()
  return c.json({ data: { message: 'Permission added to group' } }, 201)
})

// Remove permission from group
router.delete('/:id/permissions/:permissionId', async (c) => {
  await db.delete(permissionGroupItems).where(
    and(
      eq(permissionGroupItems.groupId, c.req.param('id')),
      eq(permissionGroupItems.permissionId, c.req.param('permissionId')),
    ),
  )
  return c.body(null, 204)
})

export default router
