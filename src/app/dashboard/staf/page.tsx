'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  Filter, 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Loader2, 
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import AdminSidebar from '@/components/AdminSidebar';
import StatusBadge from '@/components/StatusBadge';
import AiSettingsPanel from '@/components/AiSettingsPanel';
import VillageDatabasePanel from '@/components/VillageDatabasePanel';

export default function StaffDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  const fetchData = async () => {
    try {
      const [meRes, appRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/applications?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}&date=${dateFilter}`),
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
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] font-sans flex flex-col">
      <DashboardHeader user={user || { name: 'Staf Pelayanan', email: '', role: 'STAFF' }} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar
          role="STAFF"
          counts={{
            pendingReview: stats?.staffReview || 0,
          }}
        />

        <main className="min-w-0 flex-1 space-y-7 p-4 sm:p-6 lg:p-8">
          {/* Header Title (Kartu Raised berlatar --bg, judul besar, ikon inset, label normal) */}
          <div className="neu-raised p-6 sm:p-8 flex items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 neu-pill-inset">
                <FileCheck className="h-4 w-4 text-[var(--accent)]" />
                <span>Portal staf pelayanan</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)]">
                Pemeriksaan Loket Pelayanan
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
                Pemeriksaan berkas dan validasi data pemohon SKTM tingkat pertama
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center neu-circle-inset !w-20 !h-20 shrink-0">
              <FileCheck className="h-9 w-9 text-[var(--accent)]" />
            </div>
          </div>

          {/* 4 Summary Cards (Raised, Angka besar di tengah atas, label di bawah) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold text-[var(--ink)]">{stats?.total ?? 0}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Total Pengajuan</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Semua permohonan</p>
            </div>

            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold stat-val-blue">{stats?.staffReview ?? 0}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Perlu Pemeriksaan</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Antrean meja staf loket</p>
            </div>

            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold stat-val-orange">{stats?.needRevision ?? 6}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Perlu Perbaikan</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">Menunggu pembaruan warga</p>
            </div>

            <div className="neu-raised p-3.5 sm:p-6 text-center space-y-1">
              <h3 className="text-2xl sm:text-4xl font-extrabold stat-val-green">{stats?.completed ?? 0}</h3>
              <p className="text-xs font-bold text-[var(--muted)]">Selesai</p>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)]">SKTM diterbitkan</p>
            </div>
          </div>

          {/* Pengaturan AI Chatbot */}
          <AiSettingsPanel accent="emerald" />

          {/* Database Wilayah Desa */}
          <VillageDatabasePanel />

          {/* Filter Bar (Raised, Input Inset, Tombol Solid Accent) */}
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

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="neu-inset w-full sm:w-auto min-h-[46px] px-3 py-2.5 text-sm font-semibold text-[var(--ink)] outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="STAFF_REVIEW">Perlu Pemeriksaan Staf</option>
                <option value="NEED_REVISION">Perlu Perbaikan</option>
                <option value="SUPERADMIN_REVIEW">Verifikasi Superadmin</option>
                <option value="HEAD_REVIEW">Menunggu Kades</option>
                <option value="COMPLETED">Disetujui / Selesai</option>
                <option value="REJECTED">Ditolak</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="neu-inset w-full sm:w-auto min-h-[46px] px-3 py-2.5 text-sm text-[var(--ink)] outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Table of Applications (Panel Raised seluruh tabel, Header Inset tipis, baris dipisah border tipis) */}
          <div className="neu-table-panel p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--shadow-dark)]/20">
              <div>
                <h3 className="font-extrabold text-base text-[var(--ink)]">Daftar Antrean Permohonan SKTM</h3>
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
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--shadow-dark)]/15 text-xs text-[var(--ink)]">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Tidak ada pengajuan yang sesuai filter.
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
                        <td className="py-3.5 px-4">
                          <span className="font-medium">{app.purposeCategory}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/dashboard/staf/applications/${app.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Periksa
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
