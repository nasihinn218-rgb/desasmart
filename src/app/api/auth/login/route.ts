import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, village: true, citizen: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Akun Anda dinonaktifkan. Silakan hubungi Admin Desa untuk aktivasi kembali.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Email atau password yang Anda masukkan salah.' },
        { status: 401 }
      );
    }

    // Akun baru belum menyelesaikan verifikasi OTP → arahkan ke halaman verifikasi.
    // Akun lama/terverifikasi login normal tanpa notifikasi verifikasi.
    if (!user.isVerified) {
      return NextResponse.json(
        {
          error: 'Akun Anda belum diverifikasi. Masukkan kode OTP yang dikirim ke WhatsApp/Email Anda.',
          code: 'NOT_VERIFIED',
          email: user.email,
        },
        { status: 403 }
      );
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
      name: user.name,
    });

    // Record audit log
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role.name,
      action: 'LOGIN',
      entity: 'Auth',
      entityId: user.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent'),
      details: { role: user.role.name },
    });

    // Determine dashboard redirect based on role
    let redirectUrl = '/dashboard/masyarakat';
    if (user.role.name === 'STAFF') redirectUrl = '/dashboard/staf';
    else if (user.role.name === 'SUPERADMIN') redirectUrl = '/dashboard/superadmin';
    else if (user.role.name === 'KEPALA_DESA') redirectUrl = '/dashboard/kades';

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleDisplayName: user.role.displayName,
      },
    });

    // Set HTTP-Only Cookie
    response.cookies.set('desasmart_session', token, {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') ?? false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server internal saat login.' },
      { status: 500 }
    );
  }
}
