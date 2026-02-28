import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { HTTPException } from 'hono/http-exception'
import authRoutes from './routes/auth'
import usersRoutes from './routes/users'
import rolesRoutes from './routes/roles'
import permissionsRoutes from './routes/permissions'
import authzRoutes from './routes/authz'
import permissionGroupsRoutes from './routes/permission-groups'

const app = new Hono().basePath('/api/v1')

// ─── Global middleware ────────────────────────────────────────────────────────
app.use('*', logger())
app.use('*', cors({ origin: Bun.env.CORS_ORIGIN ?? '*' }))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/healthz', (c) => c.json({ status: 'ok' }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/auth', authRoutes)
app.route('/users', usersRoutes)
app.route('/roles', rolesRoutes)
app.route('/permissions', permissionsRoutes)
app.route('/authz', authzRoutes)
app.route('/permission-groups', permissionGroupsRoutes)

// ─── Error handler ────────────────────────────────────────────────────────────
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  const status = (err as { status?: number }).status ?? 500
  const message = status < 500 ? err.message : 'Internal server error'
  if (status >= 500) console.error('[error]', err)
  return c.json({ error: message }, status as 400)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
