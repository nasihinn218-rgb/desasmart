'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BellRing,
  Mail,
  MessageCircle,
  Search,
  Send,
  RefreshCw,
  Loader2,
  FileText,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import AdminSidebar from '@/components/AdminSidebar';
import StatusBadge from '@/components/StatusBadge';
import {
  PROCESS_TEMPLATES,
  fillTemplate,
  getTemplateByStatus,
  type ProcessChannel,
  type TemplateData,
} from '@/lib/notification-templates';

const OFFICER_ROLES = ['STAFF', 'SUPERADMIN', 'KEPALA_DESA'];

interface AppItem {
  id: string;
  applicationNumber: string;
  status: string;
  purposeCategory: string;
  citizenName: string;
  phone: string | null;
  email: string;
  villageName: string;
  documentNumber: string | null;
  note: string;
  createdAt: string;
}

function buildTemplateData(app: AppItem): Partial<TemplateData> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    nama: app.citizenName,
    nomor_pengajuan: app.applicationNumber,
    nomor_surat: app.documentNumber || '-',
    keperluan: app.purposeCategory,
    tanggal: new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    catatan: app.note || '-',
    link_verifikasi: app.documentNumber ? `${baseUrl}/verify/${app.documentNumber}` : '-',
    desa: app.villageName,
  };
}

