// Pengirim email SMTP untuk notifikasi proses ke masyarakat.
// Konfigurasi dibaca dari .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM.
import nodemailer from 'nodemailer';

export async function sendEmailNotification(to: string, subject: string, text: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'Konfigurasi email belum lengkap. Isi SMTP_HOST, SMTP_USER, dan SMTP_PASS pada file .env.'
    );
  }

  const port = SMTP_PORT ? Number(SMTP_PORT) : 587;

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
