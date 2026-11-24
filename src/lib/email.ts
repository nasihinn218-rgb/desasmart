// Pengirim email SMTP untuk notifikasi proses ke masyarakat.
// Konfigurasi dibaca dari .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM.
import nodemailer from 'nodemailer';

export async function sendEmailNotification(to: string, subject: string, text: string) {
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = process.env.SMTP_PORT || '587';
  const SMTP_USER = process.env.SMTP_USER || 'nasihinn218@gmail.com';
  const SMTP_PASS = process.env.SMTP_PASS || 'cimj bhkw ukjx sxju';
  const EMAIL_FROM = process.env.EMAIL_FROM || 'Desa Smart <nasihinn218@gmail.com>';

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'Konfigurasi email belum lengkap. Isi SMTP_HOST, SMTP_USER, dan SMTP_PASS pada file .env.'
    );
  }

  const port = Number(SMTP_PORT);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Pada jaringan lokal (Laragon/proxy/antivirus) rantai sertifikat TLS sering
    // disisipi sertifikat self-signed sehingga Node menolak koneksi. Nonaktifkan
    // verifikasi sertifikat agar SMTP Gmail tetap dapat terhubung dan mengirim.
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject,
    text,
  });
}
