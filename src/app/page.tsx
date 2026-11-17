'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { DESA, DESA_ALAMAT_LENGKAP } from '@/lib/desa-config';
import {
  Home,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Phone,
  MapPin,
  Mail,
  Search,
  Layers,
  Menu,
  X,
  QrCode,
  Clock,
  CheckCircle2,
  ChevronDown,
  FileText,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '#cara-kerja', label: 'Cara Kerja' },
  { href: '#keunggulan', label: 'Keunggulan' },
  { href: '#faq', label: 'FAQ' },
  { href: '#kontak', label: 'Kontak Desa' },
];

const WORK_STEPS = [
  {
    title: 'Isi Formulir & Berkas',
    description:
      'Pemohon mengisi data ekonomi, keperluan SKTM, serta mengunggah foto KTP dan Kartu Keluarga langsung dari perangkat mana saja.',
  },
  {
    title: 'Pemeriksaan Kelengkapan',
    description:
      'Formulir dan berkas diperiksa otomatis oleh sistem sebelum diteruskan ke tahapan pelayanan berikutnya.',
  },
  {
    title: 'Verifikasi Berjenjang',
    description:
      'Staf loket memeriksa keabsahan berkas, lalu diteruskan ke Superadmin Kasi Pelayanan untuk validasi faktual.',
  },
  {
    title: 'Persetujuan & Unduh',
    description:
      'Kepala Desa menyetujui, SKTM PDF ber-Nomor Surat resmi dan QR Code terbit otomatis serta siap dicetak warga.',
  },
];

