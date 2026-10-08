import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* =========================================================
   LOAD BACKEND .ENV
========================================================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(
  __dirname,
  '../../.env',
);

dotenv.config({
  path: envPath,
});

/* =========================================================
   ENVIRONMENT
========================================================= */

const nodeEnv = process.env.NODE_ENV || 'development';

const isProduction = nodeEnv === 'production';

/* =========================================================
   REQUIRED ENVIRONMENT VARIABLES
========================================================= */

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error(
    'MongoDB is not configured. Set the MONGODB_URI environment variable.',
  );
}

const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret.length < 32)) {
  throw new Error(
    'JWT_SECRET must be configured with at least 32 characters in production.',
  );
}

const clientOrigin =
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173';

if (isProduction && !process.env.CLIENT_ORIGIN) {
  throw new Error(
    'CLIENT_ORIGIN must be configured in production.',
  );
}

/* =========================================================
   EXPORT ENVIRONMENT CONFIGURATION
========================================================= */

const env = {
  nodeEnv,

  isProduction,

  port: Number(process.env.PORT) || 5000,

  mongoUri,

  /*
   * Development gets a local-only fallback so the application
   * remains easy to run locally.
   *
   * Production is blocked above unless a real secret exists.
   */
  jwtSecret:
    jwtSecret || 'development-secret',

  clientOrigin,

  externalJobProvider:
    process.env.EXTERNAL_JOB_PROVIDER || '',

  externalJobApiUrl:
    process.env.EXTERNAL_JOB_API_URL || '',

  externalJobApiKey:
    process.env.EXTERNAL_JOB_API_KEY || '',
};

export default env;