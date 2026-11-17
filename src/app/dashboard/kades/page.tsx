'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  BarChart3, 
  Calendar,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import AdminSidebar from '@/components/AdminSidebar';
import StatusBadge from '@/components/StatusBadge';
import RowActionMenu from '@/components/RowActionMenu';
import VillageDatabasePanel from '@/components/VillageDatabasePanel';

export default function KepalaDesaDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [meRes, appRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/applications'),
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  // Applications awaiting Head Approval
  const pendingHeadApps = applications.filter((a) => a.status === 'HEAD_REVIEW');
  const completedApps = applications.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-100/70 via-slate-50 to-orange-50 font-sans flex flex-col">
      <DashboardHeader user={user || { name: 'Kepala Desa', email: '', role: 'KEPALA_DESA' }} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <AdminSidebar
          role="KEPALA_DESA"
          counts={{
            pendingHead: stats?.headReview || 0,
          }}
        />

        <main className="min-w-0 flex-1 space-y-7 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="relative flex flex-col justify-between gap-5 overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-r from-amber-800 via-orange-800 to-rose-900 p-6 text-white shadow-xl shadow-amber-950/15 sm:flex-row sm:items-center sm:p-8">
            <div aria-hidden="true" className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" />
            <div className="relative">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-amber-50">
                <ShieldCheck className="h-3.5 w-3.5" /> PORTAL KEPALA DESA
              </span>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Dashboard Eksekutif
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-amber-50/80">
                Persetujuan akhir penerbitan Surat Keterangan Tidak Mampu (SKTM) & statistik pelayanan
              </p>
            </div>

            <div className="relative flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-amber-200" />
                Otoritas Tanda Tangan Sah
              </span>
            </div>
          </div>

          {/* 5 Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Pengajuan</p>
              <h3 className="mt-2 text-3xl font-black text-slate-900">{stats?.total ?? 0}</h3>
              <p className="mt-1 text-xs text-slate-500">Tahun berjalan</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Menunggu Persetujuan</p>
              <h3 className="mt-2 text-3xl font-black text-amber-900">{stats?.headReview ?? 0}</h3>
              <p className="mt-1 text-xs text-amber-700">Antrean Kepala Desa</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Disetujui</p>
              <h3 className="mt-2 text-3xl font-black text-emerald-800">{stats?.completed ?? 0}</h3>
              <p className="mt-1 text-xs text-emerald-700">Selesai diterbitkan</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Ditolak</p>
              <h3 className="mt-2 text-3xl font-black text-rose-800">{stats?.rejected ?? 0}</h3>
              <p className="mt-1 text-xs text-rose-700">Tidak memenuhi syarat</p>
            </div>

            <div className="rounded-2xl border border-white bg-white/90 p-5 shadow-lg shadow-slate-900/[0.04] transition hover:-translate-y-1 hover:shadow-xl">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">SKTM Diterbitkan</p>
              <h3 className="mt-2 text-3xl font-black text-teal-800">{stats?.issuedDocs ?? 0}</h3>
              <p className="mt-1 text-xs text-teal-700">Ber-QR Code resmi</p>
            </div>
          </div>

          {/* Database Wilayah Desa (dusun / RW / RT) */}
          <VillageDatabasePanel />

          {/* Simple Visual Chart Section (Requirement 9) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart: Tren Pengajuan per Bulan */}
            <div className="lg:col-span-8 space-y-4 rounded-3xl border border-white bg-white/95 p-5 shadow-xl shadow-slate-900/[0.05] sm:p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Grafik Pelayanan SKTM per Bulan</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">Tahun 2026</span>
              </div>

              {/* Bar visualization */}
              <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2">
                {stats?.monthlyTrends?.map((m: any, idx: number) => {
                  const maxVal = 35;
                  const totalHeight = Math.min(100, Math.round((m.total / maxVal) * 100));
                  const approvedHeight = Math.min(100, Math.round((m.approved / maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-32">
                        {/* Total Bar */}
                        <div
                          style={{ height: `${totalHeight}%` }}
                          className="w-2.5 sm:w-3.5 bg-slate-300 rounded-t-sm group-hover:bg-slate-400 transition-all"
                          title={`Total ${m.month}: ${m.total}`}
                        />
                        {/* Approved Bar */}
                        <div
                          style={{ height: `${approvedHeight}%` }}
                          className="w-2.5 sm:w-3.5 bg-emerald-600 rounded-t-sm group-hover:bg-emerald-500 transition-all"
                          title={`Disetujui ${m.month}: ${m.approved}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">{m.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-slate-300 rounded-xs" /> Total Permohonan Masuk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-600 rounded-xs" /> Disetujui / SKTM Diterbitkan
                </span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="lg:col-span-4 space-y-4 rounded-3xl border border-white bg-white/95 p-5 shadow-xl shadow-slate-900/[0.05] sm:p-6">
              <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                Berdasarkan Keperluan SKTM
              </h3>

              <div className="space-y-3">
                {stats?.categories?.map((cat: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{cat.category}</span>
                      <strong className="text-slate-900">{cat.count} berkas</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (cat.count / (stats.total || 1)) * 100)}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Approval Table (Meja Kepala Desa) */}
          <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white/95 shadow-xl shadow-amber-900/[0.06]">
            <div className="p-5 bg-amber-50/70 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-amber-950">
                    Antrean Persetujuan Akhir Kepala Desa
                  </h3>
                  <p className="text-xs text-amber-800">
                    {pendingHeadApps.length} permohonan telah lengkap diverifikasi staf dan superadmin
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4">Catatan Rekomendasi Superadmin</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pendingHeadApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada berkas yang menunggu persetujuan Kepala Desa saat ini.
                      </td>
                    </tr>
                  ) : (
                    pendingHeadApps.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {app.citizen?.fullName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {app.citizen?.nik}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {app.purposeCategory}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                          {app.currentSuperadminNote || 'Memenuhi syarat verifikasi kependudukan.'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/dashboard/kades/applications/${app.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-sm transition-all"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Buka & Setujui
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recently Issued SKTM List */}
          <div className="overflow-hidden rounded-3xl border border-white bg-white/95 shadow-xl shadow-slate-900/[0.05]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:p-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Riwayat SKTM Diterbitkan Resmi</h3>
                <p className="text-xs text-slate-500">Daftar surat yang telah disetujui dan ber-QR code</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Nomor Surat Resmi</th>
                    <th className="py-3 px-4">Nama Warga</th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">Tanggal Pengesahan</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {completedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 max-w-[190px] truncate font-mono font-bold text-emerald-800">
                        {app.generatedDocument?.documentNumber || '470/XXX/SKTM/2026'}
                      </td>
                      <td className="py-3.5 px-4 max-w-[180px] truncate font-bold text-slate-900">
                        {app.citizen?.fullName}
                      </td>
                      <td className="py-3.5 px-4 max-w-[150px] truncate font-mono text-slate-600">
                        {app.citizen?.nik}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {app.approvedByHeadAt
                          ? new Date(app.approvedByHeadAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4">{app.purposeCategory}</td>
                      <td className="py-3.5 px-4 text-right">
                        <RowActionMenu>
                          {(close) => (
                            <>
                              <button
                                type="button"
                                title="Pratinjau SKTM sebelum diunduh"
                                onClick={() => {
                                  close();
                                  window.open(`/api/applications/${app.id}/pdf?display=inline`, '_blank');
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Lihat SKTM
                              </button>
                              <a
                                href={`/api/applications/${app.id}/pdf`}
                                download
                                onClick={close}
                                title="Unduh SKTM (PDF)"
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Unduh SKTM
                              </a>
                              <Link
                                href={`/dashboard/kades/applications/${app.id}`}
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
