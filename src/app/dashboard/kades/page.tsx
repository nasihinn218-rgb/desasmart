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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  // Applications awaiting Head Approval
  const pendingHeadApps = applications.filter((a) => a.status === 'HEAD_REVIEW');
  const completedApps = applications.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
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
          <div className="neu-raised p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="neu-circle-inset flex items-center justify-center text-[var(--accent)] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="neu-pill-inset px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> Portal Kepala Desa
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Dashboard Eksekutif
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Persetujuan akhir penerbitan Surat Keterangan Tidak Mampu (SKTM) & statistik pelayanan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="neu-pill-inset px-4 py-2 text-xs font-semibold inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--stat-green)]" />
                Otoritas Tanda Tangan Sah
              </span>
            </div>
          </div>

          {/* 5 Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            <div className="neu-raised p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-[var(--stat-blue)] leading-tight">{stats?.total ?? 0}</span>
              <p className="mt-1.5 sm:mt-2 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Total Pengajuan</p>
              <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-0.5">Tahun berjalan</span>
            </div>

            <div className="neu-raised p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-[var(--stat-orange)] leading-tight">{stats?.headReview ?? 0}</span>
              <p className="mt-1.5 sm:mt-2 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Menunggu Persetujuan</p>
              <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-0.5">Antrean Kepala Desa</span>
            </div>

            <div className="neu-raised p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-[var(--stat-green)] leading-tight">{stats?.completed ?? 0}</span>
              <p className="mt-1.5 sm:mt-2 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Disetujui</p>
              <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-0.5">Selesai diterbitkan</span>
            </div>

            <div className="neu-raised p-3.5 sm:p-5 text-center flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-[var(--stat-red)] leading-tight">{stats?.rejected ?? 0}</span>
              <p className="mt-1.5 sm:mt-2 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Ditolak</p>
              <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-0.5">Tidak memenuhi syarat</span>
            </div>

            <div className="neu-raised p-3.5 sm:p-5 text-center flex flex-col items-center justify-center col-span-2 sm:col-span-1">
              <span className="text-2xl sm:text-3xl font-black text-[var(--stat-green)] leading-tight">{stats?.issuedDocs ?? 0}</span>
              <p className="mt-1.5 sm:mt-2 text-xs font-bold text-[var(--muted)] uppercase tracking-wider">SKTM Diterbitkan</p>
              <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-0.5">Ber-QR Code resmi</span>
            </div>
          </div>

          {/* Database Wilayah Desa (dusun / RW / RT) */}
          <VillageDatabasePanel />

          {/* Simple Visual Chart Section (Requirement 9) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart: Tren Pengajuan per Bulan */}
            <div className="lg:col-span-8 neu-raised p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--shadow-dark)]/20">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
                  <h3 className="font-bold text-sm">Grafik Pelayanan SKTM per Bulan</h3>
                </div>
                <span className="text-[11px] font-semibold text-[var(--muted)]">Tahun 2026</span>
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
                          className="w-2.5 sm:w-3.5 bg-[var(--shadow-dark)] rounded-t-sm transition-all"
                          title={`Total ${m.month}: ${m.total}`}
                        />
                        {/* Approved Bar */}
                        <div
                          style={{ height: `${approvedHeight}%` }}
                          className="w-2.5 sm:w-3.5 bg-[var(--accent)] rounded-t-sm transition-all"
                          title={`Disetujui ${m.month}: ${m.approved}`}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--muted)]">{m.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 text-[11px] text-[var(--muted)] pt-2 border-t border-[var(--shadow-dark)]/20">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[var(--shadow-dark)] rounded-xs" /> Total Permohonan Masuk
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[var(--accent)] rounded-xs" /> Disetujui / SKTM Diterbitkan
                </span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="lg:col-span-4 neu-raised p-5 sm:p-6 space-y-4">
              <h3 className="font-bold text-sm pb-3 border-b border-[var(--shadow-dark)]/20">
                Berdasarkan Keperluan SKTM
              </h3>

              <div className="space-y-3">
                {stats?.categories?.map((cat: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--muted)]">{cat.category}</span>
                      <strong className="text-[var(--ink)]">{cat.count} berkas</strong>
                    </div>
                    <div className="w-full h-2 neu-inset-sm rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (cat.count / (stats.total || 1)) * 100)}%` }}
                        className="h-full bg-[var(--accent)] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Approval Table (Meja Kepala Desa) */}
          <div className="neu-table-panel">
            <div className="p-5 flex items-center justify-between border-b border-[var(--shadow-dark)]/20">
              <div className="flex items-center gap-3">
                <div className="neu-circle-inset-sm flex items-center justify-center text-[var(--stat-orange)]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    Antrean Persetujuan Akhir Kepala Desa
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {pendingHeadApps.length} permohonan telah lengkap diverifikasi staf dan superadmin
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="neu-table-header text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4">Catatan Rekomendasi Superadmin</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--shadow-dark)]/15">
                  {pendingHeadApps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--muted)]">
                        Tidak ada berkas yang menunggu persetujuan Kepala Desa saat ini.
                      </td>
                    </tr>
                  ) : (
                    pendingHeadApps.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-[var(--shadow-light)]/20 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[var(--muted)]">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-[var(--ink)]">
                          {app.citizen?.fullName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[var(--muted)]">
                          {app.citizen?.nik}
                        </td>
                        <td className="py-3.5 px-4 font-medium">
                          {app.purposeCategory}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-[var(--muted)]">
                          {app.currentSuperadminNote || 'Memenuhi syarat verifikasi kependudukan.'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/dashboard/kades/applications/${app.id}`}
                            className="neu-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-1.5"
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
          <div className="neu-table-panel">
            <div className="flex items-center justify-between border-b border-[var(--shadow-dark)]/20 p-5 sm:p-6">
              <div>
                <h3 className="font-bold text-sm">Riwayat SKTM Diterbitkan Resmi</h3>
                <p className="text-xs text-[var(--muted)]">Daftar surat yang telah disetujui dan ber-QR code</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="neu-table-header text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    <th className="py-3 px-4">Nomor Surat Resmi</th>
                    <th className="py-3 px-4">Nama Warga</th>
                    <th className="py-3 px-4">NIK</th>
                    <th className="py-3 px-4">Tanggal Pengesahan</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--shadow-dark)]/15">
                  {completedApps.map((app) => (
                    <tr key={app.id} className="hover:bg-[var(--shadow-light)]/20 transition-colors">
                      <td className="py-3.5 px-4 max-w-[190px] truncate font-mono font-bold text-[var(--stat-green)]">
                        {app.generatedDocument?.documentNumber || '470/XXX/SKTM/2026'}
                      </td>
                      <td className="py-3.5 px-4 max-w-[180px] truncate font-bold text-[var(--ink)]">
                        {app.citizen?.fullName}
                      </td>
                      <td className="py-3.5 px-4 max-w-[150px] truncate font-mono text-[var(--muted)]">
                        {app.citizen?.nik}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[var(--muted)]">
                        {app.approvedByHeadAt
                          ? new Date(app.approvedByHeadAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--ink)]">{app.purposeCategory}</td>
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
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--shadow-dark)]/10"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Lihat SKTM
                              </button>
                              <a
                                href={`/api/applications/${app.id}/pdf`}
                                download
                                onClick={close}
                                title="Unduh SKTM (PDF)"
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--shadow-dark)]/10"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Unduh SKTM
                              </a>
                              <Link
                                href={`/dashboard/kades/applications/${app.id}`}
                                onClick={close}
                                className="flex w-full items-center gap-2 border-t border-[var(--shadow-dark)]/20 px-3 py-2.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--shadow-dark)]/10"
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
