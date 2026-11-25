import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createToken,
  createBackupToken,
  COOKIE_NAME,
  BACKUP_COOKIE_NAME,
} from '@/lib/auth';
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

    const cleanEmail = String(email).toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { role: true, citizen: true },
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

    const backupToken = createBackupToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.password,
      role: user.role.name,
      phone: user.phone,
      nik: user.citizen?.nik,
      noKk: user.citizen?.noKk,
      birthPlace: user.citizen?.birthPlace,
      birthDate: user.citizen?.birthDate ? user.citizen.birthDate.toISOString() : undefined,
      gender: user.citizen?.gender,
      address: user.citizen?.address,
      rt: user.citizen?.rt,
      rw: user.citizen?.rw,
      dusun: user.citizen?.dusun,
      occupation: user.citizen?.occupation,
      monthlyIncome: user.citizen?.monthlyIncome,
      familyMembersCount: user.citizen?.familyMembersCount,
      houseCondition: user.citizen?.houseCondition,
      economicDescription: user.citizen?.economicDescription,
    });

    const isSecure =
      process.env.NODE_ENV === 'production' ||
      req.headers.get('x-forwarded-proto') === 'https' ||
      (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ?? false);

    const response = NextResponse.json({
      success: true,
      message: 'Akun berhasil diverifikasi. Selamat datang!',
      redirectUrl: '/dashboard/masyarakat',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set(BACKUP_COOKIE_NAME, backupToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
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
