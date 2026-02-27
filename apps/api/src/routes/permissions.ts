import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, and, count } from 'drizzle-orm'
import { db, permissions, rolePermissions } from '../db'
import { authMiddleware } from '../auth'
import { CreatePermissionSchema, UpdatePermissionSchema, PaginationQuerySchema } from '@rbac/shared'

const router = new Hono()

router.use('*', authMiddleware)

// List permissions
router.get('/', zValidator('query', PaginationQuerySchema), async (c) => {
  const { page, limit } = c.req.valid('query')
  const [rows, [{ total }]] = await Promise.all([
    db.query.permissions.findMany({ limit, offset: (page - 1) * limit }),
    db.select({ total: count() }).from(permissions),
  ])
  return c.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

// Get permission by ID
router.get('/:id', async (c) => {
  const perm = await db.query.permissions.findFirst({ where: eq(permissions.id, c.req.param('id')) })
  if (!perm) return c.json({ error: 'Permission not found' }, 404)
  return c.json({ data: perm })
})

// Create permission
router.post('/', zValidator('json', CreatePermissionSchema), async (c) => {
  const dto = c.req.valid('json')
  const [perm] = await db.insert(permissions).values(dto).returning().catch(() => {
    throw Object.assign(new Error('Permission already exists'), { status: 409 })
  })
  return c.json({ data: perm }, 201)
})

// Update permission description
router.patch('/:id', zValidator('json', UpdatePermissionSchema), async (c) => {
  const [updated] = await db
    .update(permissions).set(c.req.valid('json'))
    .where(eq(permissions.id, c.req.param('id'))).returning()
  if (!updated) return c.json({ error: 'Permission not found' }, 404)
  return c.json({ data: updated })
})

// Delete permission (fails if assigned to a role)
router.delete('/:id', async (c) => {
  const [{ total }] = await db
    .select({ total: count() }).from(rolePermissions)
    .where(eq(rolePermissions.permissionId, c.req.param('id')))
  if (total > 0) return c.json({ error: 'Cannot delete permission assigned to a role' }, 422)

  const [deleted] = await db.delete(permissions).where(eq(permissions.id, c.req.param('id'))).returning()
  if (!deleted) return c.json({ error: 'Permission not found' }, 404)
  return c.body(null, 204)
})

export default router
