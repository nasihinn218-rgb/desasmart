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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg animate-in zoom-in-95 rounded-3xl border border-white/80 bg-white p-5 shadow-2xl duration-150 sm:p-7">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100">{config.icon}</div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{config.title}</h3>
              <p className="text-xs text-slate-500">{applicationNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 text-sm leading-relaxed text-slate-700">
            {config.desc}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Catatan / Alasan Petugas</span>
              {config.isMandatoryText && (
                <span className="text-rose-600 text-[11px] font-semibold">* Wajib Diisi</span>
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
              className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col-reverse items-stretch justify-end gap-2.5 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClass}`}
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
