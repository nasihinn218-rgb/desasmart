'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  Download, 
  RotateCcw, 
  FileText, 
  IdCard, 
  Briefcase, 
  Calendar, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  Clock
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import StatusBadge from '@/components/StatusBadge';
import AiVerificationCard from '@/components/AiVerificationCard';
import ApplicationTimeline from '@/components/ApplicationTimeline';

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Revision modal states
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisedDesc, setRevisedDesc] = useState('');
  const [submittingRevision, setSubmittingRevision] = useState(false);

  const fetchDetail = async () => {
    try {
      const [meRes, appRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/applications/${id}`),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
      }

      if (appRes.ok) {
        const appData = await appRes.json();
        setApp(appData.application);
        setRevisedDesc(appData.application?.purposeDescription || '');
      } else {
        setError('Pengajuan tidak ditemukan atau akses ditolak.');
      }
    } catch (e: any) {
      setError(e.message || 'Gagal memuat detail pengajuan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleResubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRevision(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purposeDescription: revisedDesc,
        }),
      });

      if (!res.ok) throw new Error('Gagal mengirim revisi.');
      setIsRevisionOpen(false);
      await fetchDetail();
    } catch (e: any) {
      alert(e.message || 'Gagal mengirim revisi.');
    } finally {
      setSubmittingRevision(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-rose-200 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">{error || 'Data tidak ditemukan'}</h2>
          <Link href="/dashboard/masyarakat" className="text-xs font-bold text-emerald-600 underline">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const citizen = app.citizen;
  const workflowSteps = [
    {
      title: 'Pengajuan diterima',
      description: 'Staf loket memeriksa data dan dokumen yang Anda kirim.',
    },
    {
      title: 'Verifikasi superadmin',
      description: 'Superadmin memvalidasi hasil pemeriksaan staf.',
    },
    {
      title: 'Persetujuan Kepala Desa',
      description: 'Kepala Desa memeriksa dan menandatangani permohonan.',
    },
    {
      title: 'SKTM diterbitkan',
      description: 'Surat resmi tersedia untuk diunduh oleh pemohon.',
    },
  ];
  const workflowStageByStatus: Record<string, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    STAFF_REVIEW: 0,
    NEED_REVISION: 0,
    SUPERADMIN_REVIEW: 1,
    SUPERADMIN_APPROVED: 2,
    HEAD_REVIEW: 2,
    APPROVED: 3,
    COMPLETED: 3,
  };
  const currentWorkflowStage = workflowStageByStatus[app.status] ?? -1;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      <DashboardHeader user={user || { name: 'Warga', email: '', role: 'MASYARAKAT' }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/masyarakat"
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {app.applicationNumber}
                </h1>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Diajukan pada {new Date(app.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {app.status === 'COMPLETED' && (
              <a
                href={`/api/applications/${app.id}/pdf`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Unduh SKTM Resmi (PDF)
              </a>
            )}

            {app.status === 'NEED_REVISION' && (
              <button
                onClick={() => setIsRevisionOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Perbaiki Pengajuan
              </button>
            )}
          </div>
        </div>

        {/* If NEED_REVISION: Warning alert */}
        {app.status === 'NEED_REVISION' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900">Catatan Perbaikan dari Petugas Desa:</h4>
              <p className="text-xs text-amber-800 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-amber-200">
                &ldquo;{app.revisionNotes || app.currentStaffNote || 'Harap periksa kelengkapan berkas.'}&rdquo;
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Data Sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* AI Verification Assessment */}
            <AiVerificationCard
              score={app.aiCompletenessScore}
              analysisJson={app.aiAnalysisResult}
            />

            {/* Applicant Details */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-emerald-600" /> Informasi Data Pemohon
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Lengkap</span>
                  <strong className="text-slate-900">{citizen.fullName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor Induk Kependudukan (NIK)</span>
                  <strong className="text-slate-900 font-mono">{citizen.nik}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor Kartu Keluarga (KK)</span>
                  <strong className="text-slate-900 font-mono">{citizen.noKk}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tempat & Tanggal Lahir</span>
                  <strong className="text-slate-900">
                    {citizen.birthPlace},{' '}
                    {new Date(citizen.birthDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
                  <strong className="text-slate-900">
                    {citizen.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor Telepon</span>
                  <strong className="text-slate-900">{citizen.phone || '-'}</strong>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Alamat Lengkap</span>
                  <strong className="text-slate-900">
                    {citizen.address}, RT {citizen.rt} / RW {citizen.rw}, {citizen.dusun}, {citizen.desa}, {citizen.kecamatan}, {citizen.kabupaten}
                  </strong>
                </div>
              </div>
            </div>

            {/* Economic Condition */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" /> Data Kondisi Ekonomi Pemohon
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Pekerjaan</span>
                  <strong className="text-slate-900">{citizen.occupation}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Penghasilan / Bulan</span>
                  <strong className="text-slate-900 font-mono">
                    Rp {citizen.monthlyIncome.toLocaleString('id-ID')}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Jumlah Anggota Keluarga</span>
                  <strong className="text-slate-900">{citizen.familyMembersCount} Jiwa</strong>
                </div>

                <div className="sm:col-span-3">
                  <span className="text-slate-400 block text-[11px]">Kondisi Tempat Tinggal</span>
                  <strong className="text-slate-900">{citizen.houseCondition}</strong>
                </div>

                <div className="sm:col-span-3">
                  <span className="text-slate-400 block text-[11px]">Keterangan Kondisi Ekonomi</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {citizen.economicDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Dokumen Terlampir
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {app.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800">{doc.documentType}</span>
                        <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded uppercase font-mono">
                          {doc.fileType.split('/')[1] || 'DOC'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">{doc.fileName}</p>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-lg transition-colors"
                    >
                      Buka Dokumen <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Timeline & Official Issuance Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <Clock className="h-4 w-4 text-emerald-600" /> Tahapan Pengajuan
              </h3>
              <ol className="space-y-4">
                {workflowSteps.map((step, index) => {
                  const isComplete = app.status === 'COMPLETED' || currentWorkflowStage > index;
                  const isCurrent = app.status !== 'REJECTED' && currentWorkflowStage === index;

                  return (
                    <li key={step.title} className="flex gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isComplete
                            ? 'bg-emerald-100 text-emerald-700'
                            : isCurrent
                              ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-200'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {step.title}
                          {isCurrent && (
                            <span className="ml-1.5 font-semibold text-amber-700">· Tahap saat ini</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{step.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {app.status === 'NEED_REVISION' && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900">
                  Pengajuan perlu diperbaiki sebelum pemeriksaan dapat dilanjutkan. Baca catatan petugas, lalu kirim perbaikan melalui tombol di atas.
                </p>
              )}
              {app.status === 'REJECTED' && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-relaxed text-rose-900">
                  Pengajuan ditolak. {app.rejectionReason || 'Silakan lihat riwayat proses untuk membaca catatan petugas.'}
                </p>
              )}
            </div>

            {/* Generated Document Card if completed */}
            {app.generatedDocument && (
              <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">SKTM Telah Diterbitkan</h4>
                    <p className="text-[10px] text-emerald-200">Surat Resmi Sah Bertanda Tangan</p>
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-200 block">Nomor Surat</span>
                    <strong className="font-mono">{app.generatedDocument.documentNumber}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-200 block">Penandatangan</span>
                    <strong>{app.generatedDocument.signedByName}</strong>
                  </div>
                </div>

                <a
                  href={`/api/applications/${app.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4" /> Unduh Dokumen Resmi
                </a>
              </div>
            )}

            {/* Workflow Timeline */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" /> Riwayat Alur Proses
              </h3>

              <ApplicationTimeline histories={app.statusHistories} />
            </div>
          </div>
        </div>
      </main>

      {/* Revision Resubmission Modal */}
      {isRevisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Perbaiki Pengajuan SKTM</h3>
            <p className="text-xs text-slate-500">
              Perbarui keterangan atau berkas sesuai catatan petugas, kemudian kirimkan ulang ke loket staf desa.
            </p>

            <form onSubmit={handleResubmitRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Tambahan / Perbaikan *
                </label>
                <textarea
                  rows={3}
                  value={revisedDesc}
                  onChange={(e) => setRevisedDesc(e.target.value)}
                  required
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Jelaskan perbaikan yang telah Anda lakukan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRevision}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-2"
                >
                  {submittingRevision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Kirim Perbaikan ke Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
