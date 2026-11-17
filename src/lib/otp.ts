// Kode OTP verifikasi akun masyarakat — dikirim via WhatsApp (Fonnte) dan Email (SMTP).
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppNotification } from '@/lib/whatsapp';
import { sendEmailNotification } from '@/lib/email';
import { DESA } from '@/lib/desa-config';

export const OTP_TTL_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export interface OtpUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

function buildOtpText(code: string) {
  return (
    `Kode verifikasi akun DesaSmart: ${code}\n\n` +
    `Kode berlaku ${OTP_TTL_MINUTES} menit. Masukkan kode ini di halaman verifikasi untuk mengaktifkan akun Anda.\n` +
    `JANGAN bagikan kode ini kepada siapa pun.\n\n` +
    `- Pemerintah ${DESA.nama}`
  );
}

// Simpan hash OTP lalu kirim ke WhatsApp & Email.
// Minimal satu kanal harus berhasil; kegagalan sebagian dilaporkan lewat status.
export async function issueOtpForUser(user: OtpUser) {
  const code = generateOtpCode();
  const otpHash = await bcrypt.hash(code, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
      otpSentAt: new Date(),
    },
  });

  const status = { whatsapp: false, email: false };
  const text = buildOtpText(code);

  if (user.phone) {
    try {
      await sendWhatsAppNotification(user.phone, text);
      status.whatsapp = true;
    } catch (error) {
      console.error('OTP WhatsApp delivery failed:', error);
    }
  }

  try {
    await sendEmailNotification(
      user.email,
      `Kode Verifikasi Akun DesaSmart — ${DESA.nama}`,
      text
    );
    status.email = true;
  } catch (error) {
    console.error('OTP email delivery failed:', error);
  }

  if (!status.whatsapp && !status.email) {
    throw new Error(
      'Kode verifikasi gagal dikirim ke WhatsApp maupun Email. Periksa nomor dan alamat email Anda, lalu kirim ulang.'
    );
  }

  return status;
}

export function otpCooldownRemaining(user: { otpSentAt: Date | null }): number {
  if (!user.otpSentAt) return 0;
  const elapsed = (Date.now() - user.otpSentAt.getTime()) / 1000;
  return Math.max(0, Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed));
}

// Kembalikan user yang cocok bila kode benar & belum kedaluwarsa, selain itu alasan kegagalan.
export async function matchOtpCode(
  user: { id: string; otpCode: string | null; otpExpiresAt: Date | null },
  code: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!user.otpCode || !user.otpExpiresAt) {
    return { ok: false, reason: 'Kode OTP belum dikirim. Gunakan tombol kirim ulang kode.' };
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'Kode OTP kedaluwarsa. Kirim ulang kode dan coba lagi.' };
  }
  const match = await bcrypt.compare(code.trim(), user.otpCode);
  if (!match) {
    return { ok: false, reason: 'Kode OTP salah. Periksa kembali kode dari WhatsApp/Email Anda.' };
  }
  return { ok: true };
}

export async function clearOtp(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { otpCode: null, otpExpiresAt: null, otpSentAt: null },
  });
}
