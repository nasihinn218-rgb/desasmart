export async function sendWhatsAppNotification(to: string, message: string) {
  const apiKey = process.env.FONNTE_API_KEY;
  if (!apiKey) {
    throw new Error('FONNTE_API_KEY belum dikonfigurasi.');
  }

  const digits = to.replace(/\D/g, '');
  const target = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('8')
      ? `62${digits}`
      : digits;

  if (!/^628\d{8,11}$/.test(target)) {
    throw new Error('Nomor WhatsApp penerima tidak valid.');
  }

  const body = new FormData();
  body.set('target', target);
  body.set('message', message);

  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: apiKey },
    body,
  });

  if (!response.ok) {
    throw new Error(`Fonnte gagal mengirim pesan (HTTP ${response.status}).`);
  }

  const result: unknown = await response.json();
  if (
    typeof result !== 'object' ||
    result === null ||
    !('status' in result) ||
    result.status !== true
  ) {
    throw new Error('Fonnte tidak menerima permintaan pengiriman pesan.');
  }
}
