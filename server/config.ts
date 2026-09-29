import { z } from 'zod';

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'is required'),
  OPENAI_MODEL: z.string().min(1).default('gpt-5.4-mini'),
  SUPABASE_URL: z.string().url('must be a URL'),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'is required'),
  /** Comma-separated list of extra origins allowed to call the API (same-origin is always allowed). */
  ALLOWED_ORIGINS: z.string().default(''),
  AI_RATE_LIMIT_PER_10_MIN: z.coerce.number().int().positive().default(20),
});

export type Config = z.infer<typeof EnvSchema>;

/**
 * Reads and validates server configuration. This is the only place `process.env` is read.
 * The Supabase values fall back to the VITE_ names the frontend already uses.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse({
    ...env,
    SUPABASE_URL: env.SUPABASE_URL ?? env.VITE_SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: env.SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ');
    throw new Error(`Invalid server configuration: ${issues}`);
  }
  return parsed.data;
}

export function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}
