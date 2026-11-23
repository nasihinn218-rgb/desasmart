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
        badgeClass: 'text-[var(--muted)]',
        icon: <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />,
        description: 'Pengajuan masih dalam bentuk draf belum dikirim.',
      };
    case 'SUBMITTED':
      return {
        label: 'Terkirim',
        badgeClass: 'stat-val-blue',
        icon: <Clock className="w-3.5 h-3.5 stat-val-blue" />,
        description: 'Pengajuan telah dikirim dan menunggu antrean loket.',
      };
    case 'STAFF_REVIEW':
      return {
        label: 'Menunggu Pemeriksaan Staf',
        badgeClass: 'stat-val-blue',
        icon: <Clock className="w-3.5 h-3.5 stat-val-blue" />,
        description: 'Pengajuan telah dikirim dan menunggu pemeriksaan awal oleh staf loket desa.',
      };
    case 'NEED_REVISION':
      return {
        label: 'Perlu Perbaikan',
        badgeClass: 'stat-val-orange',
        icon: <AlertTriangle className="w-3.5 h-3.5 stat-val-orange" />,
        description: 'Petugas meminta perbaikan dokumen atau informasi pemohon.',
      };
    case 'SUPERADMIN_REVIEW':
      return {
        label: 'Verifikasi Superadmin',
        badgeClass: 'stat-val-purple',
        icon: <UserCheck className="w-3.5 h-3.5 stat-val-purple" />,
        description: 'Berkas telah lolos staf dan sedang diverifikasi Superadmin / Kasi Pelayanan.',
      };
    case 'SUPERADMIN_APPROVED':
    case 'HEAD_REVIEW':
      return {
        label: 'Persetujuan Kepala Desa',
        badgeClass: 'stat-val-purple',
        icon: <ShieldCheck className="w-3.5 h-3.5 stat-val-purple" />,
        description: 'Diverifikasi superadmin, menunggu tanda tangan & persetujuan akhir Kepala Desa.',
      };
    case 'APPROVED':
    case 'COMPLETED':
      return {
        label: 'Disetujui / Selesai',
        badgeClass: 'stat-val-green',
        icon: <CheckCircle2 className="w-3.5 h-3.5 stat-val-green" />,
        description: 'Pengajuan disetujui Kepala Desa dan SKTM resmi siap diunduh.',
      };
    case 'REJECTED':
      return {
        label: 'Ditolak',
        badgeClass: 'stat-val-red',
        icon: <XCircle className="w-3.5 h-3.5 stat-val-red" />,
        description: 'Permohonan ditolak dengan alasan resmi dari pejabat desa.',
      };
    default:
      return {
        label: status,
        badgeClass: 'text-[var(--ink)]',
        icon: <FileText className="w-3.5 h-3.5 text-[var(--muted)]" />,
        description: 'Status sedang berlangsung.',
      };
  }
}

export default function StatusBadge({ status, showIcon = true }: { status: string; showIcon?: boolean }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`neu-status-badge ${config.badgeClass}`}
      title={config.description}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
}
