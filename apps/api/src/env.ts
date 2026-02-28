import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // During drizzle-kit schema loading, avoid crashing if vars are missing
  if (
    process.env.npm_lifecycle_event === "db:generate" ||
    process.env.npm_lifecycle_event === "db:migrate"
  ) {
    // Only return parsed data if at least DATABASE_URL is there, or mock it
  } else {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : ({} as any);
