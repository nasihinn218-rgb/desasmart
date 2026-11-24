import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'desasmart-super-secure-secret-key-indonesia-2026-sktm';
export const COOKIE_NAME = 'desasmart_session';
export const BACKUP_COOKIE_NAME = 'desasmart_auth_backup';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export interface UserBackupData {
  userId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  phone?: string | null;
  nik?: string;
  noKk?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  rt?: string;
  rw?: string;
  dusun?: string;
  occupation?: string;
  monthlyIncome?: number;
  familyMembersCount?: number;
  houseCondition?: string;
  economicDescription?: string;
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function createBackupToken(data: UserBackupData): string {
  return jwt.sign(data, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyBackupToken(token: string): UserBackupData | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserBackupData;
  } catch {
    return null;
  }
}

/**
 * Memastikan akun tersimpan di database lokal/serverless jika instance lambda baru dinyalakan.
 */
export async function ensureUserInDatabase(backup: UserBackupData) {
  try {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ id: backup.userId }, { email: backup.email.toLowerCase().trim() }],
      },
      include: { role: true, citizen: true },
    });
    if (existing) return existing;

    const roleObj = await prisma.role.findFirst({
      where: { name: backup.role || 'MASYARAKAT' },
    });
    if (!roleObj) return null;

    const village = await prisma.village.findFirst();

    return await prisma.user.create({
      data: {
        id: backup.userId,
        email: backup.email.toLowerCase().trim(),
        name: backup.name.trim(),
        password: backup.passwordHash,
        phone: backup.phone || null,
        roleId: roleObj.id,
        villageId: village?.id || null,
        isActive: true,
        isVerified: true,
        citizen: backup.nik
          ? {
              create: {
                nik: backup.nik,
                noKk: backup.noKk || '0000000000000000',
                fullName: backup.name.trim(),
                birthPlace: backup.birthPlace || 'Cirebon',
                birthDate: backup.birthDate ? new Date(backup.birthDate) : new Date('1990-01-01'),
                gender: backup.gender || 'LAKI_LAKI',
                address: backup.address || 'Desa Silihasih',
                rt: backup.rt || '001',
                rw: backup.rw || '001',
                dusun: backup.dusun || 'Dusun Wage',
                occupation: backup.occupation || 'Wiraswasta',
                monthlyIncome: backup.monthlyIncome || 1000000,
                familyMembersCount: backup.familyMembersCount || 3,
                houseCondition: backup.houseCondition || 'Milik Sendiri',
                economicDescription: backup.economicDescription || 'Keluarga warga desa.',
              },
            }
          : undefined,
      },
      include: { role: true, citizen: true },
    });
  } catch (err) {
    console.warn('Could not auto-restore user into database:', err);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    let user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        village: true,
        citizen: true,
      },
    });

    // Jika user belum ada di DB instance lambda ini, coba pulihkan dari backup cookie
    if (!user) {
      const backupToken = cookieStore.get(BACKUP_COOKIE_NAME)?.value;
      if (backupToken) {
        const backupData = verifyBackupToken(backupToken);
        if (backupData && (backupData.userId === decoded.userId || backupData.email.toLowerCase().trim() === decoded.email.toLowerCase().trim())) {
          await ensureUserInDatabase(backupData);
          user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true, village: true, citizen: true },
          });
        }
      }
    }

    if (user && user.isActive) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role.name,
        roleDisplayName: user.role.displayName,
        villageId: user.villageId,
        village: user.village,
        citizen: user.citizen,
      };
    }

    // Jika DB di serverless belum sinkron tetapi JWT sesi valid, gunakan identitas dari sesi
    // sehingga nama pengguna asli selalu tampil dan TIDAK PERNAH berubah menjadi "Warga"
    if (decoded.name) {
      return {
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        phone: null,
        avatarUrl: null,
        role: decoded.role || 'MASYARAKAT',
        roleDisplayName: decoded.role === 'MASYARAKAT' ? 'Masyarakat' : decoded.role,
        villageId: null,
        village: null,
        citizen: null,
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
