'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { DESA, DESA_ALAMAT_LENGKAP } from '@/lib/desa-config';
import {
  Layers,
  ShieldCheck,
  QrCode,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

const WORK_STEPS = [
  {
    step: 1,
    title: 'Isi formulir dan berkas',
    description: 'Isi data Anda dan unggah foto KTP dan Kartu Keluarga dari HP.',
  },
  {
    step: 2,
    title: 'Dicek otomatis',
    description: 'Sistem memeriksa kelengkapan formulir dan berkas Anda.',
  },
  {
    step: 3,
    title: 'Diperiksa petugas desa',
    description: 'Staf Loket dan Kasi Pelayanan memeriksa berkas Anda.',
  },
  {
    step: 4,
    title: 'Disetujui dan diunduh',
    description: 'Kepala Desa menyetujui, lalu surat PDF bernomor resmi siap diunduh.',
  },
];

const ADVANTAGES = [
  {
    icon: Layers,
    title: 'Pantau status kapan saja',
    description:
      'Lihat perkembangan pengajuan dari akun Anda, lengkap dengan riwayat setiap tahap.',
  },
  {
    icon: ShieldCheck,
    title: 'Diperiksa berlapis',
    description:
      'Setiap pengajuan diperiksa Staf Loket dan Kasi Pelayanan, lalu disetujui Kepala Desa. Semua tercatat.',
  },
  {
    icon: QrCode,
    title: 'Surat dilengkapi QR Code',
    description:
      'Setiap surat punya kode QR unik agar keasliannya bisa dicek dan tidak bisa dipalsukan.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [verifyNumber, setVerifyNumber] = useState('');

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyNumber.trim()) {
      router.push(`/verify/${encodeURIComponent(verifyNumber.trim())}`);
    }
  };

  return (
    <div className="neu-page flex min-h-screen flex-col selection:bg-[var(--accent)] selection:text-[var(--accent-ink)]">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div
              className="neu-raised-sm flex h-11 w-11 shrink-0 items-center justify-center font-extrabold text-xl text-[var(--accent)]"
              aria-hidden="true"
            >
              D
            </div>
            <div>
              <b className="block text-base font-extrabold leading-tight text-[var(--ink)]">
                DesaSmart
              </b>
              <span className="block text-xs text-[var(--muted)]">
                {DESA.nama}, {DESA.kabupaten}
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2.5 sm:gap-3">
            <a
              href="#cek"
              className="neu-pill hidden sm:inline-flex"
            >
              Cek keaslian surat
            </a>
            <Link
              href="/login"
              className="neu-pill"
            >
              Masuk
            </Link>
            <ThemeToggle className="neu-pill !h-11 !w-11 !min-h-[44px] !min-w-[44px] !p-0 !border-0 text-[var(--ink)]" />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* 2. Hero Section (Rata Tengah) */}
        <section className="mx-auto max-w-[820px] px-5 pb-14 pt-16 text-center sm:pt-20 lg:pt-24">
          <h1 className="mb-5 text-3xl font-extrabold tracking-normal text-[var(--ink)] sm:text-5xl lg:text-[3.25rem]">
            Urus surat desa tanpa antre, semua lewat HP.
          </h1>
          <p className="mx-auto mb-8 max-w-[60ch] text-base leading-[1.7] text-[var(--muted)] sm:text-lg">
            Ajukan surat keterangan dari rumah dan pantau prosesnya sampai surat terbit.
          </p>

          <div>
            <Link
              href="/login"
              className="neu-btn-primary"
            >
              Ajukan surat online
            </Link>
          </div>

          {/* Tiga Poin Kepercayaan (Pill Inset) */}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3 p-0 list-none">
            <li className="neu-pill-inset">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span>Selesai 1–2 hari kerja</span>
            </li>
            <li className="neu-pill-inset">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span>Diperiksa staf dan Kepala Desa</span>
            </li>
            <li className="neu-pill-inset">
              <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
              <span>Bebas pungli</span>
            </li>
          </ul>
        </section>

        {/* 3. Bagian: 4 Langkah Mudah Ajukan Surat Online */}
        <section className="mx-auto max-w-[1100px] px-5 py-12 lg:py-16" aria-labelledby="alur-judul">
          <h2
            id="alur-judul"
            className="mb-2 text-center text-2xl font-extrabold text-[var(--ink)] sm:text-3xl"
          >
            4 langkah mudah ajukan surat online
          </h2>
          <p className="mx-auto mb-10 max-w-[60ch] text-center text-base leading-[1.7] text-[var(--muted)]">
            Tanpa antre di balai desa. Semua tahap tercatat dan bisa Anda pantau.
          </p>

          <ol className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
            {WORK_STEPS.map((step) => (
              <li
                key={step.step}
                className="neu-raised flex flex-col items-start p-6 text-left"
              >
                <div className="neu-circle-inset mb-4 flex items-center justify-center">
                  {step.step}
                </div>
                <b className="mb-2 block text-base font-bold text-[var(--ink)] sm:text-lg">
                  {step.title}
                </b>
                <span className="text-sm leading-[1.65] text-[var(--muted)]">
                  {step.description}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* 4. Bagian: Jelas dan Aman untuk Warga */}
        <section className="mx-auto max-w-[1100px] px-5 py-12 lg:py-16" aria-labelledby="aman-judul">
          <h2
            id="aman-judul"
            className="mb-2 text-center text-2xl font-extrabold text-[var(--ink)] sm:text-3xl"
          >
            Jelas dan aman untuk warga
          </h2>
          <p className="mx-auto mb-10 max-w-[60ch] text-center text-base leading-[1.7] text-[var(--muted)]">
            Dibuat supaya urusan surat desa lebih mudah dan transparan.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {ADVANTAGES.map((item) => (
              <div
                key={item.title}
                className="neu-raised p-6 text-left"
              >
                <div className="neu-circle-inset-sm mb-4 flex items-center justify-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <b className="mb-2 block text-base font-bold text-[var(--ink)] sm:text-lg">
                  {item.title}
                </b>
                <p className="m-0 text-sm leading-[1.65] text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Bagian: Cek Keaslian Surat */}
        <section
          id="cek"
          className="mx-auto max-w-[680px] px-5 py-12 lg:py-16 text-center"
          aria-labelledby="cek-judul"
        >
          <div className="neu-raised p-7 sm:p-10">
            <h2
              id="cek-judul"
              className="mb-2 text-2xl font-extrabold text-[var(--ink)] sm:text-3xl"
            >
              Cek keaslian surat
            </h2>
            <p className="mx-auto mb-7 max-w-[50ch] text-sm text-[var(--muted)] sm:text-base">
              Untuk bank, sekolah, atau instansi yang menerima surat dari warga.
            </p>

            <form onSubmit={handleVerifySearch} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                aria-label="Nomor surat"
                value={verifyNumber}
                onChange={(e) => setVerifyNumber(e.target.value)}
                placeholder="Contoh: 470/028/SKTM/X/2026"
                className="neu-inset min-h-[50px] flex-1 min-w-0 px-4 py-3 text-base text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
              />
              <button
                type="submit"
                className="neu-btn-primary shrink-0 !py-3 !px-7"
              >
                Cek keaslian
              </button>
            </form>

            <div className="mt-4 text-xs leading-relaxed text-[var(--muted)]">
              Anda juga bisa memindai kode QR yang tercetak di surat fisik atau membuka tautan verifikasi resmi.
            </div>
          </div>
        </section>
      </main>

      {/* 6. Footer (Tetap Gelap) */}
      <footer className="mt-auto bg-[#131a17] px-5 py-14 text-[#c9d2cc]">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Kolom 1: Identitas Desa */}
            <div className="rounded-2xl bg-white/[0.03] p-6 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]">
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3a5a4a] text-lg font-extrabold text-white"
                  aria-hidden="true"
                >
                  D
                </div>
                <b className="text-lg font-extrabold text-white">
                  Pemerintah {DESA.nama}
                </b>
              </div>
              <p className="text-sm leading-relaxed text-[#a3afa8]">
                {DESA.kecamatan}, {DESA.kabupaten}, {DESA.provinsi}. Berkomitmen memberikan
                pelayanan administrasi publik yang cepat, inklusif, dan bebas pungli.
              </p>
            </div>

            {/* Kolom 2: Kontak Kantor */}
            <div className="rounded-2xl bg-white/[0.03] p-6 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] space-y-3">
              <h3 className="text-base font-bold text-white">
                Kontak kantor
              </h3>
              <div className="space-y-2 text-sm text-[#a3afa8]">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[#7fb095]" />
                  <span>{DESA.telepon || '(0231) 876-5432'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-[#7fb095]" />
                  <span>{DESA.email || 'pelayanan@silihasih.desa.id'}</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#7fb095]" />
                  <span>{DESA_ALAMAT_LENGKAP}</span>
                </p>
              </div>
            </div>

            {/* Kolom 3: Jam Pelayanan Loket */}
            <div className="rounded-2xl bg-white/[0.03] p-6 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] space-y-3">
              <h3 className="text-base font-bold text-white">
                Jam pelayanan loket
              </h3>
              <div className="space-y-1.5 text-sm text-[#a3afa8]">
                <p>Senin – Kamis: 08.00 – 15.00 WIB</p>
                <p>Jumat: 08.00 – 14.30 WIB</p>
                <p className="pt-2 font-bold text-[#a9d4bd]">
                  Pengajuan online dibuka setiap hari, 24 jam
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-[#2b3630] pt-6 text-center text-xs text-[#a3afa8]">
            &copy; {new Date().getFullYear()} Pemerintah {DESA.nama}. Hak Cipta Dilindungi Undang-Undang.
          </div>
        </div>
      </footer>
    </div>
  );
}
