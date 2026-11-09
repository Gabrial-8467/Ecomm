import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/retail_db?schema=public'),
  JWT_SECRET: z.string().min(16).default('development-jwt-secret-minimum-16-chars-long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().default('development-cookie-secret'),
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_placeholder'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('placeholder_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default('placeholder_webhook'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  BUSINESS_NAME: z.string().default('Apex Retailers'),
  BUSINESS_GSTIN: z.string().default('07AAAAA0000A1Z5'),
  BUSINESS_SUPPORT_PHONE: z.string().default('+91 11 2345 6789'),
  BUSINESS_SUPPORT_EMAIL: z.string().default('support@apexretailers.in'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  // In development, we can fall back to defaults
}

export const ENV = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
