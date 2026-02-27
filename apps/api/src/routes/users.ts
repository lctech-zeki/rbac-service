import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq, isNull, ilike, and, count } from 'drizzle-orm'
import { db, users, userRoles, roles } from '../db'
import { authMiddleware } from '../auth'
import {
  CreateUserSchema, UpdateUserSchema, ChangePasswordSchema,
  PaginationQuerySchema, AssignRoleSchema,
} from '@rbac/shared'

const router = new Hono()

router.use('*', authMiddleware)

// List users
router.get('/', zValidator('query', PaginationQuerySchema), async (c) => {
  const { page, limit } = c.req.valid('query')
  const offset = (page - 1) * limit

  const [rows, [{ total }]] = await Promise.all([
    db.query.users.findMany({
      where: isNull(users.deletedAt),
      columns: { passwordHash: false },
      limit,
      offset,
    }),
    db.select({ total: count() }).from(users).where(isNull(users.deletedAt)),
  ])

  return c.json({ data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } })
})

// Get user by ID
router.get('/:id', async (c) => {
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, c.req.param('id')), isNull(users.deletedAt)),
    columns: { passwordHash: false },
  })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json({ data: user })
})

// Create user
router.post('/', zValidator('json', CreateUserSchema), async (c) => {
  const { email, username, password } = c.req.valid('json')
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) return c.json({ error: 'Email already in use' }, 409)

  const passwordHash = await Bun.password.hash(password)
  const [user] = await db.insert(users).values({ email, username, passwordHash }).returning({
    id: users.id, email: users.email, username: users.username, createdAt: users.createdAt,
  })
  return c.json({ data: user }, 201)
})

// Update user
router.patch('/:id', zValidator('json', UpdateUserSchema), async (c) => {
  const dto = c.req.valid('json')
  const [updated] = await db
    .update(users)
    .set({ ...dto, updatedAt: new Date() })
    .where(and(eq(users.id, c.req.param('id')), isNull(users.deletedAt)))
    .returning({ id: users.id, email: users.email, username: users.username })
  if (!updated) return c.json({ error: 'User not found' }, 404)
  return c.json({ data: updated })
})

// Soft-delete user
router.delete('/:id', async (c) => {
  const [deleted] = await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(and(eq(users.id, c.req.param('id')), isNull(users.deletedAt)))
    .returning({ id: users.id })
  if (!deleted) return c.json({ error: 'User not found' }, 404)
  return c.body(null, 204)
})

// Change password
router.put('/:id/password', zValidator('json', ChangePasswordSchema), async (c) => {
  const { oldPassword, newPassword } = c.req.valid('json')
  const user = await db.query.users.findFirst({ where: eq(users.id, c.req.param('id')) })
  if (!user) return c.json({ error: 'User not found' }, 404)

  const valid = await Bun.password.verify(oldPassword, user.passwordHash)
  if (!valid) return c.json({ error: 'Wrong current password' }, 422)

  await db.update(users)
    .set({ passwordHash: await Bun.password.hash(newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id))

  return c.json({ data: { message: 'Password updated' } })
})

// Get user roles
router.get('/:id/roles', async (c) => {
  const rows = await db.query.userRoles.findMany({
    where: eq(userRoles.userId, c.req.param('id')),
    with: { role: true },
  })
  return c.json({ data: rows.map((r) => r.role) })
})

// Assign role to user
router.post('/:id/roles', zValidator('json', AssignRoleSchema), async (c) => {
  const { roleId } = c.req.valid('json')
  await db.insert(userRoles)
    .values({ userId: c.req.param('id'), roleId })
    .onConflictDoNothing()
  return c.json({ data: { message: 'Role assigned' } }, 201)
})

// Revoke role from user
router.delete('/:id/roles/:roleId', async (c) => {
  await db.delete(userRoles)
    .where(and(eq(userRoles.userId, c.req.param('id')), eq(userRoles.roleId, c.req.param('roleId'))))
  return c.body(null, 204)
})

export default router
