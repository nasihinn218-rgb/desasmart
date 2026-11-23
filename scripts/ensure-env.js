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
