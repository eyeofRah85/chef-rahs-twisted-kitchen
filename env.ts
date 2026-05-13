import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),

  AUTH_SECRET: z.string().min(1),

  NEXTAUTH_URL: z.string().min(1),

  NEXT_PUBLIC_APP_URL: z.string().min(1),

  STRIPE_SECRET_KEY: z.string().optional(),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    z.string().optional(),

  STRIPE_WEBHOOK_SECRET:
    z.string().optional(),
});

const parsed = envSchema.safeParse({
  DATABASE_URL:
    process.env.DATABASE_URL,

  AUTH_SECRET:
    process.env.AUTH_SECRET,

  NEXTAUTH_URL:
    process.env.NEXTAUTH_URL,

  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL,

  STRIPE_SECRET_KEY:
    process.env.STRIPE_SECRET_KEY,

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
    process.env
      .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,

  STRIPE_WEBHOOK_SECRET:
    process.env
      .STRIPE_WEBHOOK_SECRET,
});

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );

  throw new Error(
    "Invalid environment variables.",
  );
}

export const env = parsed.data;