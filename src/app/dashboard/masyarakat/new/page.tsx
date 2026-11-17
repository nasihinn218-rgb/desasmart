'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, 
  ArrowLeft, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Sparkles, 
  FileText, 
  IdCard, 
  Home, 
  Briefcase,
  HelpCircle,
  ShieldCheck,
  Bot
} from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import { DESA, findRtWilayah, findRwWilayah } from '@/lib/desa-config';

export default function NewApplicationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAi, setCheckingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [error, setError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    // Keperluan
    purposeCategory: 'Pendidikan',
    purposeDescription: '',
    // Data Pemohon
    nik: '',
    noKk: '',
    fullName: '',
    birthPlace: 'Bogor',
    birthDate: '1992-04-15',
    gender: 'LAKI_LAKI',
    phone: '',
    address: 'Kp. Babakan RT 003 / RW 001, Dusun Wage',
    rt: '003',
    rw: '001',
    dusun: 'Dusun Wage',
    // Data Ekonomi
    occupation: 'Buruh Harian Lepas',
    monthlyIncome: 1200000,
    familyMembersCount: 4,
    houseCondition: 'Menumpang di rumah kerabat',
    economicDescription: 'Penghasilan buruh tidak tetap untuk menghidupi 1 istri dan 2 anak usia sekolah.',
  });

  // Uploaded documents state (simulating files or base64)
  const [documents, setDocuments] = useState<Array<{
    documentType: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    extractedText?: string;
  }>>([
    {
      documentType: 'KTP',
      fileName: 'ktp_pemohon.jpg',
      fileUrl: '/uploads/samples/ktp_sample.jpg',
      fileType: 'image/jpeg',
      fileSize: 420000,
      extractedText: 'NIK 3201011504920001 NAMA AHMAD DAHLAN',
    },
    {
      documentType: 'KK',
      fileName: 'kartu_keluarga.pdf',
      fileUrl: '/uploads/samples/kk_sample.pdf',
      fileType: 'application/pdf',
      fileSize: 850000,
      extractedText: 'NO KK 3201012908050002',
    },
    {
      documentType: 'PENDUKUNG',
      fileName: 'surat_pengantar_rt_rw.pdf',
      fileUrl: '/uploads/samples/pengantar_sample.pdf',
      fileType: 'application/pdf',
      fileSize: 310000,
      extractedText: 'SURAT PENGANTAR RT RW KELUARGA KURANG MAMPU',
    },
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          if (data.user?.citizen) {
            const c = data.user.citizen;
            setFormData((prev) => ({
              ...prev,
              fullName: c.fullName || data.user.name,
              nik: c.nik || '',
              noKk: c.noKk || '',
              phone: data.user.phone || c.phone || '',
              birthPlace: c.birthPlace || 'Bogor',
              birthDate: c.birthDate ? c.birthDate.split('T')[0] : '1992-04-15',
              gender: c.gender || 'LAKI_LAKI',
              address: c.address || prev.address,
              rt: c.rt || prev.rt,
              rw: c.rw || prev.rw,
              dusun: c.dusun || prev.dusun,
              occupation: c.occupation || prev.occupation,
              monthlyIncome: c.monthlyIncome || prev.monthlyIncome,
              familyMembersCount: c.familyMembersCount || prev.familyMembersCount,
              houseCondition: c.houseCondition || prev.houseCondition,
              economicDescription: c.economicDescription || prev.economicDescription,
            }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'monthlyIncome' || name === 'familyMembersCount' ? Number(value) : value,
    }));
    if (error) setError('');
  };

  // RT/RW/dusun mengikuti daftar resmi desa dan saling mengunci.
  const handleWilayahChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'rw') {
      const rwRow = findRwWilayah(value);
      setFormData((prev) => ({
        ...prev,
        rw: value,
        rt: rwRow && rwRow.rt.includes(prev.rt) ? prev.rt : rwRow?.rt[0] ?? prev.rt,
        dusun: rwRow?.dusun ?? prev.dusun,
      }));
      return;
    }
    if (name === 'rt') {
      const rtRow = findRtWilayah(value);
      setFormData((prev) => ({
        ...prev,
        rt: value,
        rw: rtRow?.rw ?? prev.rw,
        dusun: rtRow?.dusun ?? prev.dusun,
      }));
    }
  };

  // Data lama bisa berisi nomor di luar daftar resmi — tetap ditampilkan agar tidak hilang.
  const rtOptions = (() => {
    const list = findRwWilayah(formData.rw)?.rt ?? [];
    return list.includes(formData.rt) || !formData.rt ? list : [formData.rt, ...list];
  })();

  const dusunOptions = (() => {
    const names = DESA.dusun.map((row) => row.nama);
    return names.includes(formData.dusun) ? names : [formData.dusun, ...names];
  })();

  const handleRunAiCheck = async () => {
    setCheckingAi(true);
    try {
      const res = await fetch('/api/ai/check-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          documents,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAi(false);
    }
  };

  const handleFileUpload = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File ${file.name} melebihi batas ukuran 5MB.`);
      return;
    }

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError(`Format ${file.name} tidak didukung. Harap upload PDF, JPG, atau PNG.`);
      return;
    }

    // Update or append document
    const updated = documents.filter((d) => d.documentType !== docType);
    updated.push({
      documentType: docType,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileType: file.type,
      fileSize: file.size,
      extractedText: `${docType} ${file.name} ${formData.nik}`,
    });

    setDocuments(updated);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.purposeCategory || !formData.purposeDescription.trim()) {
      setError('Mohon isi keperluan pengajuan dan keterangannya.');
      return;
    }

    if (!/^\d{16}$/.test(formData.nik.trim())) {
      setError('NIK harus berupa 16 digit angka.');
      return;
    }

    if (!/^\d{16}$/.test(formData.noKk.trim())) {
      setError('Nomor KK harus berupa 16 digit angka.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          documents,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim pengajuan.');
      }

      router.push(`/dashboard/masyarakat/applications/${data.application.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat submit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-slate-50 to-cyan-50 font-sans pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-[-5rem] h-96 w-96 rounded-full bg-cyan-300/25 blur-3xl" />
        <div className="absolute top-[34rem] -left-32 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>
      <DashboardHeader user={user || { name: 'Warga', email: '', role: 'MASYARAKAT' }} />

      <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/masyarakat"
            className="group inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 hover:shadow-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/80 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
            Formulir SKTM Online
          </span>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-4 shadow-[0_24px_80px_-24px_rgba(15,118,110,0.28)] backdrop-blur-xl sm:p-7 lg:p-9">
          <div className="relative mb-8 overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-800 px-6 py-7 text-white shadow-xl shadow-emerald-900/20 sm:px-9 sm:py-9">
            <div aria-hidden="true" className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" />
            <div aria-hidden="true" className="absolute -bottom-24 right-36 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="relative max-w-3xl">
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-50 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                Layanan digital {DESA.nama}
              </span>
              <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                Permohonan Surat Keterangan Tidak Mampu
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/90 sm:text-base">
                Lengkapi data diri dan kondisi keluarga dengan benar. Petugas desa akan memeriksa permohonan Anda secara bertahap.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">01 · Data keperluan</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">02 · Data pemohon</span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">03 · Dokumen & pemeriksaan</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="sktm-form space-y-6 sm:space-y-7">
            {/* Bagian 1: Keperluan */}
            <div className="group space-y-5 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/60 p-5 shadow-lg shadow-emerald-950/[0.04] transition duration-300 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/[0.08] sm:p-7">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-slate-800 sm:text-base">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/25">
                  <FileText className="h-5 w-5" />
                </span>
                <span><span className="mr-2 text-emerald-600">01</span> Keperluan Pengajuan SKTM</span>
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Keperluan *</label>
                  <select
                    name="purposeCategory"
                    value={formData.purposeCategory}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="Pendidikan">Pendidikan (KIP-K / Beasiswa Sekolah)</option>
                    <option value="Kesehatan">Kesehatan (Keringanan RS / BPJS PBI)</option>
                    <option value="Bantuan sosial">Bantuan Sosial Pemerintah (PKH / Sembako)</option>
                    <option value="Administrasi">Administrasi Pengadilan / Hukum</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Keterangan Rinci Keperluan *
                  </label>
                  <input
                    type="text"
                    name="purposeDescription"
                    value={formData.purposeDescription}
                    onChange={handleInputChange}
                    placeholder="Contoh: Pengajuan beasiswa KIP Kuliah untuk anak pertama diterima di perguruan tinggi"
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Data Pemohon */}
            <div className="group space-y-5 rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-white to-cyan-50/60 p-5 shadow-lg shadow-cyan-950/[0.04] transition duration-300 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-900/[0.08] sm:p-7">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-slate-800 sm:text-base">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-600/25">
                  <IdCard className="h-5 w-5" />
                </span>
                <span><span className="mr-2 text-cyan-600">02</span> Data Pemohon <span className="font-medium text-slate-500">(Kependudukan)</span></span>
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK 16 Digit) *</label>
                  <input
                    type="text"
                    name="nik"
                    maxLength={16}
                    value={formData.nik}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kartu Keluarga (KK 16 Digit) *</label>
                  <input
                    type="text"
                    name="noKk"
                    maxLength={16}
                    value={formData.noKk}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Sesuai KTP *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RT</label>
                  <select
                    name="rt"
                    value={formData.rt}
                    onChange={handleWilayahChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    {rtOptions.map((rt) => (
                      <option key={rt} value={rt}>
                        RT {rt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">RW</label>
                  <select
                    name="rw"
                    value={formData.rw}
                    onChange={handleWilayahChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    {DESA.petaRWRT.map((row) => (
                      <option key={row.rw} value={row.rw}>
                        RW {row.rw}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dusun</label>
                  <select
                    name="dusun"
                    value={formData.dusun}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    {dusunOptions.map((nama) => (
                      <option key={nama} value={nama}>
                        {nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bagian 3: Data Sosial & Ekonomi */}
            <div className="group space-y-5 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/60 p-5 shadow-lg shadow-violet-950/[0.04] transition duration-300 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-900/[0.08] sm:p-7">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-slate-800 sm:text-base">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-600/25">
                  <Briefcase className="h-5 w-5" />
                </span>
                <span><span className="mr-2 text-violet-600">03</span> Data Kondisi Ekonomi Keluarga</span>
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan Pemohon *</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Penghasilan Rata-rata per Bulan (Rp) *</label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Anggota Keluarga / Tanggungan *</label>
                  <input
                    type="number"
                    name="familyMembersCount"
                    value={formData.familyMembersCount}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi Tempat Tinggal</label>
                  <input
                    type="text"
                    name="houseCondition"
                    value={formData.houseCondition}
                    onChange={handleInputChange}
                    placeholder="Contoh: Menumpang rumah keluarga / Sewa kontrakan 1 petak"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Kondisi Ekonomi Keluarga</label>
                  <textarea
                    rows={2}
                    name="economicDescription"
                    value={formData.economicDescription}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 4: Upload Dokumen */}
            <div className="group space-y-5 rounded-3xl border border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/60 p-5 shadow-lg shadow-amber-950/[0.04] transition duration-300 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-900/[0.08] sm:p-7">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-slate-800 sm:text-base">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-600/25">
                  <Upload className="h-5 w-5" />
                </span>
                <span><span className="mr-2 text-amber-600">04</span> Unggah Dokumen Pendukung <span className="block pt-1 text-xs font-medium text-slate-500 sm:inline sm:pt-0">(PDF, JPG, PNG maks. 5MB)</span></span>
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                {/* KTP */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/10 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Foto KTP Asli *</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Wajib</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('KTP', e)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700"
                  />
                  <p className="text-[11px] text-slate-400">
                    File saat ini: {documents.find((d) => d.documentType === 'KTP')?.fileName || 'Belum diunggah'}
                  </p>
                </div>

                {/* KK */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/10 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Kartu Keluarga (KK) *</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Wajib</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('KK', e)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700"
                  />
                  <p className="text-[11px] text-slate-400">
                    File saat ini: {documents.find((d) => d.documentType === 'KK')?.fileName || 'Belum diunggah'}
                  </p>
                </div>

                {/* Surat Pengantar */}
                <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/10 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Surat Pengantar RT/RW</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">Dianjurkan</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('PENDUKUNG', e)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700"
                  />
                  <p className="text-[11px] text-slate-400">
                    File saat ini: {documents.find((d) => d.documentType === 'PENDUKUNG')?.fileName || 'Belum diunggah'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Assistant Checker Card */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-900 p-5 text-white shadow-xl shadow-emerald-950/20 sm:p-7">
              <div aria-hidden="true" className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/15 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.16)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold sm:text-base">Pemeriksaan Awal Asisten AI</h4>
                    <p className="mt-1 text-xs text-emerald-100/70">Verifikasi kelengkapan format & dokumen otomatis</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunAiCheck}
                  disabled={checkingAi}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400 px-4 py-2.5 text-xs font-extrabold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {checkingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Memeriksa...
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      Cek dengan AI
                    </>
                  )}
                </button>
              </div>

              {aiAnalysis && (
                <div className="pt-3 border-t border-slate-700 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Skor Kelengkapan Berkas:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {aiAnalysis.score}%
                    </span>
                  </div>

                  {aiAnalysis.warnings.length > 0 && (
                    <div className="p-2.5 bg-amber-950/40 border border-amber-600/40 rounded-xl text-amber-200 text-[11px] space-y-1">
                      <strong className="text-amber-400 block">Peringatan AI:</strong>
                      {aiAnalysis.warnings.map((w: string, idx: number) => (
                        <p key={idx}>• {w}</p>
                      ))}
                    </div>
                  )}

                  {aiAnalysis.recommendations.length > 0 && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-600/40 rounded-xl text-emerald-200 text-[11px]">
                      <strong className="text-emerald-400 block">Catatan Rekomendasi AI:</strong>
                      {aiAnalysis.recommendations.map((r: string, idx: number) => (
                        <p key={idx}>• {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center">
              <Link
                href="/dashboard/masyarakat"
                className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Batal
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-emerald-700/25 transition duration-300 hover:-translate-y-0.5 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 hover:shadow-2xl hover:shadow-emerald-700/30 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim Pengajuan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Kirim Permohonan SKTM
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

    </div>
  );
}
