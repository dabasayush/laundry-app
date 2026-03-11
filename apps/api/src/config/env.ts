import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // Database
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection URL"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),

  // SMS / OTP
  SMS_PROVIDER: z.enum(["twilio", "msg91"]).default("twilio"),
  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  // MSG91
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),

  // WhatsApp Business API
  // Provider: 'meta' (Meta Cloud API) or 'twilio' (Twilio WA sandbox)
  WHATSAPP_PROVIDER: z.enum(["meta", "twilio"]).default("meta"),
  // Meta Cloud API
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  // Twilio WhatsApp (reuses TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)
  TWILIO_WHATSAPP_FROM: z.string().optional(), // e.g. whatsapp:+14155238886

  // CORS
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001"),

  // Logging
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "debug"]).default("info"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("╔══════════════════════════════════════════════╗");
  console.error("║        INVALID ENVIRONMENT VARIABLES          ║");
  console.error("╚══════════════════════════════════════════════╝");
  console.error(JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const env = result.data;
export type Env = typeof env;
