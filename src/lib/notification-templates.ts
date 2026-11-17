// Template notifikasi proses pengajuan SKTM.
// Dipakai bersama oleh halaman dasbor (klien) dan API pengiriman (server).
// Placeholder diisi otomatis saat pengajuan dipilih, teksnya tetap bisa diubah manual.

export type ProcessChannel = 'WHATSAPP' | 'EMAIL';

export interface ProcessTemplate {
  status: string;
  label: string;
  waTitle: string;
  waMessage: string;
  emailSubject: string;
  emailBody: string;
}

const SIGNATURE = 'Hormat kami,\nPemerintah Desa {desa}';
const FOOTER_EMAIL = 'Email ini dikirim otomatis oleh sistem Pelayanan Desa {desa}. Pesan ini tidak memerlukan balasan.';

export const PROCESS_TEMPLATES: ProcessTemplate[] = [
  {
    status: 'SUBMITTED',
    label: 'Pengajuan Diterima',
    waTitle: 'Pengajuan SKTM Diterima',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Pengajuan Surat Keterangan Tidak Mampu ({keperluan}) Anda telah DITERIMA oleh sistem Pelayanan Desa {desa} pada {tanggal}.\n\n' +
      'Nomor pengajuan: {nomor_pengajuan}\n\n' +
      'Pengajuan Anda akan segera diperiksa oleh Staf Loket Pelayanan. Silakan pantau progres melalui dashboard akun Anda.\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Anda Telah Diterima ({nomor_pengajuan})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Kami menginformasikan bahwa pengajuan Surat Keterangan Tidak Mampu ({keperluan}) Anda telah DITERIMA oleh sistem Pelayanan Desa {desa} pada {tanggal}.\n\n' +
      'Nomor pengajuan: {nomor_pengajuan}\n\n' +
      'Pengajuan Anda akan segera diperiksa oleh Staf Loket Pelayanan. Silakan pantau progres melalui dashboard akun Anda.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'STAFF_REVIEW',
    label: 'Sedang Diperiksa Staf Loket',
    waTitle: 'Pengajuan Sedang Diperiksa Staf',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} saat ini sedang DIPERIKSA oleh Staf Loket Pelayanan Desa {desa} ({tanggal}).\n\n' +
      'Mohon menunggu. Apabila dokumen memenuhi syarat, pengajuan akan diteruskan ke Kasi Pelayanan.\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Sedang Diperiksa Staf ({nomor_pengajuan})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} saat ini sedang DIPERIKSA oleh Staf Loket Pelayanan Desa {desa} per {tanggal}.\n\n' +
      'Mohon menunggu. Apabila dokumen memenuhi syarat, pengajuan akan diteruskan ke Kasi Pelayanan.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'NEED_REVISION',
    label: 'Perlu Perbaikan Dokumen',
    waTitle: 'Pengajuan Perlu Perbaikan',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} perlu DIPERBAIKI agar dapat diproses lebih lanjut.\n\n' +
      'Catatan petugas: {catatan}\n\n' +
      'Silakan perbaiki dokumen/data pada menu pengajuan Anda, kemudian ajukan kembali. Terima kasih.\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Perlu Perbaikan ({nomor_pengajuan})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} perlu DIPERBAIKI agar dapat diproses lebih lanjut.\n\n' +
      'Catatan petugas: {catatan}\n\n' +
      'Silakan perbaiki dokumen/data pada menu pengajuan Anda, kemudian ajukan kembali. Terima kasih.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'SUPERADMIN_REVIEW',
    label: 'Verifikasi Kasi Pelayanan',
    waTitle: 'Pengajuan Sedang Diverifikasi Kasi Pelayanan',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} telah lolos pemeriksaan staf dan saat ini sedang DIVERIFIKASI oleh Kasi Pelayanan Desa {desa} ({tanggal}).\n\n' +
      'Mohon menunggu hasil verifikasi berikutnya.\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Sedang Diverifikasi Kasi Pelayanan ({nomor_pengajuan})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} telah lolos pemeriksaan staf dan saat ini sedang DIVERIFIKASI oleh Kasi Pelayanan Desa {desa} per {tanggal}.\n\n' +
      'Mohon menunggu hasil verifikasi berikutnya.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'SUPERADMIN_APPROVED',
    label: 'Diverifikasi Kasi Pelayanan',
    waTitle: 'Pengajuan Diverifikasi Kasi Pelayanan',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} telah DIVERIFIKASI oleh Kasi Pelayanan Desa {desa} pada {tanggal}.\n\n' +
      'Pengajuan kini diteruskan ke Kepala Desa untuk persetujuan akhir.\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Diverifikasi Kasi Pelayanan ({nomor_pengajuan})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} telah DIVERIFIKASI oleh Kasi Pelayanan Desa {desa} pada {tanggal}.\n\n' +
      'Pengajuan kini diteruskan ke Kepala Desa untuk persetujuan akhir.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'HEAD_REVIEW',
    label: 'Menunggu Persetujuan Kepala Desa',
    waTitle: 'Menunggu Persetujuan Kepala Desa',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} sedang MENUNGGU PERSETUJUAN AKHIR dari Kepala Desa {desa} ({tanggal}).\n\n' +
      'Setelah disetujui, surat akan diterbitkan dan dapat diambil di Kantor Desa.\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Menunggu Persetujuan Kepala Desa ({nomor_pengajuan})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Pengajuan SKTM Anda dengan nomor {nomor_pengajuan} sedang MENUNGGU PERSETUJUAN AKHIR dari Kepala Desa {desa} per {tanggal}.\n\n' +
      'Setelah disetujui, surat akan diterbitkan dan dapat diambil di Kantor Desa.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'APPROVED',
    label: 'Disetujui Kepala Desa',
    waTitle: 'Pengajuan SKTM Disetujui',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Alhamdulillah, pengajuan SKTM Anda dengan nomor surat {nomor_surat} telah DISETUJUI oleh Kepala Desa {desa} pada {tanggal}.\n\n' +
      'Silakan ambil surat di Kantor Desa pada jam pelayanan. Keaslian surat dapat diperiksa di: {link_verifikasi}\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Anda Disetujui ({nomor_surat})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Alhamdulillah, pengajuan SKTM Anda dengan nomor surat {nomor_surat} telah DISETUJUI oleh Kepala Desa {desa} pada {tanggal}.\n\n' +
      'Silakan ambil surat di Kantor Desa pada jam pelayanan. Keaslian surat dapat diperiksa di: {link_verifikasi}\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'COMPLETED',
    label: 'Surat Resmi Terbit',
    waTitle: 'Surat SKTM Telah Terbit',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Surat Keterangan Tidak Mampu ({keperluan}) atas nama Anda telah RESMI DITERBITKAN pada {tanggal}.\n\n' +
      'Nomor surat: {nomor_surat}\n' +
      'Keaslian surat dapat diperiksa publik di: {link_verifikasi}\n\n' +
      'Silakan ambil surat fisik di Kantor Desa {desa}. Terima kasih.\n\n' +
      SIGNATURE,
    emailSubject: 'Surat SKTM Resmi Terbit ({nomor_surat})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Surat Keterangan Tidak Mampu ({keperluan}) atas nama Anda telah RESMI DITERBITKAN pada {tanggal}.\n\n' +
      'Nomor surat: {nomor_surat}\n' +
      'Keaslian surat dapat diperiksa publik di: {link_verifikasi}\n\n' +
      'Silakan ambil surat fisik di Kantor Desa {desa}. Terima kasih.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
  {
    status: 'REJECTED',
    label: 'Pengajuan Ditolak',
    waTitle: 'Pengajuan SKTM Ditolak',
    waMessage:
      'Assalamualaikum {nama},\n\n' +
      'Mohon maaf, pengajuan SKTM Anda dengan nomor {nomor_pengajuan} DITOLAK pada {tanggal}.\n\n' +
      'Alasan: {catatan}\n\n' +
      'Untuk pertanyaan lebih lanjut, silakan datang ke Kantor Desa {desa} pada jam pelayanan.\n\n' +
      SIGNATURE,
    emailSubject: 'Pengajuan SKTM Ditolak ({nomor_pengajuan})',
    emailBody:
      'Yth. {nama},\n\n' +
      'Mohon maaf, pengajuan SKTM Anda dengan nomor {nomor_pengajuan} DITOLAK pada {tanggal}.\n\n' +
      'Alasan: {catatan}\n\n' +
      'Untuk pertanyaan lebih lanjut, silakan datang ke Kantor Desa {desa} pada jam pelayanan.\n\n' +
      `${SIGNATURE}\n\n--\n${FOOTER_EMAIL}`,
  },
];

export interface TemplateData {
  nama: string;
  nomor_pengajuan: string;
  nomor_surat: string;
  keperluan: string;
  tanggal: string;
  catatan: string;
  link_verifikasi: string;
  desa: string;
}

/** Ganti semua placeholder {kunci} pada teks template dengan data pengajuan. */
export function fillTemplate(text: string, data: Partial<TemplateData>): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (data as Record<string, string | undefined>)[key];
    return value === undefined || value === null || value === '' ? match : value;
  });
}

export function getTemplateByStatus(status: string): ProcessTemplate | undefined {
  return PROCESS_TEMPLATES.find((template) => template.status === status);
}
