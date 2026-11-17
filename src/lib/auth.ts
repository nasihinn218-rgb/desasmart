import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'desasmart-fallback-secret-2026';
const COOKIE_NAME = 'desasmart_session';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
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

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        village: true,
        citizen: true,
      },
    });

    if (!user || !user.isActive) return null;

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
