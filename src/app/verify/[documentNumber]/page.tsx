'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Home,
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Calendar, 
  User, 
  MapPin, 
  Lock, 
  FileText, 
  Loader2,
  Sparkles,
  QrCode
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Widget AI dimuat malas agar halaman tampil cepat tanpa menunggu rendering AI.
const AiChatWidget = dynamic(() => import('@/components/AiChatWidget'), { ssr: false });

export default function DocumentVerificationDetailPage() {
  const params = useParams();
  const documentNumber = params?.documentNumber as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!documentNumber) return;

    const verifyDoc = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/verify/${encodeURIComponent(documentNumber)}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Dokumen tidak valid.');
        }
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Gagal memverifikasi dokumen.');
      } finally {
        setLoading(false);
      }
    };

    verifyDoc();
  }, [documentNumber]);

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
            href="/verify"
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cari Nomor Lain
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {loading ? (
          <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-200 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Memeriksa keabsahan dokumen dalam database resmi...
            </p>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Dokumen Tidak Ditemukan</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Nomor surat <code className="font-mono font-bold text-rose-700">{decodeURIComponent(documentNumber)}</code> tidak terdaftar sebagai SKTM resmi yang diterbitkan oleh Pemerintah Desa Silihasih.
            </p>
            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Masukkan Nomor Lain
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-200 overflow-hidden">
            {/* Top verified banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-white border border-white/30 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black tracking-wide">
                DOKUMEN RESMI TERVERIFIKASI
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Surat Keterangan Tidak Mampu ini sah diterbitkan oleh Pemerintah Desa Silihasih
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Document Identity */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">Nomor Surat Resmi</span>
                  <span className="text-xs font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {data.documentNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Jenis Surat</span>
                  <span className="text-xs font-bold text-slate-800">{data.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Keperluan</span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {data.purposeCategory}
                  </span>
                </div>
              </div>

              {/* Citizen Information with privacy masking */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" /> Informasi Pemohon (Data Terproteksi)
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Nama Pemohon:</span>
                    <strong className="text-slate-900">{data.applicantName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">NIK (Disamarkan):</span>
                    <strong className="font-mono text-slate-900">{data.maskedNik}</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[11px]">Desa Penerbit:</span>
                    <strong className="text-slate-800">
                      {data.villageName}, {data.districtName}, {data.regencyName}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Signing info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Pengesahan Pejabat Berwenang
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tanggal Pengesahan:</span>
                    <strong className="text-slate-800">
                      {new Date(data.issuedDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Disetujui Oleh:</span>
                    <strong className="text-slate-800">
                      {data.signedByName} ({data.signedByTitle})
                    </strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200/60">
                    <span className="text-slate-400 block text-[10px]">Hash Integritas Kriptografis:</span>
                    <code className="text-[11px] font-mono text-slate-600">{data.documentHash}</code>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">
                  Halaman ini adalah bukti verifikasi publik resmi. Seluruh informasi dijamin keasliannya dan diterbitkan langsung melalui sistem pelayanan digital Pemerintah Desa Silihasih.
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <AiChatWidget />
    </div>
  );
}
