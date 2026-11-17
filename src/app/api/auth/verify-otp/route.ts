import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { matchOtpCode } from '@/lib/otp';

// Verifikasi kode OTP pendaftaran akun masyarakat.
// Sukses → akun jadi terverifikasi + sesi login langsung dibuat.
export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email dan kode OTP wajib diisi.' },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(String(code).trim())) {
      return NextResponse.json({ error: 'Kode OTP harus 6 digit angka.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Akun sudah terverifikasi. Silakan login seperti biasa.', alreadyVerified: true },
        { status: 409 }
      );
    }

    const result = await matchOtpCode(user, String(code));
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null, otpSentAt: null },
    });

    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role.name,
      action: 'VERIFY_OTP',
      entity: 'Auth',
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { method: 'OTP_WHATSAPP_EMAIL' },
    });

    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Akun berhasil diverifikasi. Selamat datang!',
      redirectUrl: '/dashboard/masyarakat',
    });

    response.cookies.set('desasmart_session', token, {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ?? false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memverifikasi kode OTP.' },
      { status: 500 }
    );
  }
}
