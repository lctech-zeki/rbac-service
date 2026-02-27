import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: Bun.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
})
