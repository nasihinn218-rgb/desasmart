import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  FileText,
  ShieldCheck
} from 'lucide-react';

export interface StatusConfig {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
  description: string;
}

export function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draf',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
        icon: <FileText className="w-3.5 h-3.5" />,
        description: 'Pengajuan masih dalam bentuk draf belum dikirim.',
      };
    case 'SUBMITTED':
      return {
        label: 'Terkirim',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        icon: <Clock className="w-3.5 h-3.5" />,
        description: 'Pengajuan telah dikirim dan menunggu antrean loket.',
      };
    case 'STAFF_REVIEW':
      return {
        label: 'Menunggu Pemeriksaan Staf',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
        icon: <Clock className="w-3.5 h-3.5" />,
        description: 'Pengajuan telah dikirim dan menunggu pemeriksaan awal oleh staf loket desa.',
      };
    case 'NEED_REVISION':
      return {
        label: 'Perlu Perbaikan',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
        description: 'Petugas meminta perbaikan dokumen atau informasi pemohon.',
      };
    case 'SUPERADMIN_REVIEW':
      return {
        label: 'Verifikasi Superadmin',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
        icon: <UserCheck className="w-3.5 h-3.5" />,
        description: 'Berkas telah lolos staf dan sedang diverifikasi Superadmin / Kasi Pelayanan.',
      };
    case 'SUPERADMIN_APPROVED':
    case 'HEAD_REVIEW':
      return {
        label: 'Persetujuan Kepala Desa',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        description: 'Diverifikasi superadmin, menunggu tanda tangan & persetujuan akhir Kepala Desa.',
      };
    case 'APPROVED':
    case 'COMPLETED':
      return {
        label: 'Disetujui / Selesai',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        description: 'Pengajuan disetujui Kepala Desa dan SKTM resmi siap diunduh.',
      };
    case 'REJECTED':
      return {
        label: 'Ditolak',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        icon: <XCircle className="w-3.5 h-3.5" />,
        description: 'Permohonan ditolak dengan alasan resmi dari pejabat desa.',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: <FileText className="w-3.5 h-3.5" />,
        description: 'Status sedang berlangsung.',
      };
  }
}

export default function StatusBadge({ status, showIcon = true }: { status: string; showIcon?: boolean }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${config.badgeClass}`}
      title={config.description}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}
