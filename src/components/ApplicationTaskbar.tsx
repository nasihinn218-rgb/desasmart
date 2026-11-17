'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ClipboardList,
  AlertTriangle,
  XCircle,
  ArrowRight,
  CircleDot,
} from 'lucide-react';

export interface TaskbarApplication {
  id: string;
  status: string;
  applicationNumber: string;
  purposeCategory: string;
}

const FLOW_STEPS = [
  { label: 'Terkirim', sub: 'Formulir & berkas masuk' },
  { label: 'Cek Staf', sub: 'Pemeriksaan loket desa' },
  { label: 'Verifikasi Kasi', sub: 'Validasi faktual superadmin' },
  { label: 'Persetujuan Kades', sub: 'Tanda tangan Kepala Desa' },
  { label: 'SKTM Terbit', sub: 'PDF resmi + QR Code' },
];

type TaskbarState = 'ACTIVE' | 'DONE' | 'REVISION' | 'REJECTED';

function resolveProgress(status: string): { currentStep: number; state: TaskbarState } {
  switch (status) {
    case 'DRAFT':
    case 'SUBMITTED':
      return { currentStep: 0, state: 'ACTIVE' };
    case 'STAFF_REVIEW':
      return { currentStep: 1, state: 'ACTIVE' };
    case 'NEED_REVISION':
      return { currentStep: 1, state: 'REVISION' };
    case 'SUPERADMIN_REVIEW':
      return { currentStep: 2, state: 'ACTIVE' };
    case 'SUPERADMIN_APPROVED':
    case 'HEAD_REVIEW':
      return { currentStep: 3, state: 'ACTIVE' };
    case 'APPROVED':
    case 'COMPLETED':
      return { currentStep: FLOW_STEPS.length - 1, state: 'DONE' };
    case 'REJECTED':
      return { currentStep: 0, state: 'REJECTED' };
    default:
      return { currentStep: 0, state: 'ACTIVE' };
  }
}

export default function ApplicationTaskbar({ applications }: { applications: TaskbarApplication[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (applications.length === 0) return null;

  // Warga dapat memilih pengajuan mana yang progresnya ditampilkan.
  const focusApp =
    applications.find((a) => a.id === selectedId) ??
    applications.find((a) => !['COMPLETED', 'REJECTED'].includes(a.status)) ??
    applications[0];
  const { currentStep, state } = resolveProgress(focusApp.status);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xs">
      {/* Header taskbar */}
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Progres Pengajuan Anda</h3>
            <p className="truncate text-[11px] text-slate-500">
              <span className="font-mono font-bold text-slate-700">{focusApp.applicationNumber}</span>
              {' · '}
              {focusApp.purposeCategory}
            </p>
          </div>
        </div>
        {applications.length > 1 && (
          <select
            value={focusApp.id}
            onChange={(event) => setSelectedId(event.target.value)}
            aria-label="Pilih pengajuan untuk melihat progres"
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.applicationNumber} · {application.purposeCategory}
              </option>
            ))}
          </select>
        )}
        <Link
          href={`/dashboard/masyarakat/applications/${focusApp.id}`}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-50 sm:self-auto"
        >
          Lihat Detail
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Langkah alur */}
      <div className="p-5 sm:p-6">
        <ol className="flex items-start">
          {FLOW_STEPS.map((step, index) => {
            const isDone = state === 'DONE' ? true : index < currentStep;
            const isCurrent = state !== 'DONE' && index === currentStep;
            const isLast = index === FLOW_STEPS.length - 1;
            const lineDone = state === 'DONE' ? true : index < currentStep;

            const circleClass = isDone
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : isCurrent
                ? state === 'REVISION'
                  ? 'border-amber-500 bg-amber-50 text-amber-600 ring-4 ring-amber-100'
                  : 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100'
                : 'border-slate-200 bg-slate-50 text-slate-400';

            const labelClass = isDone || isCurrent ? 'text-slate-900' : 'text-slate-400';

            return (
              <li key={step.label} className="relative flex-1">
                {/* Garis penghubung */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-[15px] h-0.5 rounded ${
                      lineDone ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white shadow-xs transition-colors ${circleClass}`}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" />
                    ) : isCurrent ? (
                      <CircleDot className="h-4 w-4" />
                    ) : (
                      <span className="text-[11px] font-bold">{index + 1}</span>
                    )}
                  </span>
                  <span className={`text-[10px] font-bold leading-tight sm:text-[11px] ${labelClass}`}>
                    {step.label}
                  </span>
                  <span className="hidden text-[10px] leading-tight text-slate-400 md:block">
                    {step.sub}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Catatan status khusus */}
        {state === 'REVISION' && (
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-[11px] leading-relaxed text-amber-800">
              Pengajuan ini <strong>perlu perbaikan</strong>. Buka detail untuk membaca catatan
              petugas dan mengunggah berkas yang benar.
            </p>
          </div>
        )}
        {state === 'REJECTED' && (
          <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5">
            <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <p className="text-[11px] leading-relaxed text-rose-800">
              Pengajuan ini <strong>ditolak</strong>. Buka detail untuk membaca alasan resmi dari
              pejabat desa.
            </p>
          </div>
        )}
        {state === 'DONE' && (
          <div className="mt-5 flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
            <p className="flex items-center gap-2.5 text-[11px] leading-relaxed text-emerald-800">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              SKTM resmi telah terbit dengan QR Code verifikasi publik dan siap diunduh.
            </p>
            <a
              href={`/api/applications/${focusApp.id}/pdf`}
              className="shrink-0 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700"
            >
              Unduh PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
