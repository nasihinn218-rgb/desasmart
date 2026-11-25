import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_ROLES = ['STAFF', 'SUPERADMIN', 'KEPALA_DESA'];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const citizens = await prisma.citizen.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        nik: true,
        rt: true,
        rw: true,
        dusun: true,
        address: true,
        occupation: true,
        gender: true,
        phone: true,
        user: {
          select: {
            email: true,
            isActive: true,
            isVerified: true,
          },
        },
      },
    });

    const response = NextResponse.json({
      citizens: citizens.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        nik: c.nik,
        rt: c.rt,
        rw: c.rw,
        dusun: c.dusun,
        address: c.address,
        occupation: c.occupation,
        gender: c.gender,
        phone: c.phone,
        email: c.user?.email ?? null,
        hasAccount: !!c.user,
        isVerified: c.user?.isVerified ?? false,
        isActive: c.user?.isActive ?? false,
      })),
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  } catch (error) {
    console.error('Fetch wilayah error:', error);
    return NextResponse.json({ error: 'Gagal memuat data wilayah.' }, { status: 500 });
  }
}
