import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import os from 'os';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  // 1. Prisma Postgres Cloud (Vercel/Production) — highest priority
  const prismaCloudUrl = process.env.POSTGRES_PRISMA_DATABASE_URL;
  if (prismaCloudUrl && prismaCloudUrl.startsWith('postgres')) {
    console.log('[Prisma] Using Prisma Postgres Cloud (POSTGRES_PRISMA_DATABASE_URL)');
    return prismaCloudUrl;
  }

  // 2. Any other PostgreSQL/MySQL external database
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.includes('dev.db') && !envUrl.includes('seed.db')) {
    return envUrl;
  }

  // 3. In Vercel / Serverless environment: use SQLite seed copy in /tmp
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
    const normalizedPath = tmpDbPath.replace(/\\/g, '/');
    return `file:${normalizedPath}`;
  }

  // 4. Local development: SQLite dev.db
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

