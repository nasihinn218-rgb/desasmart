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
  Layers
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
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
    <div className="min-h-screen bg-slate-50 font-sans">
      <DashboardHeader user={user || { id: '', name: 'Warga', email: '', role: 'MASYARAKAT' }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 text-white shadow-xl shadow-emerald-950/15 sm:p-7 lg:flex-row lg:items-center">
          <div aria-hidden="true" className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" />
          <div className="relative z-10 min-w-0 flex-1 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              Portal Layanan Surat {DESA.nama}
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Selamat datang, {user?.name || 'Warga'}!
            </h1>
            <p className="max-w-xl text-xs leading-relaxed text-emerald-100/90 sm:text-sm">
              Ajukan Surat Keterangan Tidak Mampu (SKTM) secara online kapan saja. Pantau proses verifikasi dari staf hingga tanda tangan Kepala Desa secara transparan.
            </p>
            <Link
              href="/dashboard/masyarakat/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-emerald-800 shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-50 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4 text-emerald-600" />
              Ajukan SKTM Baru
            </Link>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengajuan Aktif</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{activeApps.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Sedang dalam proses</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menunggu Pemeriksaan</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{waitingReview.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Staf / Superadmin / Kades</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">SKTM Selesai</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-1">{completedApps.length}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Siap diunduh / cetak</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Taskbar Progres Pengajuan */}
        {applications.length > 0 && <ApplicationTaskbar applications={applications} />}

        {/* Action Alert Banner for NEED_REVISION if any */}
        {applications.some((a) => a.status === 'NEED_REVISION') && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">Perhatian: Ada Pengajuan Perlu Perbaikan</p>
                <p className="text-[11px] text-amber-700">
                  Petugas loket desa meminta Anda melengkapi atau memperbaiki dokumen. Silakan buka detail pengajuan untuk membaca instruksi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Riwayat Pengajuan SKTM Anda</h3>
              <p className="text-xs text-slate-500">Daftar permohonan surat yang pernah Anda buat</p>
            </div>

            <Link
              href="/dashboard/masyarakat/new"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              + Pengajuan Baru
            </Link>
          </div>

          <div className="overflow-x-auto">
            {applications.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Belum Ada Pengajuan SKTM</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Anda belum pernah mengajukan Surat Keterangan Tidak Mampu secara online. Klik tombol di bawah untuk memulai.
                </p>
                <Link
                  href="/dashboard/masyarakat/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold mt-2"
                >
                  Ajukan SKTM Sekarang
                </Link>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">No. Pengajuan</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">Tanggal Buat</th>
                    <th className="py-3 px-4">Keperluan SKTM</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
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
