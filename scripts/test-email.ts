// Utilitas uji kirim email SMTP (jalankan: npx tsx scripts/test-email.ts [tujuan]).
// Memuat .env secara manual lalu mengirim email percobaan lewat src/lib/email.ts.
import { readFileSync } from 'fs';
import { sendEmailNotification } from '../src/lib/email';

for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!match) continue;
  let value = match[2].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[match[1]] = value;
}

const to = process.argv[2] || process.env.SMTP_USER || process.env.EMAIL_FROM;

(async () => {
  if (!to) {
    console.error('EMAIL_FAIL: tidak ada tujuan (isi argumen atau SMTP_USER di .env).');
    process.exit(1);
  }
  try {
    await sendEmailNotification(
      to,
      'Tes Notifikasi DesaSmart',
      'Selamat! Konfigurasi email DesaSmart berhasil.\n\nJika Anda menerima pesan ini, sistem notifikasi email sudah siap digunakan.'
    );
    console.log('EMAIL_OK terkirim ke ' + to);
  } catch (error) {
    console.error('EMAIL_FAIL: ' + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
})();
