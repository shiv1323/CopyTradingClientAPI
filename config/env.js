import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

/**
 * Environment variable validation schema (aligned with project `.env`)
 */
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  MONGODB_URI: Joi.string().allow('').optional(),
  MONGO_URI: Joi.string().allow('').optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  /**
   * Optional RSA keys for RS256 signing/verifying.
   * If provided, they will be used instead of JWT_SECRET/JWT_REFRESH_SECRET.
   * Use PEM strings; multiline keys can be passed with \n escapes.
   */
  JWT_PRIVATE_KEY: Joi.string().optional(),
  JWT_PUBLIC_KEY: Joi.string().optional(),
  JWT_REFRESH_PRIVATE_KEY: Joi.string().optional(),
  JWT_REFRESH_PUBLIC_KEY: Joi.string().optional(),
  ENCRYPTION_KEY1: Joi.string().required(),
  ENCRYPTION_KEY2: Joi.string().required(),
  TEMP_TOKEN_SECRET: Joi.string().allow('').optional(),
  BCRYPT_SALT_ROUNDS: Joi.number().default(10),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(1000),
  RATE_LIMIT_MESSAGE: Joi.string().optional(),
  DEFAULT_SUPERADMIN_EMAIL: Joi.string().email().optional(),
  DEFAULT_SUPERADMIN_PASSWORD: Joi.string().optional(),
  CORS_ORIGIN: Joi.string().optional(),
  ENABLE_LOGGER: Joi.string().valid('true', 'false').default('false'),
  MONGODB_MAX_POOL_SIZE: Joi.number().default(10),
  MONGODB_MIN_POOL_SIZE: Joi.number().default(2),
  MONGODB_SERVER_SELECTION_TIMEOUT: Joi.number().default(5000),
  MONGODB_SOCKET_TIMEOUT: Joi.number().default(45000),
  MONGODB_CONNECT_TIMEOUT: Joi.number().default(10000),
  MONGODB_HEARTBEAT_FREQUENCY: Joi.number().default(10000),
  CRYPTOJS_IV: Joi.string().required(),
  CRYPTOJS_KEY: Joi.string().required(),
  UTC_TIME_DIFF: Joi.number().default(0),
  IP_API_URL: Joi.string().default('https://ipecho.io/json'),
  MT5_SERVER_ENDPOINT: Joi.string().allow('').optional(),
  PAMM_MT5_SERVER_ENDPOINT: Joi.string().allow('').optional(),
  ADMIN_SERVER_BASEURL: Joi.string().allow('').optional(),
  /** AWS S3 (e.g. custom template uploads) */
  AWS_REGION: Joi.string().allow('').optional(),
  AWS_IAM_ACCESS_KEY: Joi.string().allow('').optional(),
  AWS_IAM_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  AWS_BUCKET_NAME: Joi.string().allow('').optional(),
}).unknown();

const { error, value } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const mongoUri = value.MONGODB_URI || value.MONGO_URI;
if (!mongoUri) {
  throw new Error('Environment validation error: either MONGODB_URI or MONGO_URI is required');
}

export default {
  NODE_ENV: value.NODE_ENV,
  PORT: value.PORT,
  /** Resolved connection string (MONGODB_URI, else MONGO_URI) */
  MONGODB_URI: mongoUri,
  MONGO_URI: value.MONGO_URI,
  REDIS_HOST: value.REDIS_HOST,
  REDIS_PORT: value.REDIS_PORT,
  REDIS_PASSWORD: value.REDIS_PASSWORD,
  JWT_SECRET: value.JWT_SECRET,
  JWT_REFRESH_SECRET: value.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: value.JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY: value.JWT_REFRESH_EXPIRY,
  JWT_PRIVATE_KEY: value.JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY: value.JWT_PUBLIC_KEY,
  JWT_REFRESH_PRIVATE_KEY: value.JWT_REFRESH_PRIVATE_KEY,
  JWT_REFRESH_PUBLIC_KEY: value.JWT_REFRESH_PUBLIC_KEY,
  ENCRYPTION_KEY1: value.ENCRYPTION_KEY1,
  ENCRYPTION_KEY2: value.ENCRYPTION_KEY2,
  TEMP_TOKEN_SECRET: value.TEMP_TOKEN_SECRET,
  BCRYPT_SALT_ROUNDS: value.BCRYPT_SALT_ROUNDS,
  RATE_LIMIT_WINDOW_MS: value.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: value.RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_MESSAGE: value.RATE_LIMIT_MESSAGE,
  DEFAULT_SUPERADMIN_EMAIL: value.DEFAULT_SUPERADMIN_EMAIL,
  DEFAULT_SUPERADMIN_PASSWORD: value.DEFAULT_SUPERADMIN_PASSWORD,
  CORS_ORIGIN: value.CORS_ORIGIN,
  ENABLE_LOGGER: value.ENABLE_LOGGER,
  MONGODB_MAX_POOL_SIZE: value.MONGODB_MAX_POOL_SIZE,
  MONGODB_MIN_POOL_SIZE: value.MONGODB_MIN_POOL_SIZE,
  MONGODB_SERVER_SELECTION_TIMEOUT: value.MONGODB_SERVER_SELECTION_TIMEOUT,
  MONGODB_SOCKET_TIMEOUT: value.MONGODB_SOCKET_TIMEOUT,
  MONGODB_CONNECT_TIMEOUT: value.MONGODB_CONNECT_TIMEOUT,
  MONGODB_HEARTBEAT_FREQUENCY: value.MONGODB_HEARTBEAT_FREQUENCY,
  CRYPTOJS_IV: value.CRYPTOJS_IV,
  CRYPTOJS_KEY: value.CRYPTOJS_KEY,
  UTC_TIME_DIFF: value.UTC_TIME_DIFF,
  IP_API_URL: value.IP_API_URL,
  MT5_SERVER_ENDPOINT: value.MT5_SERVER_ENDPOINT,
  PAMM_MT5_SERVER_ENDPOINT: value.PAMM_MT5_SERVER_ENDPOINT,
  ADMIN_SERVER_BASEURL: value.ADMIN_SERVER_BASEURL,
  AWS_REGION: value.AWS_REGION,
  AWS_IAM_ACCESS_KEY: value.AWS_IAM_ACCESS_KEY,
  AWS_IAM_SECRET_ACCESS_KEY: value.AWS_IAM_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME: value.AWS_BUCKET_NAME,
};
