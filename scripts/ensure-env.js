const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

// If .env doesn't exist (e.g. on clean CI/CD or Vercel build), create a fallback
if (!fs.existsSync(envPath)) {
  console.log('[DesaSmart Build] No .env found. Creating fallback .env for build process...');
  const defaultEnv = [
    'DATABASE_URL="file:./prisma/seed.db"',
    'JWT_SECRET="desasmart-super-secure-secret-key-indonesia-2026-sktm"',
    'NEXT_PUBLIC_APP_URL="https://desasmart.vercel.app"',
    'FONNTE_API_KEY="4BhTRV8eEiPE6xFGsLZE"',
    'SMTP_HOST="smtp.gmail.com"',
    'SMTP_PORT="587"',
    'SMTP_USER="nasihinn218@gmail.com"',
    'SMTP_PASS="cimj bhkw ukjx sxju"',
    'EMAIL_FROM="Desa Smart <nasihinn218@gmail.com>"',
    'AI_PROVIDER="rule"',
    ''
  ].join('\n');
  try {
    fs.writeFileSync(envPath, defaultEnv, 'utf-8');
    console.log('[DesaSmart Build] Fallback .env created successfully.');
  } catch (err) {
    console.warn('[DesaSmart Build] Could not create fallback .env:', err.message);
  }
}

// Also ensure process.env has the variables loaded in the current runtime
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/seed.db';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'desasmart-super-secure-secret-key-indonesia-2026-sktm';
}
if (!process.env.FONNTE_API_KEY) {
  process.env.FONNTE_API_KEY = '4BhTRV8eEiPE6xFGsLZE';
}
if (!process.env.SMTP_USER) {
  process.env.SMTP_USER = 'nasihinn218@gmail.com';
}
if (!process.env.SMTP_PASS) {
  process.env.SMTP_PASS = 'cimj bhkw ukjx sxju';
}
