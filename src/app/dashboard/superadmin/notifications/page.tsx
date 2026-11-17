'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  BellRing,
  CalendarClock,
  Check,
  Loader2,
  Search,
  Send,
  Users,
} from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import DashboardHeader from '@/components/DashboardHeader';

interface Recipient {
  id: string;
  name: string;
  phone: string | null;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface SendResult {
  recipientCount: number;
  delivery: { sent: number; noPhone: number; failed: number };
}

// Template pengumuman siap pakai — tinggal pilih, judul & pesan terisi otomatis (bisa diubah manual).
const ANNOUNCEMENT_TEMPLATES = [
  {
    id: 'jadwal-layanan',
    label: 'Jadwal Layanan Kantor Desa',
    title: 'Jadwal Layanan Kantor Desa Silihasih',
    message:
      'Yth. warga Desa Silihasih,\n\n' +
      'Diberitahukan bahwa pelayanan administrasi Kantor Desa dibuka pada:\n' +
      'Hari: Senin - Jumat\n' +
      'Pukul: 08.00 - 14.00 WIB\n' +
      'Istirahat: 12.00 - 13.00 WIB\n\n' +
      'Layanan SKTM online tetap dapat diajukan kapan saja melalui aplikasi DesaSmart.\n\n' +
      'Hormat kami,\nStaf Pelayanan Desa Silihasih',
  },
  {
    id: 'libur-nasional',
    label: 'Libur / Tutup Layanan',
    title: 'Penutupan Layanan Kantor Desa',
    message:
      'Yth. warga Desa Silihasih,\n\n' +
      'Diberitahukan bahwa layanan Kantor Desa TUTUP pada tanggal yang ditentukan (hari libur nasional / kegiatan desa).\n\n' +
      'Pengajuan SKTM melalui aplikasi DesaSmart tetap dapat diajukan dan akan diproses pada hari kerja berikutnya.\n\n' +
      'Mohon maaf atas ketidaknyamanannya.\n\n' +
      'Hormat kami,\nPemerintah Desa Silihasih',
  },
  {
    id: 'undangan',
    label: 'Undangan Kegiatan Warga',
    title: 'Undangan Kegiatan Desa Silihasih',
    message:
      'Yth. warga Desa Silihasih,\n\n' +
      'Dengan hormat, Anda diundang untuk menghadiri kegiatan desa yang akan diselenggarakan pada:\n' +
      'Hari/Tanggal: [isi tanggal]\n' +
      'Pukul: [isi jam]\n' +
      'Tempat: [isi lokasi]\n\n' +
      'Kehadiran Anda sangat berarti bagi kelancaran acara.\n\n' +
      'Hormat kami,\nPemerintah Desa Silihasih',
  },
  {
    id: 'surat-selesai',
    label: 'Informasi Surat Siap Diambil',
    title: 'Surat Anda Siap Diambil di Kantor Desa',
    message:
      'Yth. warga Desa Silihasih,\n\n' +
      'Pengajuan surat (SKTM) Anda telah selesai diproses dan SIAP DIAMBIL di Kantor Desa Silihasih pada jam pelayanan (Senin-Jumat, 08.00-14.00 WIB).\n\n' +
      'Mohon membawa Kartu Tanda Penduduk (KTP) asli saat pengambilan.\n\n' +
      'Terima kasih.\n\n' +
      'Hormat kami,\nStaf Pelayanan Desa Silihasih',
  },
  {
    id: 'pengumuman-umum',
    label: 'Pengumuman Umum',
    title: 'Pengumuman Pemerintah Desa Silihasih',
    message:
      'Yth. warga Desa Silihasih,\n\n' +
      '[Tulis isi pengumuman di sini — misalnya informasi kegiatan, perubahan jadwal, imbauan, atau informasi penting lainnya.]\n\n' +
      'Untuk informasi lebih lanjut silakan hubungi Kantor Desa pada jam pelayanan.\n\n' +
      'Hormat kami,\nPemerintah Desa Silihasih',
  },
];

export default function ScheduleNotificationsPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('Informasi Jadwal Layanan Desa');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SendResult | null>(null);

