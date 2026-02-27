import app from './app'
import { env } from './env'
import { redis } from './redis'

await redis.connect()
console.log(`🚀 rbac-api running on http://localhost:${env.PORT}`)

export default {
  port: env.PORT,
  fetch: app.fetch,
}
