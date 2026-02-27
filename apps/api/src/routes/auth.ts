import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, users } from '../db'
import { signToken, verifyToken, revokeToken, authMiddleware } from '../auth'
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '@rbac/shared'

const router = new Hono()

router.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const { email, username, password } = c.req.valid('json')

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) return c.json({ error: 'Email already in use' }, 409)

  const passwordHash = await Bun.password.hash(password)
  const [user] = await db.insert(users).values({ email, username, passwordHash }).returning({
    id: users.id, email: users.email, username: users.username, createdAt: users.createdAt,
  })

  return c.json({ data: user }, 201)
})

router.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const user = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (!user || user.deletedAt) return c.json({ error: 'Invalid credentials' }, 401)

  const valid = await Bun.password.verify(password, user.passwordHash)
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401)

  const base = { sub: user.id, email: user.email }
  const [accessToken, refreshToken] = await Promise.all([
    signToken({ ...base, type: 'access' }),
    signToken({ ...base, type: 'refresh' }),
  ])

  return c.json({ data: { accessToken, refreshToken, expiresIn: 900 } })
})

router.post('/refresh', zValidator('json', RefreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid('json')
  try {
    const payload = await verifyToken(refreshToken)
    if (payload.type !== 'refresh') return c.json({ error: 'Invalid token type' }, 401)

    const accessToken = await signToken({ sub: payload.sub, email: payload.email, type: 'access' })
    return c.json({ data: { accessToken, expiresIn: 900 } })
  } catch {
    return c.json({ error: 'Invalid or expired refresh token' }, 401)
  }
})

router.post('/logout', authMiddleware, async (c) => {
  const user = c.get('user')
  await revokeToken(user.jti, 60 * 60 * 24 * 7) // TTL = refresh token lifetime
  return c.json({ data: { message: 'Logged out' } })
})

export default router
