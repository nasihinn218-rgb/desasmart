'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Download, 
  AlertTriangle, 
  Eye, 
  Sparkles,
  Loader2,
  Layers,
  Home
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import AdminSidebar from '@/components/AdminSidebar';
import StatusBadge from '@/components/StatusBadge';
import ApplicationTaskbar from '@/components/ApplicationTaskbar';
import RowActionMenu from '@/components/RowActionMenu';
import { DESA } from '@/lib/desa-config';

interface DashboardUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  roleDisplayName?: string;
}

interface DashboardApplication {
  id: string;
  status: string;
  applicationNumber: string;
  createdAt: string;
  purposeCategory: string;
  purposeDescription: string;
  citizen: { fullName: string; nik: string } | null;
}

export default function MasyarakatDashboard() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, appRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/applications'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }

        if (appRes.ok) {
          const appData = await appRes.json();
          setApplications(appData.applications || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Memuat portal masyarakat...</p>
        </div>
      </div>
    );
  }

  const activeApps = applications.filter(
    (a) => !['COMPLETED', 'REJECTED'].includes(a.status)
  );
  const waitingReview = applications.filter((a) =>
    ['SUBMITTED', 'STAFF_REVIEW', 'SUPERADMIN_REVIEW', 'HEAD_REVIEW'].includes(a.status)
  );
  const completedApps = applications.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="min-h-screen font-sans bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      <DashboardHeader user={user || { id: '', name: 'Warga', email: '', role: 'MASYARAKAT' }} />
      <AdminSidebar role="MASYARAKAT" />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1">
        {/* Welcome Banner (Kartu Raised berlatar --bg, judul besar, ikon inset, label normal) */}
        <div className="neu-raised p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 neu-pill-inset">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              <span>Portal layanan surat {DESA.nama}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
              Selamat datang, {user?.name || 'Warga'}!
            </h1>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Ajukan Surat Keterangan Tidak Mampu (SKTM) secara online kapan saja. Pantau proses pemeriksaan dari staf hingga tanda tangan Kepala Desa secara transparan.
            </p>
            <div className="pt-1">
              <Link
                href="/dashboard/masyarakat/new"
                className="neu-btn-primary"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Ajukan SKTM baru</span>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center neu-circle-inset !w-24 !h-24 shrink-0">
            <Home className="h-10 w-10 text-[var(--accent)]" />
          </div>
        </div>

        {/* 3 Summary Cards (Raised, Angka besar di tengah atas, label di bawah) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="neu-raised p-6 text-center space-y-1">
            <h3 className="text-4xl font-extrabold stat-val-blue">{activeApps.length}</h3>
            <p className="text-xs font-bold text-[var(--muted)]">Pengajuan Aktif</p>
            <p className="text-[11px] text-[var(--muted)]">Sedang dalam proses</p>
          </div>

          <div className="neu-raised p-6 text-center space-y-1">
            <h3 className="text-4xl font-extrabold stat-val-orange">{waitingReview.length}</h3>
            <p className="text-xs font-bold text-[var(--muted)]">Menunggu Pemeriksaan</p>
            <p className="text-[11px] text-[var(--muted)]">Staf / Superadmin / Kades</p>
          </div>

          <div className="neu-raised p-6 text-center space-y-1">
            <h3 className="text-4xl font-extrabold stat-val-green">{completedApps.length}</h3>
            <p className="text-xs font-bold text-[var(--muted)]">SKTM Selesai</p>
            <p className="text-[11px] text-[var(--muted)]">Siap diunduh / dicetak</p>
          </div>
        </div>

        {/* Taskbar Progres Pengajuan */}
        {applications.length > 0 && <ApplicationTaskbar applications={applications} />}

        {/* Action Alert Banner for NEED_REVISION if any */}
        {applications.some((a) => a.status === 'NEED_REVISION') && (
          <div className="neu-raised p-5 flex items-center justify-between gap-4 border-l-4 border-amber-500">
            <div className="flex items-center gap-3">
              <div className="neu-circle-inset-sm">
                <AlertTriangle className="w-5 h-5 stat-val-orange" />
              </div>
              <div>
                <p className="text-xs font-bold stat-val-orange">Perhatian: Ada Pengajuan Perlu Perbaikan</p>
                <p className="text-[11px] text-[var(--muted)]">
                  Petugas loket desa meminta Anda melengkapi atau memperbaiki dokumen. Silakan buka detail pengajuan untuk membaca instruksi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Applications List (Panel Raised seluruh tabel, Header Inset tipis, antarbaris dipisah border tipis) */}
        <div className="neu-table-panel p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--ink)]">Riwayat Pengajuan SKTM Anda</h3>
              <p className="text-xs text-[var(--muted)]">Daftar permohonan surat yang pernah Anda buat</p>
            </div>

            <Link
              href="/dashboard/masyarakat/new"
              className="neu-pill !min-h-[40px] !py-2 !px-4 text-xs font-bold"
            >
              + Pengajuan Baru
            </Link>
          </div>

          <div className="overflow-x-auto">
            {applications.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-[var(--muted)] mx-auto" />
                <p className="text-sm font-semibold text-[var(--ink)]">Belum Ada Pengajuan SKTM</p>
                <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                  Anda belum pernah mengajukan Surat Keterangan Tidak Mampu secara online. Klik tombol di bawah untuk memulai.
                </p>
                <Link
                  href="/dashboard/masyarakat/new"
                  className="neu-btn-primary !min-h-[42px] !py-2 !px-4 text-xs mt-2"
                >
                  Ajukan SKTM Sekarang
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="neu-table-header text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="py-3 px-4">No. Pengajuan</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">Tanggal Buat</th>
                    <th className="py-3 px-4">Keperluan SKTM</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--shadow-dark)]/15 text-xs text-[var(--ink)]">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-semibold text-slate-900">
                          {app.citizen?.fullName || user?.name || '-'}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-500">
                          NIK: {app.citizen?.nik || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(app.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{app.purposeCategory}</span>
                        <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                          {app.purposeDescription}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <RowActionMenu>
                          {(close) => (
                            <>
                              <button
                                type="button"
                                disabled={app.status !== 'COMPLETED'}
                                title={
                                  app.status !== 'COMPLETED'
                                    ? 'Tersedia setelah surat terbit'
                                    : 'Pratinjau surat sebelum diunduh'
                                }
                                onClick={() => {
                                  close();
                                  window.open(`/api/applications/${app.id}/pdf?display=inline`, '_blank');
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Lihat Surat
                              </button>
                              <a
                                href={`/api/applications/${app.id}/pdf`}
                                download
                                onClick={(event) => {
                                  if (app.status !== 'COMPLETED') {
                                    event.preventDefault();
                                    return;
                                  }
                                  close();
                                }}
                                title={
                                  app.status !== 'COMPLETED'
                                    ? 'Tersedia setelah surat terbit'
                                    : 'Unduh surat (PDF)'
                                }
                                className={`flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold ${
                                  app.status === 'COMPLETED'
                                    ? 'text-slate-700 hover:bg-slate-50'
                                    : 'cursor-not-allowed text-slate-400'
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Unduh Surat
                              </a>
                              <Link
                                href={`/dashboard/masyarakat/applications/${app.id}`}
                                onClick={close}
                                className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Detail
                              </Link>
                            </>
                          )}
                        </RowActionMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
