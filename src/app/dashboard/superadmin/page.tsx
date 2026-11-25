'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  FileCheck2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Eye,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import AdminSidebar from '@/components/AdminSidebar';
import StatusBadge from '@/components/StatusBadge';
import VillageDatabasePanel from '@/components/VillageDatabasePanel';
import AiSettingsPanel from '@/components/AiSettingsPanel';

export default function SuperadminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('SUPERADMIN_REVIEW');

  const fetchData = async () => {
    try {
      const [meRes, appRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/applications?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`),
        fetch('/api/stats'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        setApplications(appData.applications || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      fetchData();
    }, 5000);
    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans flex flex-col">
      <DashboardHeader user={user || { name: 'Superadmin', email: '', role: 'SUPERADMIN' }} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar
          role="SUPERADMIN"
          counts={{
            pendingSuperadmin: stats?.superadminReview || 0,
          }}
        />

        <main className="min-w-0 flex-1 space-y-7 p-4 sm:p-6 lg:p-8">
          {/* Header Title (Kartu Raised berlatar --bg, judul besar, ikon inset, label normal) */}
          <div className="neu-raised p-6 sm:p-8 flex items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 neu-pill-inset">
                <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                <span>Portal verifikasi</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
                Verifikasi Kasi Pelayanan
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                Verifikasi lanjutan terhadap berkas yang telah diperiksa oleh staf loket
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center neu-circle-inset !w-20 !h-20 shrink-0">
              <ShieldCheck className="h-9 w-9 text-[var(--accent)]" />
            </div>
          </div>

          {/* 5 Summary Cards (Raised, Angka besar di tengah atas, label di bawah) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-[var(--ink)]">{stats?.total ?? 0}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Total Pengajuan</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Semua permohonan</p>
            </div>

            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold stat-val-purple">{stats?.superadminReview ?? 0}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Menunggu Verifikasi</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Antrean meja superadmin</p>
            </div>

            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold stat-val-orange">{stats?.needRevision ?? 6}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Perlu Perbaikan</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Menunggu pembaruan warga</p>
            </div>

            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold stat-val-green">
                {(stats?.headReview ?? 0) + (stats?.completed ?? 0)}
              </h3>
              <p className="text-xs font-bold text-[var(--muted)]">Disetujui</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Diteruskan / selesai</p>
            </div>

            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1 col-span-2 sm:col-span-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold stat-val-red">{stats?.rejected ?? 0}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Ditolak</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Tidak memenuhi syarat</p>
            </div>
          </div>

          {/* Pengaturan AI Chatbot */}
          <AiSettingsPanel accent="violet" />

          {/* Database Wilayah Desa (dusun / RW / RT) */}
          <VillageDatabasePanel />

          {/* Search & Filter Bar (Raised, Input Inset, Tombol Solid Accent) */}
          <div className="neu-raised p-4 sm:p-5 flex flex-col sm:flex-row items-stretch justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan Nama, NIK, atau Nomor Surat..."
                  className="neu-inset w-full min-h-[46px] py-2.5 pl-10 pr-3 text-sm text-[var(--ink)] outline-none"
                />
              </div>
              <button
                type="submit"
                className="neu-btn-primary shrink-0 !min-h-[46px] !py-2.5 !px-6 text-sm"
              >
                Cari
              </button>
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neu-inset w-full sm:w-auto min-h-[46px] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] outline-none cursor-pointer"
            >
              <option value="SUPERADMIN_REVIEW">Menunggu Verifikasi (Antrean Saya)</option>
              <option value="HEAD_REVIEW">Menunggu Kades (Telah Diverifikasi)</option>
              <option value="COMPLETED">Selesai / Diterbitkan</option>
              <option value="NEED_REVISION">Dikembalikan (Perbaikan)</option>
              <option value="REJECTED">Ditolak</option>
              <option value="ALL">Semua Status</option>
            </select>
          </div>

          {/* Verification Table (Panel Raised seluruh tabel, Header Inset tipis, baris dipisah border tipis) */}
          <div className="neu-table-panel p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--shadow-dark)]/20">
              <div>
                <h3 className="font-extrabold text-base text-[var(--ink)]">Antrean Verifikasi Kasi Pelayanan</h3>
                <p className="text-xs text-[var(--muted)]">Menampilkan {applications.length} permohonan</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="neu-table-header text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Pemohon</th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">Tanggal Masuk</th>
                    <th className="py-3 px-4">Catatan Staf Loket</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--shadow-dark)]/15 text-xs text-[var(--ink)]">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Tidak ada berkas yang menunggu verifikasi superadmin saat ini.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 max-w-[180px] truncate font-bold text-slate-900">
                          {app.citizen?.fullName || app.user?.name}
                        </td>
                        <td className="py-3.5 px-4 max-w-[150px] truncate font-mono text-slate-600">
                          {app.citizen?.nik}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {new Date(app.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                          {app.currentStaffNote || 'Pemeriksaan staf selesai.'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/dashboard/superadmin/applications/${app.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs border border-purple-200 transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Verifikasi
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
