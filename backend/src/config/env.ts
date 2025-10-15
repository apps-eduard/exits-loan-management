import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid URL" }),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    DB_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    JWT_SECRET: z.string().min(32, { message: "JWT_SECRET must be at least 32 characters" }),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_SECRET: z.string().min(32, { message: "JWT_REFRESH_SECRET must be at least 32 characters" }),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  })
  .transform((values) => ({
    ...values,
    isDevelopment: values.NODE_ENV === "development",
    isProduction: values.NODE_ENV === "production",
    isTest: values.NODE_ENV === "test",
  }));

type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(", ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env: Env = parsed.data;