export default function ProcessNotificationsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateStatus, setTemplateStatus] = useState('SUBMITTED');
  const [channel, setChannel] = useState<ProcessChannel>('WHATSAPP');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const selectedApp = apps.find((app) => app.id === selectedId) || null;

  const applyTemplate = useCallback(
    (app: AppItem | null, status: string, targetChannel: ProcessChannel) => {
      if (!app) return;
      const template = getTemplateByStatus(status);
      if (!template) return;
      const data = buildTemplateData(app);
      setSubject(fillTemplate(template.emailSubject, data));
      setMessage(fillTemplate(targetChannel === 'WHATSAPP' ? template.waMessage : template.emailBody, data));
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, appsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/notifications/process'),
        ]);
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApps(appsData.applications || []);
        } else if (appsRes.status === 401 || appsRes.status === 403) {
          setLoadError('Akses ditolak. Halaman ini khusus Staf, Superadmin, dan Kepala Desa.');
        } else {
          setLoadError('Gagal memuat daftar pengajuan.');
        }
      } catch (e) {
        console.error(e);
        setLoadError('Gagal memuat data. Periksa koneksi lalu muat ulang.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectApp = (app: AppItem) => {
    setSelectedId(app.id);
    setResult(null);
    const initialStatus = getTemplateByStatus(app.status) ? app.status : 'SUBMITTED';
    setTemplateStatus(initialStatus);
    applyTemplate(app, initialStatus, channel);
  };

  const handleTemplateChange = (status: string) => {
    setTemplateStatus(status);
    applyTemplate(selectedApp, status, channel);
  };

  const handleChannelChange = (next: ProcessChannel) => {
    setChannel(next);
    applyTemplate(selectedApp, templateStatus, next);
  };

  const filteredApps = apps.filter((app) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      app.citizenName.toLowerCase().includes(term) ||
      app.applicationNumber.toLowerCase().includes(term) ||
      app.status.toLowerCase().includes(term)
    );
  });

  const handleSend = async () => {
    if (!selectedApp || sending) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/notifications/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          channel,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, text: data.message || 'Notifikasi terkirim.' });
      } else {
        setResult({ ok: false, text: data.error || 'Gagal mengirim notifikasi.' });
      }
    } catch (e) {
      console.error(e);
      setResult({ ok: false, text: 'Gagal mengirim notifikasi. Periksa koneksi.' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isOfficer = user && OFFICER_ROLES.includes(user.role);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <DashboardHeader user={user || { name: 'Petugas', email: '', role: 'STAFF' }} />

      <div className="flex-1 flex">
        <AdminSidebar role={user?.role || 'STAFF'} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
          {!isOfficer ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 max-w-xl mx-auto">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
              <h1 className="text-xl font-black text-slate-900">Akses Ditolak</h1>
              <p className="text-sm text-slate-500">
                {loadError || 'Halaman notifikasi proses hanya dapat diakses oleh Staf, Superadmin, dan Kepala Desa.'}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <BellRing className="w-6 h-6 text-emerald-700" />
                  Notifikasi Proses Pengajuan
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Kirim notifikasi WhatsApp dan Email ke pemohon berdasarkan proses/status pengajuan. Teks
                  template otomatis terisi — tetap bisa diubah manual sebelum dikirim.
                </p>
              </div>

              {loadError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                  {loadError}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] gap-6 items-start">
                {/* Komposer pesan */}
                <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
                  {!selectedApp ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
                      Pilih pengajuan dari daftar di sebelah kanan untuk memuat template notifikasi.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-wrap items-center gap-3">
                      <UserCheck className="w-8 h-8 text-emerald-700 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{selectedApp.citizenName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{selectedApp.applicationNumber}</p>
                      </div>
                      <StatusBadge status={selectedApp.status} />
                      <p className="w-full text-[11px] text-slate-600">
                        <span className="font-semibold">WhatsApp:</span> {selectedApp.phone || '- tidak ada -'}{' '}
                        <span className="mx-1 text-slate-300">|</span>
                        <span className="font-semibold">Email:</span> {selectedApp.email}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Template Proses
                    </label>
                    <select
                      value={templateStatus}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      disabled={!selectedApp}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
                    >
                      {PROCESS_TEMPLATES.map((template) => (
                        <option key={template.status} value={template.status}>
                          {template.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Saluran Notifikasi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleChannelChange('WHATSAPP')}
                        disabled={!selectedApp}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                          channel === 'WHATSAPP'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChannelChange('EMAIL')}
                        disabled={!selectedApp}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${
                          channel === 'EMAIL'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400'
                        }`}
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </button>
                    </div>
                    {selectedApp && channel === 'WHATSAPP' && !selectedApp.phone && (
                      <p className="text-[11px] font-semibold text-rose-600">
                        Pemohon ini tidak memiliki nomor WhatsApp terdaftar — gunakan Email.
                      </p>
                    )}
                  </div>

                  {channel === 'EMAIL' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Subjek Email
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={!selectedApp}
                        placeholder="Subjek email..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Isi Pesan {channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}
                      </label>
                      <button
                        type="button"
                        onClick={() => applyTemplate(selectedApp, templateStatus, channel)}
                        disabled={!selectedApp}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 hover:border-emerald-400 hover:text-emerald-700 transition disabled:opacity-40"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Muat teks template
                      </button>
                    </div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      disabled={!selectedApp}
                      rows={12}
                      placeholder="Pilih pengajuan lalu template — teks bisa diketik manual di sini."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-slate-400">
                      Placeholder {'{nama}'}, {'{nomor_pengajuan}'}, {'{nomor_surat}'}, {'{keperluan}'},{' '}
                      {'{tanggal}'}, {'{catatan}'}, {'{link_verifikasi}'}, {'{desa}'} terisi otomatis.
                    </p>
                  </div>

                  {result && (
                    <div
                      className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
                        result.ok
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }`}
                    >
                      {result.text}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!selectedApp || !message.trim() || sending || (channel === 'WHATSAPP' && !selectedApp.phone)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending
                      ? 'Mengirim...'
                      : `Kirim Notifikasi ${channel === 'WHATSAPP' ? 'WhatsApp' : 'Email'}`}
                  </button>
                </section>

                {/* Pemilih pengajuan */}
                <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-700" />
                      Pilih Pengajuan
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400">{apps.length} pengajuan</span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari nama, nomor pengajuan, status..."
                      className="w-full bg-transparent text-xs focus:outline-none text-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredApps.length === 0 ? (
                      <p className="py-8 text-center text-xs text-slate-400">
                        {apps.length === 0 ? 'Belum ada pengajuan.' : 'Tidak ada pengajuan yang cocok.'}
                      </p>
                    ) : (
                      filteredApps.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => handleSelectApp(app)}
                          className={`w-full rounded-2xl border p-3 text-left transition ${
                            selectedId === app.id
                              ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                              : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{app.citizenName}</p>
                            <StatusBadge status={app.status} />
                          </div>
                          <p className="mt-1 text-[10px] font-mono text-slate-500">{app.applicationNumber}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            {app.purposeCategory}
                            <span className="mx-1 text-slate-300">|</span>
                            WA: {app.phone || '-'}<span className="mx-1 text-slate-300">|</span>
                            {app.email}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
