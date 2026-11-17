'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  IdCard, 
  Briefcase, 
  User, 
  Loader2, 
  Download,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import StatusBadge from '@/components/StatusBadge';
import AiVerificationCard from '@/components/AiVerificationCard';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import ReviewActionModal, { ActionType } from '@/components/ReviewActionModal';

export default function KadesApplicationReviewPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalAction, setModalAction] = useState<ActionType | null>(null);

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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleProcessAction = async (data: { notes?: string; reason?: string }) => {
    if (!modalAction) return;

    const res = await fetch(`/api/applications/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: modalAction,
        notes: data.notes,
        reason: data.reason,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Gagal memproses persetujuan Kepala Desa.');
    }

    await fetchDetail();
    router.push('/dashboard/kades');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center">
        <p className="text-sm font-bold text-slate-700">Pengajuan tidak ditemukan.</p>
        <Link href="/dashboard/kades" className="text-xs text-amber-600 underline">
          Kembali ke Antrean Kepala Desa
        </Link>
      </div>
    );
  }

  const citizen = app.citizen;
  const isActionable = app.status === 'HEAD_REVIEW';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-slate-50 to-orange-50 font-sans pb-16">
      <DashboardHeader user={user || { name: 'Kepala Desa', email: '', role: 'KEPALA_DESA' }} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/kades"
              className="shrink-0 rounded-xl border border-white bg-white/90 p-3 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-amber-700 hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 sm:text-2xl">
                  Persetujuan Akhir: {app.applicationNumber}
                </h1>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemohon: <strong>{citizen.fullName}</strong> ({citizen.nik})
              </p>
            </div>
          </div>

          {/* Action Bar for Kepala Desa */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isActionable && (
              <>
                <button
                  onClick={() => setModalAction('HEAD_REJECT')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-rose-700 hover:shadow-lg"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Tolak Permohonan
                </button>

                <button
                  onClick={() => setModalAction('HEAD_APPROVE')}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 text-sm font-black text-white shadow-md transition-all hover:-translate-y-0.5 hover:from-emerald-700 hover:to-teal-800 hover:shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Setujui & Terbitkan SKTM
                </button>
              </>
            )}

            {app.status === 'COMPLETED' && (
              <a
                href={`/api/applications/${app.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                Unduh PDF Resmi SKTM
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Generated Document Box if already completed */}
            {app.generatedDocument && (
              <div className="flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-emerald-900 to-teal-900 p-5 text-white shadow-xl sm:flex-row sm:items-center">
                <div>
                  <span className="text-emerald-300 text-[11px] font-bold uppercase tracking-wider block">
                    Dokumen SKTM Resmi Telah Sah Diterbitkan
                  </span>
                  <h3 className="text-lg font-mono font-bold mt-0.5">
                    {app.generatedDocument.documentNumber}
                  </h3>
                  <p className="text-xs text-emerald-200 mt-1">
                    Ditandatangani oleh {app.generatedDocument.signedByName} pada{' '}
                    {new Date(app.generatedDocument.issuedDate).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <a
                  href={`/api/applications/${app.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow-md hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Unduh Dokumen
                </a>
              </div>
            )}

            {/* AI Verification Assessment */}
            <AiVerificationCard
              score={app.aiCompletenessScore}
              analysisJson={app.aiAnalysisResult}
            />

            {/* Catatan Verifikasi Berjenjang */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-xs text-sky-900">
                <span className="font-bold block mb-1">Catatan Staf Loket:</span>
                <p className="bg-white/80 p-2.5 rounded-xl border border-sky-200/60 leading-relaxed">
                  &ldquo;{app.currentStaffNote || 'Pemeriksaan berkas fisik & formulir lengkap.'}&rdquo;
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-xs text-purple-900">
                <span className="font-bold block mb-1">Rekomendasi Superadmin (Kasi Pelayanan):</span>
                <p className="bg-white/80 p-2.5 rounded-xl border border-purple-200/60 leading-relaxed">
                  &ldquo;{app.currentSuperadminNote || 'Verifikasi lapangan sesuai, layak disetujui.'}&rdquo;
                </p>
              </div>
            </div>

            {/* Applicant Profile */}
            <div className="space-y-5 rounded-3xl border border-white bg-white/95 p-5 shadow-xl shadow-slate-900/[0.05] sm:p-7">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-emerald-600" /> Informasi Data Pemohon
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nama Lengkap</span>
                  <strong className="text-slate-900">{citizen.fullName}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">NIK</span>
                  <strong className="text-slate-900 font-mono">{citizen.nik}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor Kartu Keluarga (KK)</span>
                  <strong className="text-slate-900 font-mono">{citizen.noKk}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tempat / Tanggal Lahir</span>
                  <strong className="text-slate-900">
                    {citizen.birthPlace},{' '}
                    {new Date(citizen.birthDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Alamat Domisili</span>
                  <strong className="text-slate-900">
                    {citizen.address}, RT {citizen.rt} / RW {citizen.rw}, {citizen.dusun}, {citizen.desa}, {citizen.kecamatan}, {citizen.kabupaten}
                  </strong>
                </div>
              </div>
            </div>

            {/* Economic Condition */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" /> Kondisi Sosial Ekonomi Pemohon
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
                  <span className="text-slate-400 block text-[11px]">Jumlah Tanggungan</span>
                  <strong className="text-slate-900">{citizen.familyMembersCount} Jiwa</strong>
                </div>

                <div className="sm:col-span-3">
                  <span className="text-slate-400 block text-[11px]">Kondisi Tempat Tinggal</span>
                  <strong className="text-slate-900">{citizen.houseCondition}</strong>
                </div>

                <div className="sm:col-span-3">
                  <span className="text-slate-400 block text-[11px]">Uraian Kondisi Ekonomi</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                    {citizen.economicDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Attached Documents */}
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Dokumen Fisik & Digital Pemohon
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {app.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{doc.documentType}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          {doc.fileType.split('/')[1] || 'DOC'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">{doc.fileName}</p>
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded-lg transition-colors"
                    >
                      Buka Dokumen <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" /> Riwayat Proses & Catatan
              </h3>

              <ApplicationTimeline histories={app.statusHistories} />
            </div>
          </div>
        </div>
      </main>

      {modalAction && (
        <ReviewActionModal
          isOpen={!!modalAction}
          onClose={() => setModalAction(null)}
          actionType={modalAction}
          applicationNumber={app.applicationNumber}
          applicantName={citizen.fullName}
          onSubmit={handleProcessAction}
        />
      )}
    </div>
  );
}
