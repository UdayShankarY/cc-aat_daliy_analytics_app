import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8787),
  CLIENT_ORIGIN: z.string().default("http://localhost:8080"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(raw: Record<string, unknown>): Env {
  return EnvSchema.parse(raw);
}

