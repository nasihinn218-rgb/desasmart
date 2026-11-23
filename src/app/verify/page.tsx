'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
  Home,
  ShieldCheck, 
  Search, 
  QrCode, 
  CheckCircle2, 
  ArrowLeft,
  FileText,
  Lock
} from 'lucide-react';

// Widget AI dimuat malas agar halaman tampil cepat tanpa menunggu rendering AI.
const AiChatWidget = dynamic(() => import('@/components/AiChatWidget'), { ssr: false });

export default function VerifySearchPage() {
  const router = useRouter();
  const [docNumber, setDocNumber] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (docNumber.trim()) {
      router.push(`/verify/${encodeURIComponent(docNumber.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      <header className="neu-raised border-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 neu-circle-inset-sm flex items-center justify-center text-[var(--accent)] shrink-0">
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="block font-extrabold text-xs sm:text-sm tracking-tight text-[var(--ink)] truncate">
                Pemerintah Desa Silihasih
              </span>
              <p className="text-[9px] sm:text-[10px] text-[var(--muted)] truncate">Layanan Cek Keaslian Dokumen</p>
            </div>
          </Link>

          <Link
            href="/"
            className="neu-pill !px-3 sm:!px-4 !py-1.5 sm:!py-2 text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5 shrink-0 whitespace-nowrap !min-h-[38px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kembali ke Beranda</span>
            <span className="sm:hidden">Beranda</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="text-center space-y-3 mb-8">
          <div className="mx-auto flex !w-16 !h-16 items-center justify-center neu-circle-inset text-[var(--accent)] mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-[var(--ink)] tracking-tight">
            Cek Keaslian Surat Keterangan Tidak Mampu (SKTM)
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
            Pihak universitas, rumah sakit, lembaga penyalur bantuan sosial, maupun instansi kedinasan dapat memeriksa keabsahan surat resmi yang diterbitkan Pemerintah Desa Silihasih.
          </p>
        </div>

        <div className="neu-raised p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-2 flex items-center justify-between">
                <span>Masukkan Nomor Surat Resmi SKTM</span>
                <span className="text-[11px] text-[var(--accent)] font-mono">Format: 470/XXX/SKTM/BULAN/TAHUN</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Contoh: 470/028/SKTM/X/2026"
                  required
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)] font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="neu-btn-primary w-full py-3.5 px-4 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Cek Keaslian Dokumen
            </button>
          </form>

          {/* Sample quick test */}
          <div className="pt-4 border-t border-[var(--shadow-dark)]/20">
            <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
              Contoh Nomor Surat Terbit Resmi di Sistem:
            </p>
            <button
              type="button"
              onClick={() => {
                setDocNumber('470/028/SKTM/X/2026');
                router.push(`/verify/${encodeURIComponent('470/028/SKTM/X/2026')}`);
              }}
              className="text-xs text-left p-3.5 neu-raised-sm w-full flex items-center justify-between text-[var(--ink)] transition-colors cursor-pointer"
            >
              <span className="font-mono font-bold text-[var(--stat-green)]">470/028/SKTM/X/2026</span>
              <span className="neu-pill-inset text-[10px] px-2.5 py-0.5 font-semibold text-[var(--accent)]">
                Klik untuk Demo Langsung
              </span>
            </button>
          </div>

          <div className="p-4 neu-inset-sm text-xs text-[var(--muted)] flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
            <span className="leading-relaxed text-[11px]">
              Sesuai dengan undang-undang perlindungan data pribadi kependudukan, nomor NIK dan informasi sensitif warga disamarkan sebagian (masking) pada halaman publik.
            </span>
          </div>
        </div>
      </main>

      <AiChatWidget />
    </div>
  );
}
