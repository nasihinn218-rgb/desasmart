'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  FileCheck, 
  RotateCcw, 
  ArrowRight, 
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
import AdminSidebar from '@/components/AdminSidebar';
import StatusBadge from '@/components/StatusBadge';
import AiVerificationCard from '@/components/AiVerificationCard';
import ApplicationTimeline from '@/components/ApplicationTimeline';
import ReviewActionModal, { ActionType } from '@/components/ReviewActionModal';

export default function StaffApplicationReviewPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review modal state
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
      throw new Error(result.error || 'Gagal memproses review.');
    }

    await fetchDetail();
    router.push('/dashboard/staf');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-center">
        <p className="text-sm font-bold text-slate-700">Pengajuan tidak ditemukan.</p>
        <Link href="/dashboard/staf" className="text-xs text-emerald-600 underline">
          Kembali ke Antrean Staf
        </Link>
      </div>
    );
  }

  const citizen = app.citizen;
  const isActionable = app.status === 'STAFF_REVIEW' || app.status === 'SUBMITTED';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-cyan-50 font-sans pb-16">
      <DashboardHeader user={user || { name: 'Staf Pelayanan', email: '', role: 'STAFF' }} />
      <AdminSidebar role="STAFF" />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/staf"
              className="shrink-0 rounded-xl border border-white bg-white/90 p-3 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-emerald-700 hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 sm:text-2xl">
                  Pemeriksaan Berkas: {app.applicationNumber}
                </h1>
                <StatusBadge status={app.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemohon: <strong>{citizen.fullName}</strong> ({citizen.nik})
              </p>
            </div>
          </div>

          {/* Action Bar for Staff */}
          {isActionable && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setModalAction('REQUEST_REVISION')}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                Kembalikan (Perlu Perbaikan)
              </button>

              <button
                onClick={() => setModalAction('FORWARD_SUPERADMIN')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <ArrowRight className="w-4 h-4" />
                Teruskan ke Superadmin
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* AI Verification Assessment */}
            <AiVerificationCard
              score={app.aiCompletenessScore}
              analysisJson={app.aiAnalysisResult}
            />

            {/* Applicant Profile */}
            <div className="space-y-5 rounded-3xl border border-white bg-white/95 p-5 shadow-xl shadow-slate-900/[0.05] sm:p-7">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <IdCard className="w-4 h-4 text-sky-600" /> Informasi Data Pemohon
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

                <div>
                  <span className="text-slate-400 block text-[11px]">Jenis Kelamin</span>
                  <strong className="text-slate-900">
                    {citizen.gender === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Nomor HP / WhatsApp</span>
                  <strong className="text-slate-900">{citizen.phone || '-'}</strong>
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
            <div className="space-y-5 rounded-3xl border border-white bg-white/95 p-5 shadow-xl shadow-slate-900/[0.05] sm:p-7">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-sky-600" /> Data Ekonomi & Pekerjaan
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
                  <span className="text-slate-400 block text-[11px]">Anggota Keluarga</span>
                  <strong className="text-slate-900">{citizen.familyMembersCount} Orang</strong>
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

            {/* Documents with OCR Findings */}
            <div className="space-y-5 rounded-3xl border border-white bg-white/95 p-5 shadow-xl shadow-slate-900/[0.05] sm:p-7">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" /> Pemeriksaan Dokumen Fisik & Digital
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

                      {doc.ocrExtractedText && (
                        <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-[10px] text-slate-600">
                          <span className="font-bold block text-slate-700">Teks OCR Terbaca:</span>
                          <span className="truncate block">{doc.ocrExtractedText}</span>
                        </div>
                      )}
                    </div>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 py-1.5 rounded-lg transition-colors"
                    >
                      Buka Dokumen <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Workflow Timeline & Staff Review Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" /> Riwayat Proses & Catatan
              </h3>

              <ApplicationTimeline histories={app.statusHistories} />
            </div>
          </div>
        </div>
      </main>

      {/* Review Action Modal */}
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
