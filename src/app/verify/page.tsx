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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                Pemerintah Desa Silihasih
              </span>
              <p className="text-[10px] text-slate-500">Layanan Verifikasi Dokumen Publik</p>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-100 text-emerald-800 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Verifikasi Keaslian Surat Keterangan Tidak Mampu (SKTM)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Pihak universitas, rumah sakit, lembaga penyalur bantuan sosial, maupun instansi kedinasan dapat memeriksa keabsahan surat resmi yang diterbitkan Pemerintah Desa Silihasih.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Masukkan Nomor Surat Resmi SKTM</span>
                <span className="text-[11px] text-emerald-700 font-mono">Format: 470/XXX/SKTM/BULAN/TAHUN</span>
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Contoh: 470/028/SKTM/X/2026"
                  required
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              Cek Keabsahan Dokumen
            </button>
          </form>

          {/* Sample quick test */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Contoh Nomor Surat Terbit Resmi di Sistem:
            </p>
            <button
              type="button"
              onClick={() => {
                setDocNumber('470/028/SKTM/X/2026');
                router.push(`/verify/${encodeURIComponent('470/028/SKTM/X/2026')}`);
              }}
              className="text-xs text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 w-full flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
            >
              <span className="font-mono font-bold text-emerald-800">470/028/SKTM/X/2026</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                Klik untuk Demo Langsung
              </span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
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
