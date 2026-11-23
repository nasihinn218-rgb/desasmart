'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  Loader2,
  FileText
} from 'lucide-react';
import { DESA } from '@/lib/desa-config';

export type ActionType = 
  | 'FORWARD_SUPERADMIN'
  | 'REQUEST_REVISION'
  | 'SUPERADMIN_APPROVE'
  | 'SUPERADMIN_REJECT'
  | 'SUPERADMIN_RETURN'
  | 'HEAD_APPROVE'
  | 'HEAD_REJECT';

interface ReviewActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: ActionType;
  applicationNumber: string;
  applicantName: string;
  onSubmit: (data: { notes?: string; reason?: string }) => Promise<void>;
}

export default function ReviewActionModal({
  isOpen,
  onClose,
  actionType,
  applicationNumber,
  applicantName,
  onSubmit,
}: ReviewActionModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'FORWARD_SUPERADMIN':
        return {
          title: 'Teruskan ke Superadmin',
          desc: `Pengajuan ${applicationNumber} atas nama ${applicantName} akan diteruskan ke Kasi Pelayanan/Superadmin untuk verifikasi lanjutan.`,
          icon: <ArrowRight className="w-5 h-5 text-sky-600" />,
          buttonLabel: 'Konfirmasi Teruskan',
          buttonClass: 'bg-sky-600 hover:bg-sky-700 text-white',
          isMandatoryText: false,
          placeholder: 'Tambahkan catatan staf untuk superadmin (opsional)...',
        };
      case 'REQUEST_REVISION':
      case 'SUPERADMIN_RETURN':
        return {
          title: 'Kembalikan Pengajuan (Perlu Perbaikan)',
          desc: `Pengajuan ${applicationNumber} akan dikembalikan kepada ${applicantName}. Wajib menyertakan catatan bagian mana yang perlu diperbaiki.`,
          icon: <RotateCcw className="w-5 h-5 text-amber-600" />,
          buttonLabel: 'Kirim Instruksi Perbaikan',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
          isMandatoryText: true,
          placeholder: 'Jelaskan kekurangan dokumen/data yang wajib diperbaiki pemohon (Wajib diisi)...',
        };
      case 'SUPERADMIN_APPROVE':
        return {
          title: 'Setujui Verifikasi & Ajukan ke Kepala Desa',
          desc: `Pengajuan ${applicationNumber} telah diverifikasi faktual dan akan diajukan ke meja Kepala Desa untuk tanda tangan pengesahan SKTM.`,
          icon: <CheckCircle2 className="w-5 h-5 text-purple-600" />,
          buttonLabel: 'Setujui & Teruskan ke Kepala Desa',
          buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white',
          isMandatoryText: false,
          placeholder: 'Tambahkan catatan rekomendasi untuk Kepala Desa (opsional)...',
        };
      case 'SUPERADMIN_REJECT':
      case 'HEAD_REJECT':
        return {
          title: 'Tolak Permohonan SKTM',
          desc: `Pengajuan ${applicationNumber} akan ditolak secara resmi. Wajib menyertakan dasar dan alasan penolakan.`,
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          buttonLabel: 'Tolak Permohonan',
          buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white',
          isMandatoryText: true,
          placeholder: 'Tuliskan alasan resmi penolakan SKTM (Wajib diisi)...',
        };
      case 'HEAD_APPROVE':
        return {
          title: 'Pengesahan Akhir & Penerbitan SKTM',
          desc: `Apakah Anda yakin menyetujui pengajuan SKTM ini? Sistem secara otomatis akan mencetak dokumen resmi SKTM lengkap dengan Nomor Surat, Kop ${DESA.nama}, Tanda Tangan Pengesahan, dan QR Code Verifikasi.`,
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          buttonLabel: 'Setujui & Terbitkan SKTM Sekarang',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
          isMandatoryText: false,
          placeholder: 'Catatan tambahan pengesahan Kepala Desa (opsional)...',
        };
    }
  };

  const config = getActionConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config.isMandatoryText && !text.trim()) {
      setError('Bagian catatan atau alasan wajib diisi sebelum melanjutkan.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({
        notes: text.trim(),
        reason: text.trim(),
      });
      setText('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses aksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a100d]/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg neu-raised bg-[var(--bg)] p-6 sm:p-7 duration-150 text-[var(--ink)] text-left">
        <div className="flex items-start justify-between border-b border-[var(--shadow-dark)]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="neu-circle-inset-sm">{config.icon}</div>
            <div>
              <h3 className="font-extrabold text-base text-[var(--ink)]">{config.title}</h3>
              <p className="text-xs text-[var(--muted)]">{applicationNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="neu-raised-sm flex h-11 w-11 shrink-0 items-center justify-center text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="neu-inset-sm p-4 text-sm leading-relaxed text-[var(--ink)]">
            {config.desc}
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--ink)] mb-2 flex items-center justify-between">
              <span>Catatan / Alasan Petugas</span>
              {config.isMandatoryText && (
                <span className="stat-val-red text-[11px] font-bold">* Wajib Diisi</span>
              )}
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError('');
              }}
              placeholder={config.placeholder}
              className="neu-inset w-full p-4 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>

          {error && (
            <div className="neu-inset-sm p-3 text-xs font-bold stat-val-red flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse items-stretch justify-end gap-3 pt-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="neu-raised-sm px-5 py-3 text-sm font-semibold text-[var(--muted)] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="neu-btn-primary !py-3 !px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {config.buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
