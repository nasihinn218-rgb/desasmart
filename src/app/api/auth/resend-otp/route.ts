import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueOtpForUser, otpCooldownRemaining } from '@/lib/otp';

// Kirim ulang kode OTP untuk akun masyarakat yang belum terverifikasi.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan.' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Akun sudah terverifikasi. Silakan login.', alreadyVerified: true },
        { status: 409 }
      );
    }

    const remaining = otpCooldownRemaining({ otpSentAt: user.otpSentAt });
    if (remaining > 0) {
      return NextResponse.json(
        { error: `Tunggu ${remaining} detik sebelum mengirim ulang kode.`, retryAfter: remaining },
        { status: 429 }
      );
    }

    let delivery: { whatsapp: boolean; email: boolean };
    try {
      delivery = await issueOtpForUser({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Kode OTP gagal dikirim.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      delivery,
      message: 'Kode OTP baru berhasil dikirim ke WhatsApp/Email Anda.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim ulang kode OTP.' },
      { status: 500 }
    );
  }
}