  const loadRecipients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [meResponse, recipientResponse] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/admin/notifications'),
      ]);
      const [meData, recipientData] = await Promise.all([
        meResponse.json(),
        recipientResponse.json(),
      ]);
      if (!meResponse.ok) throw new Error(meData.error || 'Sesi akun tidak valid.');
      if (!recipientResponse.ok) {
        throw new Error(recipientData.error || 'Gagal memuat daftar warga.');
      }
      setCurrentUser(meData.user);
      setRecipients(recipientData.recipients);
    } catch (loadError) {
      console.error('Load notification recipients error:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat daftar warga.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadRecipients);
  }, [loadRecipients]);

  const filteredRecipients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    if (!query) return recipients;
    return recipients.filter((recipient) =>
      `${recipient.name} ${recipient.phone ?? ''}`.toLocaleLowerCase('id-ID').includes(query)
    );
  }, [recipients, search]);

  const allFilteredSelected =
    filteredRecipients.length > 0 &&
    filteredRecipients.every((recipient) => selectedIds.includes(recipient.id));

  const toggleRecipient = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
    setResult(null);
  };

  const toggleFilteredRecipients = () => {
    setSelectedIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filteredRecipients.some((recipient) => recipient.id === id));
      }
      const next = new Set(current);
      filteredRecipients.forEach((recipient) => next.add(recipient.id));
      return [...next];
    });
    setResult(null);
  };

  const sendAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedIds.length === 0) {
      setError('Pilih minimal satu warga sebagai penerima.');
      return;
    }
    if (!window.confirm(`Kirim pengumuman ini ke ${selectedIds.length} warga yang dipilih?`)) {
      return;
    }

    setSending(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, recipientIds: selectedIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pengumuman gagal dikirim.');
      setResult(data);
      setSelectedIds([]);
      setMessage('');
    } catch (sendError) {
      console.error('Send schedule notification error:', sendError);
      setError(sendError instanceof Error ? sendError.message : 'Pengumuman gagal dikirim.');
    } finally {
      setSending(false);
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardHeader
        user={
          currentUser ?? {
            id: '',
            name: 'Superadmin',
            email: '',
            role: 'SUPERADMIN',
          }
        }
      />
      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar role="SUPERADMIN" />
        <main className="min-w-0 flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-3xl border border-white/80 bg-gradient-to-r from-violet-800 via-purple-800 to-indigo-900 p-6 text-white shadow-xl shadow-violet-950/15 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <CalendarClock className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-200">
                  Portal Superadmin
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Pengumuman Jadwal Layanan
                </h1>
                <p className="mt-2 text-sm text-violet-100/80">
                  Kirim informasi jadwal melalui notifikasi aplikasi dan WhatsApp warga terpilih.
                </p>
              </div>
            </div>
          </section>

          {error && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}
          {result && (
            <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-bold">Notifikasi aplikasi dibuat untuk {result.recipientCount} warga.</p>
              <p className="mt-1">
                WA terkirim: {result.delivery.sent} · tanpa nomor WA: {result.delivery.noPhone} · gagal: {result.delivery.failed}
              </p>
            </div>
          )}

          <form onSubmit={sendAnnouncement} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <section className="space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-900/[0.04] sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Isi pengumuman</h2>
                  <p className="text-xs text-slate-500">Pesan yang sama dikirim ke aplikasi dan WhatsApp.</p>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Template pengumuman (opsional)</span>
                <select
                  value=""
                  onChange={(event) => {
                    const template = ANNOUNCEMENT_TEMPLATES.find((item) => item.id === event.target.value);
                    if (template) {
                      setTitle(template.title);
                      setMessage(template.message);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                >
                  <option value="" disabled>
                    Pilih template siap kirim...
                  </option>
                  {ANNOUNCEMENT_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
                <span className="block text-xs text-slate-400">
                  Judul dan pesan terisi otomatis — tetap bisa diedit manual sebelum dikirim.
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Judul</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={100}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                  placeholder="Contoh: Jadwal pelayanan desa minggu ini"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">Pesan dan detail jadwal</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={1000}
                  minLength={5}
                  required
                  rows={7}
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-relaxed outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10"
                  placeholder="Contoh: Pelayanan administrasi dibuka Senin–Jumat pukul 08.00–14.00 di Kantor Desa Silihasih."
                />
                <span className="block text-right text-xs text-slate-400">{message.length}/1.000</span>
              </label>

              <button
                type="submit"
                disabled={sending || selectedIds.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Mengirim...' : `Kirim ke ${selectedIds.length} warga`}
              </button>
              <p className="text-xs leading-relaxed text-slate-500">
                Maksimal 50 penerima per pengiriman. Pastikan tanggal dan jam layanan sudah benar sebelum mengirim.
              </p>
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg shadow-slate-900/[0.04]">
              <div className="space-y-4 border-b border-slate-100 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-violet-700" />
                    <h2 className="font-bold text-slate-900">Pilih warga</h2>
                  </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {selectedIds.length} dipilih
                  </span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-purple-500"
                    placeholder="Cari nama atau nomor WhatsApp"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleFilteredRecipients}
                  disabled={filteredRecipients.length === 0}
                  className="text-xs font-bold text-violet-700 hover:text-violet-900 disabled:text-slate-400"
                >
                  {allFilteredSelected ? 'Batalkan pilihan hasil pencarian' : 'Pilih semua hasil pencarian'}
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat warga...
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    {recipients.length === 0 ? 'Belum ada akun warga aktif.' : 'Warga tidak ditemukan.'}
                  </div>
                ) : (
                  filteredRecipients.map((recipient) => {
                    const selected = selectedIds.includes(recipient.id);
                    return (
                      <label
                        key={recipient.id}
                        className="flex cursor-pointer items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 sm:px-6"
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRecipient(recipient.id)}
                          className="sr-only"
                        />
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-300 bg-white text-transparent'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-800">{recipient.name}</span>
                          <span className={`block truncate text-xs ${recipient.phone ? 'text-slate-500' : 'text-amber-700'}`}>
                            {recipient.phone || 'Belum ada nomor WhatsApp'}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </section>
          </form>
        </main>
      </div>
    </div>
  );
}
