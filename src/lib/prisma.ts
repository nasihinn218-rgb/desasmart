import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If a real external DB (Postgres, MySQL, Turso) is configured via env
  if (envUrl && !envUrl.includes('dev.db') && !envUrl.includes('seed.db')) {
    return envUrl;
  }

  // In Vercel / Serverless environment:
  // Root filesystem is read-only, but os.tmpdir() (/tmp on Linux/Vercel) is writable.
  // Copy seed database to os.tmpdir() so login, registration, and applications work!
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join(os.tmpdir(), 'desasmart.db');
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const possibleSeedPaths = [
          path.join(process.cwd(), 'prisma', 'seed.db'),
          path.join(__dirname, '..', '..', 'prisma', 'seed.db'),
          path.join(process.cwd(), 'seed.db'),
        ];
        const seedPath = possibleSeedPaths.find((p) => fs.existsSync(p));
        if (seedPath) {
          const dir = path.dirname(tmpDbPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.copyFileSync(seedPath, tmpDbPath);
          console.log(`[Prisma Vercel] Seed database copied to ${tmpDbPath} successfully.`);
        } else {
          console.warn('[Prisma Vercel] Warning: seed.db not found in known paths.');
        }
      }
    } catch (err) {
      console.error('[Prisma Vercel] Error initializing temp database:', err);
    }
    // Forward slashes for SQLite URI
    const normalizedPath = tmpDbPath.replace(/\\/g, '/');
    return `file:${normalizedPath}`;
  }

  if (envUrl && envUrl.startsWith('file:')) {
    const cleanRelative = envUrl.slice(5).replace(/^\.\/prisma\//, '').replace(/^\.\//, '');
    const inPrisma = path.join(process.cwd(), 'prisma', cleanRelative);
    if (fs.existsSync(inPrisma)) {
      return `file:${inPrisma.replace(/\\/g, '/')}`;
    }
    const inRoot = path.join(process.cwd(), cleanRelative);
    if (fs.existsSync(inRoot)) {
      return `file:${inRoot.replace(/\\/g, '/')}`;
    }
  }

  const defaultDev = path.resolve(process.cwd(), 'prisma', 'dev.db').replace(/\\/g, '/');
  return envUrl || `file:${defaultDev}`;
}

const activeDbUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: activeDbUrl,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
