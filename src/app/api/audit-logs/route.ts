import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireRole(['STAFF', 'SUPERADMIN', 'KEPALA_DESA']);

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Gagal memuat log audit.' }, { status: 500 });
  }
}
