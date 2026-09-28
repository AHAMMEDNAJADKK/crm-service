const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/service_station'),
  JWT_ACCESS_SECRET: z.string().default('super_secret_access_key_12345'),
  JWT_REFRESH_SECRET: z.string().default('super_secret_refresh_key_67890'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // SMTP Config (Optional, logs to console if missing)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('AutoCare Service <noreply@autocare.com>'),

  // Twilio Config (Optional, fallback if missing)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().optional(),

  // Storage configuration
  FILE_STORE_MODE: z.enum(['local', 's3']).default('local'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional()
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Invalid environment variables:', result.error.format());
  process.exit(1);
}

module.exports = result.data;