const ADVANTAGES = [
  {
    icon: Layers,
    title: 'Pantau Status Pengajuan',
    description:
      'Warga dapat melihat perkembangan permohonan SKTM secara online melalui dasbor akun masing-masing, lengkap dengan riwayat setiap tahapan.',
  },
  {
    icon: QrCode,
    title: 'QR Code Verifikasi Dokumen',
    description:
      'Setiap dokumen SKTM memiliki tautan verifikasi publik dan hash kriptografis unik untuk mencegah pemalsuan surat oleh pihak luar.',
  },
  {
    icon: ShieldCheck,
    title: 'Alur RBAC 4 Tingkat',
    description:
      'Pemisahan wewenang yang tegas antara Masyarakat, Staf Loket, Superadmin (Kasi Pelayanan), dan Kepala Desa dengan audit log lengkap.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Berapa lama waktu penerbitan SKTM online?',
    answer:
      'Biasanya proses memakan waktu 1–2 hari kerja setelah dokumen lengkap dikirimkan. Anda dapat memantau status setiap saat di dasbor pemohon.',
  },
  {
    question: 'Apakah perlu datang ke balai desa untuk mengambil surat fisik?',
    answer:
      'Tidak perlu. SKTM yang telah disetujui Kepala Desa berformat PDF resmi dengan QR Code verifikasi publik yang sah dan dapat dicetak mandiri di rumah atau dilampirkan secara digital.',
  },
  {
    question: 'Apa yang terjadi jika berkas saya dinyatakan "Perlu Perbaikan"?',
    answer:
      'Petugas akan mencantumkan catatan spesifik kekurangan (misalnya foto KTP buram). Anda cukup login ke dasbor, membaca catatan petugas, klik "Perbaiki Pengajuan", lalu unggah berkas yang benar.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [verifyNumber, setVerifyNumber] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyNumber.trim()) {
      router.push(`/verify/${encodeURIComponent(verifyNumber.trim())}`);
    }
  };

  return (
    <div className="landing-page flex min-h-screen flex-col bg-[var(--canvas)] font-sans text-slate-800 selection:bg-emerald-200 selection:text-slate-950">
      {/* Top Navbar — tetap terlihat saat discroll */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
          scrolled
            ? 'border-[var(--border)] bg-[var(--surface)]/95 shadow-lg shadow-slate-900/5'
            : 'border-transparent bg-[var(--surface)]/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex shrink-0 items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-dark)] text-[var(--accent-mint)] shadow-lg shadow-slate-900/20 transition-transform group-hover:scale-105">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-slate-900">
                    DesaSmart
                  </span>
                  <span className="rounded border border-emerald-700/15 bg-emerald-700/5 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                    LAYANAN SKTM
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">{DESA.nama}, {DESA.kabupaten}</p>
              </div>
            </Link>

            <div className="flex items-center gap-2.5">
              <ThemeToggle className="hidden sm:inline-flex" />
              <Link
                href="/verify"
                className="hidden items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 sm:inline-flex"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                Cek SKTM
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-[var(--surface-dark)] px-4 py-2 text-xs font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                Masuk / Login
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-controls="landing-nav-panel"
                aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                className="rounded-xl border border-slate-300 bg-[var(--surface)] p-2 text-slate-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Panel navigasi: muncul & menghilang saat garis tiga diklik */}
        <div
          id="landing-nav-panel"
          className={`grid transition-all duration-300 ease-in-out ${
            menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <nav className="border-t border-[var(--border)]/70 bg-[var(--surface)]/95">
              <div className="max-w-7xl mx-auto flex flex-col gap-1 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2 sm:px-6 lg:px-8">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  href="/verify"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 sm:hidden"
                >
                  Cek SKTM
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--surface-muted)]/60 via-[var(--canvas)] to-[var(--canvas)] pb-20 pt-14 lg:pb-28 lg:pt-20">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-16 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-4 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
            {/* Left Content */}
            <div className="relative space-y-7 text-center lg:col-span-7 lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-[var(--surface)]/80 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Pelayanan Administrasi Desa Digital Terpadu 2026</span>
              </div>

              <h1 className="text-4xl font-black leading-[1.12] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Urus Surat Desa{' '}
                <span className="bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                  Tanpa Antre
                </span>
                , Semua Online.
              </h1>

              <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
                Ajukan SKTM dengan mudah, cepat, dan transparan. Pantau setiap tahapan pengajuan
                secara real-time melalui verifikasi berjenjang dari Staf, Superadmin, hingga
                Kepala Desa.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-3.5 pt-1 sm:flex-row lg:justify-start">
                <Link
                  href="/login"
                  className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--surface-dark)] px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-slate-900/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 sm:w-auto"
                >
                  Ajukan SKTM Online
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/verify"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-[var(--surface)]/80 px-5 py-3.5 text-sm font-bold text-slate-800 shadow-xs transition-colors hover:border-emerald-300 hover:bg-emerald-50 sm:w-auto"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Cek Keaslian Dokumen
                </Link>
              </div>

              {/* Fast Document Verification Bar */}
              <div className="mx-auto max-w-lg pt-2 lg:mx-0">
                <form
                  onSubmit={handleVerifySearch}
                  className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-[var(--surface)]/90 p-1.5 shadow-xl shadow-slate-900/10"
                >
                  <Search className="ml-2.5 h-4 w-4 shrink-0 text-emerald-700" />
                  <input
                    type="text"
                    value={verifyNumber}
                    onChange={(e) => setVerifyNumber(e.target.value)}
                    placeholder="Punya nomor SKTM? Contoh: 470/028/SKTM/X/2026"
                    className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 cursor-pointer rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-800"
                  >
                    Verifikasi
                  </button>
                </form>
                <p className="mt-1.5 pl-1 text-left text-[11px] text-slate-500">
                  Verifikasi dokumen instan via nomor surat atau scan QR Code resmi desa.
                </p>
              </div>

              {/* Mini stats */}
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-2 lg:justify-start">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-slate-700">1–2 hari kerja</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-slate-700">4 tahap verifikasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-semibold text-slate-700">Bebas pungli</span>
                </div>
              </div>
            </div>

            {/* Right Visual: contoh dokumen resmi */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[var(--surface-dark)] p-5 shadow-2xl shadow-emerald-950/40 sm:p-7">
                  {/* Kop surat */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
                        <Home className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-white">Pemerintah {DESA.nama}</p>
                        <p className="text-[10px] text-slate-400">{DESA.kabupaten}, {DESA.provinsi}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                      ● ONLINE
                    </span>
                  </div>

                  {/* Ilustrasi desa */}
                  <div className="relative mt-4 h-28 overflow-hidden rounded-2xl border border-white/10 sm:h-32">
                    <Image
                      src="/desa-tenang.svg"
                      alt={`Ilustrasi suasana ${DESA.nama} yang asri`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-dark)] via-transparent to-transparent" />
                  </div>

                  {/* Isi dokumen */}
                  <div className="mt-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-white">
                        <FileText className="h-4 w-4 text-emerald-300" />
                        <p className="text-xs font-extrabold tracking-wide">SURAT KETERANGAN TIDAK MAMPU</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200 ring-1 ring-emerald-300/25">
                        <CheckCircle2 className="h-3 w-3" />
                        TERVERIFIKASI
                      </span>
                    </div>

                    <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Nomor Surat</span>
                        <span className="font-mono font-bold text-emerald-200">470/028/SKTM/X/2026</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Pemohon</span>
                        <span className="font-semibold text-white">A*****h D*****n</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">NIK (disamarkan)</span>
                        <span className="font-mono font-semibold text-white">3201******0001</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px]">
                        <span className="text-slate-400">Penandatangan</span>
                        <span className="font-semibold text-white">Kepala Desa · TTE</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-inner">
                        <QrCode className="h-9 w-9" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white">Verifikasi Publik QR</p>
                        <p className="truncate font-mono text-[10px] text-slate-400">
                          hash: e3b0c44298fc1c14…
                        </p>
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                          Scan untuk memeriksa keaslian surat dari mana saja.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chip mengambang */}
                <div className="absolute -right-3 -top-3 rotate-3 rounded-2xl border border-emerald-200 bg-[var(--surface)] px-3.5 py-2 shadow-xl">
                  <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Anti-Pemalsuan
                  </p>
                </div>
                <div className="absolute -bottom-3 -left-3 -rotate-2 rounded-2xl border border-slate-200 bg-[var(--surface)] px-3.5 py-2 shadow-xl">
                  <p className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-800">
                    <Clock className="h-3.5 w-3.5 text-emerald-700" />
                    Terbit Otomatis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cara Kerja Section — satu-satunya tempat alur 4 langkah */}
      <section id="cara-kerja" className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--surface-muted)]/40 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-800">
              Alur Layanan
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              4 Langkah Mudah Pengajuan SKTM Online
            </h2>
            <p className="text-sm text-slate-600">
              Tanpa perlu antre di balai desa berjam-jam, seluruh alur terdokumentasi dan transparan
              dari awal hingga akhir.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-4">
            {WORK_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="group relative space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-black text-white shadow-lg shadow-emerald-900/20 transition-transform group-hover:scale-105">
                  {index + 1}
                </div>
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{step.description}</p>
                {index < WORK_STEPS.length - 1 && (
                  <ArrowRight
                    aria-hidden="true"
                    className="absolute -right-5 top-9 hidden h-5 w-5 text-slate-300 md:block"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keunggulan Section */}
      <section id="keunggulan" className="scroll-mt-20 border-t border-[var(--border)] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-800">
              Keunggulan
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Modern, Akuntabel, dan Ramah Masyarakat
            </h2>
            <p className="text-sm text-slate-600">
              Dirancang khusus untuk standar birokrasi pemerintahan desa modern di Indonesia.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {ADVANTAGES.map((item) => (
              <div
                key={item.title}
                className="space-y-3 rounded-2xl border border-slate-200 bg-[var(--surface)] p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-950/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="scroll-mt-20 border-t border-[var(--border)] bg-[var(--surface-muted)]/40 py-20">
        <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="space-y-3 text-center">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-800">
              Panduan Warga
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-slate-200 bg-[var(--surface)] p-5 shadow-sm transition-colors open:border-emerald-300 hover:border-emerald-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-emerald-700" />
                    {item.question}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 pl-6 text-xs leading-relaxed text-slate-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Kontak / Footer */}
      <footer id="kontak" className="scroll-mt-20 bg-[var(--surface-dark)] py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white">
                  <Home className="h-5 w-5" />
                </div>
                <span className="text-lg font-black">Pemerintah {DESA.nama}</span>
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-slate-400">
                {DESA.kecamatan}, {DESA.kabupaten}, {DESA.provinsi}. Berkomitmen memberikan
                pelayanan administrasi publik yang cepat, inklusif, dan bebas pungli.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Kontak Kantor</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> {DESA.telepon}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> {DESA.email}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" /> {DESA_ALAMAT_LENGKAP}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Jam Pelayanan Loket</h4>
              <div className="space-y-1 text-xs text-slate-400">
                <p>Senin – Kamis: 08.00 – 15.00 WIB</p>
                <p>Jumat: 08.00 – 14.30 WIB</p>
                <p className="pt-1 text-[11px] font-semibold text-emerald-300">
                  Layanan SKTM online {DESA.nama}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Pemerintah {DESA.nama}. Hak Cipta Dilindungi
            Undang-Undang.
          </div>
        </div>
      </footer>
    </div>
  );
}
