import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

dotenvConfig();

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DEBUG: z.coerce.boolean().default(false),

  // Database
  DATABASE_URL: z.string().default('postgresql://hrms_user:hrms_pass@localhost:5432/hrms_db'),
  DB_POOL_SIZE: z.coerce.number().default(20),
  DB_LOGGING: z.coerce.boolean().default(false),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379/0'),

  // JWT
  JWT_PRIVATE_KEY: z.string().default(''),
  JWT_PUBLIC_KEY: z.string().default(''),
  JWT_ALGORITHM: z.string().default('RS256'),
  ACCESS_TOKEN_EXPIRE_MINUTES: z.coerce.number().default(15),
  REFRESH_TOKEN_EXPIRE_DAYS: z.coerce.number().default(7),
  ACTIVATION_TOKEN_EXPIRE_HOURS: z.coerce.number().default(48),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_S3_BUCKET: z.string().default('hrforz'),
  AWS_S3_REGION: z.string().default('ap-south-1'),
  AWS_S3_ENDPOINT_URL: z.string().optional(),

  // Email
  SENDGRID_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@hrms.company.com'),
  EMAIL_FROM_NAME: z.string().default('HRMS Platform'),

  // Rate Limiting
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(120),
  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(10),

  // Pagination
  DEFAULT_PAGE_SIZE: z.coerce.number().default(20),
  MAX_PAGE_SIZE: z.coerce.number().default(100),

  // Employee Code
  EMPLOYEE_CODE_PREFIX: z.string().default('FIN'),
  EMPLOYEE_CODE_PADDING: z.coerce.number().default(3),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()),
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
};

export type Config = typeof config;
