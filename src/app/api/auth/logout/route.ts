import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'LOGOUT',
        entity: 'Auth',
        entityId: user.id,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent'),
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Berhasil logout.',
    });

    response.cookies.delete('desasmart_session');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Gagal logout.' }, { status: 500 });
  }
}
