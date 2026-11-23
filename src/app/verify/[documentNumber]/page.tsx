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
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      <header className="neu-raised border-none">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 neu-circle-inset-sm flex items-center justify-center text-[var(--accent)]">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-[var(--ink)]">
                Pemerintah Desa Silihasih
              </span>
              <p className="text-[10px] text-[var(--muted)]">Layanan Cek Keaslian Dokumen Publik</p>
            </div>
          </Link>

          <Link
            href="/verify"
            className="neu-pill px-4 py-2 text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cari Nomor Lain
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {loading ? (
          <div className="neu-raised p-12 text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)] mx-auto" />
            <p className="text-sm font-semibold text-[var(--muted)]">
              Memeriksa keabsahan dokumen dalam database resmi...
            </p>
          </div>
        ) : error ? (
          <div className="neu-raised p-8 text-center space-y-4">
            <div className="w-14 h-14 neu-circle-inset text-[var(--stat-red)] mx-auto flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-[var(--ink)]">Dokumen Tidak Ditemukan</h2>
            <p className="text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
              Nomor surat <code className="font-mono font-bold text-[var(--stat-red)]">{decodeURIComponent(documentNumber)}</code> tidak terdaftar sebagai SKTM resmi yang diterbitkan oleh Pemerintah Desa Silihasih.
            </p>
            <div className="pt-2">
              <Link
                href="/verify"
                className="neu-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Masukkan Nomor Lain
              </Link>
            </div>
          </div>
        ) : (
          <div className="neu-raised overflow-hidden">
            {/* Top verified banner */}
            <div className="p-6 text-center space-y-2 border-b border-[var(--shadow-dark)]/20">
              <div className="w-12 h-12 neu-circle-inset flex items-center justify-center mx-auto text-[var(--stat-green)]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black tracking-wide text-[var(--ink)]">
                DOKUMEN RESMI TERBUKTI SAH
              </h2>
              <p className="text-xs text-[var(--muted)] font-medium">
                Surat Keterangan Tidak Mampu ini sah diterbitkan oleh Pemerintah Desa Silihasih
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Document Identity */}
              <div className="neu-inset-sm p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--shadow-dark)]/15">
                  <span className="text-xs text-[var(--muted)] font-medium">Nomor Surat Resmi</span>
                  <span className="text-xs font-mono font-black text-[var(--stat-green)] neu-pill-inset px-2.5 py-1">
                    {data.documentNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)] font-medium">Jenis Surat</span>
                  <span className="text-xs font-bold text-[var(--ink)]">{data.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)] font-medium">Keperluan</span>
                  <span className="text-xs font-semibold text-[var(--accent)] neu-pill-inset px-2.5 py-0.5">
                    {data.purposeCategory}
                  </span>
                </div>
              </div>

              {/* Citizen Information with privacy masking */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[var(--accent)]" /> Informasi Pemohon (Data Terproteksi)
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs neu-inset-sm p-4">
                  <div>
                    <span className="text-[var(--muted)] block text-[11px]">Nama Pemohon:</span>
                    <strong className="text-[var(--ink)]">{data.applicantName}</strong>
                  </div>
                  <div>
                    <span className="text-[var(--muted)] block text-[11px]">NIK (Disamarkan):</span>
                    <strong className="font-mono text-[var(--ink)]">{data.maskedNik}</strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-[var(--shadow-dark)]/15">
                    <span className="text-[var(--muted)] block text-[11px]">Desa Penerbit:</span>
                    <strong className="text-[var(--ink)]">
                      {data.villageName}, {data.districtName}, {data.regencyName}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Signing info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[var(--accent)]" /> Pengesahan Pejabat Berwenang
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs neu-inset-sm p-4">
                  <div>
                    <span className="text-[var(--muted)] block text-[11px]">Tanggal Pengesahan:</span>
                    <strong className="text-[var(--ink)]">
                      {new Date(data.issuedDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[var(--muted)] block text-[11px]">Disetujui Oleh:</span>
                    <strong className="text-[var(--ink)]">
                      {data.signedByName} ({data.signedByTitle})
                    </strong>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-[var(--shadow-dark)]/15">
                    <span className="text-[var(--muted)] block text-[10px]">Hash Integritas Kriptografis:</span>
                    <code className="text-[11px] font-mono text-[var(--muted)]">{data.documentHash}</code>
                  </div>
                </div>
              </div>

              <div className="p-3.5 neu-inset-sm text-xs text-[var(--muted)] flex items-start gap-2">
                <Lock className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">
                  Halaman ini adalah bukti cek keaslian publik resmi. Seluruh informasi dijamin keasliannya dan diterbitkan langsung melalui sistem pelayanan digital Pemerintah Desa Silihasih.
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
