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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-100/70 via-slate-50 to-cyan-50 font-sans flex flex-col">
      <DashboardHeader user={user || { name: 'Staf Pelayanan', email: '', role: 'STAFF' }} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar
          role="STAFF"
          counts={{
            pendingReview: stats?.staffReview || 0,
          }}
        />

        <main className="min-w-0 flex-1 space-y-7 p-4 sm:p-6 lg:p-8">
          {/* Header Title */}
          <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-6 text-white shadow-xl shadow-emerald-950/15 sm:p-8">
            <div aria-hidden="true" className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" />
            <div className="relative">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-emerald-50">
              <FileCheck className="h-3.5 w-3.5" /> PORTAL STAF PELAYANAN
            </span>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Pemeriksaan Loket Pelayanan
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/80">
              Pemeriksaan berkas dan validasi data pemohon SKTM tingkat pertama
            </p>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pengajuan</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">{stats?.total ?? 0}</h3>
              <p className="mt-1 text-xs text-slate-500">Semua permohonan</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Perlu Pemeriksaan</p>
              <h3 className="mt-2 text-3xl font-black text-sky-900">{stats?.staffReview ?? 0}</h3>
              <p className="mt-1 text-xs text-sky-700">Antrean meja staf loket</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Perlu Perbaikan</p>
              <h3 className="mt-2 text-3xl font-black text-amber-800">{stats?.needRevision ?? 6}</h3>
              <p className="mt-1 text-xs text-amber-700">Menunggu pembaruan warga</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Selesai</p>
              <h3 className="mt-2 text-3xl font-black text-emerald-800">{stats?.completed ?? 0}</h3>
              <p className="mt-1 text-xs text-emerald-700">SKTM diterbitkan</p>
            </div>
          </div>

          {/* Pengaturan AI Chatbot */}
          <AiSettingsPanel accent="emerald" />

          {/* Database Wilayah Desa */}
          <VillageDatabasePanel />

          {/* Filter Bar */}
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-white bg-white/90 p-4 shadow-lg shadow-slate-900/[0.04] backdrop-blur sm:flex-row sm:items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari berdasarkan Nama, NIK, atau Nomor Surat..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 cursor-pointer rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Cari
              </button>
            </form>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:w-auto"
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:w-auto"
              />
            </div>
          </div>

          {/* Table of Applications */}
          <div className="overflow-hidden rounded-3xl border border-white bg-white/95 shadow-xl shadow-slate-900/[0.05]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:p-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Daftar Antrean Permohonan SKTM</h3>
                <p className="text-xs text-slate-500">Menampilkan {applications.length} permohonan</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Pemohon</th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
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
