import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { env } from './env'
import { redis } from './redis'

export type JwtPayload = {
  sub: string   // user id
  email: string
  jti: string   // token id (for revocation)
  type: 'access' | 'refresh'
}

export async function signToken(payload: Omit<JwtPayload, 'jti'> & { exp?: number }) {
  const jti = crypto.randomUUID()
  return await new (await import('jose')).SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.type === 'refresh' ? env.JWT_REFRESH_EXPIRES_IN : env.JWT_EXPIRES_IN)
    .sign(await getSecret())
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { jwtVerify } = await import('jose')
  const { payload } = await jwtVerify(token, await getSecret())
  return payload as unknown as JwtPayload
}

async function getSecret() {
  const { createSecretKey } = await import('node:crypto')
  return createSecretKey(Buffer.from(env.JWT_SECRET))
}

const TOKEN_DENY_LIST_PREFIX = 'token:revoked:'

export async function revokeToken(jti: string, ttlSeconds: number) {
  await redis.set(`${TOKEN_DENY_LIST_PREFIX}${jti}`, '1', 'EX', ttlSeconds)
}

export async function isTokenRevoked(jti: string): Promise<boolean> {
  return (await redis.exists(`${TOKEN_DENY_LIST_PREFIX}${jti}`)) === 1
}

// Hono middleware — attaches verified payload to context
export const authMiddleware = createMiddleware<{
  Variables: { user: JwtPayload }
}>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or invalid Authorization header' })
  }
  const token = header.slice(7)
  try {
    const payload = await verifyToken(token)
    if (payload.type !== 'access') throw new Error('Not an access token')
    if (await isTokenRevoked(payload.jti)) throw new Error('Token has been revoked')
    c.set('user', payload)
    await next()
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' })
  }
})
