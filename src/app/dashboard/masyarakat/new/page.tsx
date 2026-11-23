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
import AdminSidebar from '@/components/AdminSidebar';
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
    <div className="min-h-screen font-sans pb-16" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      <DashboardHeader user={user || { name: 'Warga', email: '', role: 'MASYARAKAT' }} />
      <AdminSidebar role="MASYARAKAT" />

      <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/masyarakat"
            className="neu-pill px-4 py-2.5 text-sm font-semibold text-[var(--ink)] inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>

          <span className="neu-pill-inset px-3.5 py-2 text-xs font-bold text-[var(--accent)] inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Formulir SKTM Online
          </span>
        </div>

        <div className="neu-raised p-4 sm:p-7 lg:p-9 overflow-hidden">
          <div className="neu-raised p-6 sm:p-8 space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="neu-circle-inset flex items-center justify-center text-[var(--accent)] shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <span className="neu-pill-inset px-3 py-1 text-xs font-semibold text-[var(--accent)] inline-flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3 w-3" /> Layanan Digital {DESA.nama}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
                  Permohonan Surat Keterangan Tidak Mampu
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Lengkapi data diri dan kondisi keluarga dengan benar. Petugas desa akan memeriksa permohonan Anda secara bertahap.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="neu-pill-inset px-3 py-1 text-[var(--muted)]">01 · Data keperluan</span>
              <span className="neu-pill-inset px-3 py-1 text-[var(--muted)]">02 · Data pemohon</span>
              <span className="neu-pill-inset px-3 py-1 text-[var(--muted)]">03 · Kondisi ekonomi</span>
              <span className="neu-pill-inset px-3 py-1 text-[var(--muted)]">04 · Dokumen pendukung</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 neu-inset-sm text-sm text-[var(--stat-red)]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="sktm-form space-y-6 sm:space-y-7">
            {/* Bagian 1: Keperluan */}
            <div className="neu-raised p-5 sm:p-7 space-y-5">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-[var(--ink)] sm:text-base">
                <div className="neu-circle-inset-sm flex items-center justify-center text-[var(--accent)]">
                  <FileText className="h-5 w-5" />
                </div>
                <span><span className="mr-2 text-[var(--accent)]">01</span> Keperluan Pengajuan SKTM</span>
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Kategori Keperluan *</label>
                  <select
                    name="purposeCategory"
                    value={formData.purposeCategory}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  >
                    <option value="Pendidikan">Pendidikan (KIP-K / Beasiswa Sekolah)</option>
                    <option value="Kesehatan">Kesehatan (Keringanan RS / BPJS PBI)</option>
                    <option value="Bantuan sosial">Bantuan Sosial Pemerintah (PKH / Sembako)</option>
                    <option value="Administrasi">Administrasi Pengadilan / Hukum</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    Keterangan Rinci Keperluan *
                  </label>
                  <input
                    type="text"
                    name="purposeDescription"
                    value={formData.purposeDescription}
                    onChange={handleInputChange}
                    placeholder="Contoh: Pengajuan beasiswa KIP Kuliah untuk anak pertama diterima di perguruan tinggi"
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 2: Data Pemohon */}
            <div className="neu-raised p-5 sm:p-7 space-y-5">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-[var(--ink)] sm:text-base">
                <div className="neu-circle-inset-sm flex items-center justify-center text-[var(--accent)]">
                  <IdCard className="h-5 w-5" />
                </div>
                <span><span className="mr-2 text-[var(--accent)]">02</span> Data Pemohon <span className="font-medium text-[var(--muted)]">(Kependudukan)</span></span>
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nomor Induk Kependudukan (NIK 16 Digit) *</label>
                  <input
                    type="text"
                    name="nik"
                    maxLength={16}
                    value={formData.nik}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset font-mono text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nomor Kartu Keluarga (KK 16 Digit) *</label>
                  <input
                    type="text"
                    name="noKk"
                    maxLength={16}
                    value={formData.noKk}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset font-mono text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nama Lengkap Sesuai KTP *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Jenis Kelamin</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  >
                    <option value="LAKI_LAKI">Laki-laki</option>
                    <option value="PEREMPUAN">Perempuan</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Alamat Tempat Tinggal</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">RT</label>
                  <select
                    name="rt"
                    value={formData.rt}
                    onChange={handleWilayahChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  >
                    {rtOptions.map((rt) => (
                      <option key={rt} value={rt}>
                        RT {rt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">RW</label>
                  <select
                    name="rw"
                    value={formData.rw}
                    onChange={handleWilayahChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  >
                    {DESA.petaRWRT.map((row) => (
                      <option key={row.rw} value={row.rw}>
                        RW {row.rw}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Dusun</label>
                  <select
                    name="dusun"
                    value={formData.dusun}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
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
            <div className="neu-raised p-5 sm:p-7 space-y-5">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-[var(--ink)] sm:text-base">
                <div className="neu-circle-inset-sm flex items-center justify-center text-[var(--accent)]">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span><span className="mr-2 text-[var(--accent)]">03</span> Data Kondisi Ekonomi Keluarga</span>
              </h3>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Pekerjaan Pemohon *</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Penghasilan Rata-rata per Bulan (Rp) *</label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset font-mono text-[var(--ink)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Jumlah Anggota Keluarga / Tanggungan *</label>
                  <input
                    type="number"
                    name="familyMembersCount"
                    value={formData.familyMembersCount}
                    onChange={handleInputChange}
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset font-mono text-[var(--ink)]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Kondisi Tempat Tinggal</label>
                  <input
                    type="text"
                    name="houseCondition"
                    value={formData.houseCondition}
                    onChange={handleInputChange}
                    placeholder="Contoh: Menumpang rumah keluarga / Sewa kontrakan 1 petak"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Keterangan Kondisi Ekonomi Keluarga</label>
                  <textarea
                    rows={2}
                    name="economicDescription"
                    value={formData.economicDescription}
                    onChange={handleInputChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 4: Upload Dokumen */}
            <div className="neu-raised p-5 sm:p-7 space-y-5">
              <h3 className="flex items-center gap-3 text-sm font-extrabold tracking-wide text-[var(--ink)] sm:text-base">
                <div className="neu-circle-inset-sm flex items-center justify-center text-[var(--accent)]">
                  <Upload className="h-5 w-5" />
                </div>
                <span><span className="mr-2 text-[var(--accent)]">04</span> Unggah Dokumen Pendukung <span className="block pt-1 text-xs font-medium text-[var(--muted)] sm:inline sm:pt-0">(PDF, JPG, PNG maks. 5MB)</span></span>
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                {/* KTP */}
                <div className="space-y-3 neu-inset-sm p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--ink)]">Foto KTP Asli *</span>
                    <span className="text-[10px] neu-pill-inset px-2 py-0.5 text-[var(--accent)] font-bold">Wajib</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('KTP', e)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-[var(--shadow-dark)]/20 file:text-[var(--ink)]"
                  />
                  <p className="text-[11px] text-[var(--muted)]">
                    File saat ini: {documents.find((d) => d.documentType === 'KTP')?.fileName || 'Belum diunggah'}
                  </p>
                </div>

                {/* KK */}
                <div className="space-y-3 neu-inset-sm p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--ink)]">Kartu Keluarga (KK) *</span>
                    <span className="text-[10px] neu-pill-inset px-2 py-0.5 text-[var(--accent)] font-bold">Wajib</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('KK', e)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-[var(--shadow-dark)]/20 file:text-[var(--ink)]"
                  />
                  <p className="text-[11px] text-[var(--muted)]">
                    File saat ini: {documents.find((d) => d.documentType === 'KK')?.fileName || 'Belum diunggah'}
                  </p>
                </div>

                {/* Surat Pengantar */}
                <div className="space-y-3 neu-inset-sm p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--ink)]">Surat Pengantar RT/RW</span>
                    <span className="text-[10px] neu-pill-inset px-2 py-0.5 text-[var(--muted)] font-semibold">Dianjurkan</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('PENDUKUNG', e)}
                    className="text-xs w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:bg-[var(--shadow-dark)]/20 file:text-[var(--ink)]"
                  />
                  <p className="text-[11px] text-[var(--muted)]">
                    File saat ini: {documents.find((d) => d.documentType === 'PENDUKUNG')?.fileName || 'Belum diunggah'}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Assistant Checker Card */}
            <div className="neu-raised p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="neu-circle-inset-sm flex items-center justify-center text-[var(--accent)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold sm:text-base text-[var(--ink)]">Pemeriksaan Awal Asisten AI</h4>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">Verifikasi kelengkapan format & dokumen otomatis</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunAiCheck}
                  disabled={checkingAi}
                  className="neu-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="pt-3 border-t border-[var(--shadow-dark)]/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Skor Kelengkapan Berkas:</span>
                    <span className="font-mono font-bold text-[var(--stat-green)] text-sm">
                      {aiAnalysis.score}%
                    </span>
                  </div>

                  {aiAnalysis.warnings.length > 0 && (
                    <div className="p-3 neu-inset-sm text-[var(--stat-orange)] text-[11px] space-y-1">
                      <strong className="block font-bold">Peringatan AI:</strong>
                      {aiAnalysis.warnings.map((w: string, idx: number) => (
                        <p key={idx}>• {w}</p>
                      ))}
                    </div>
                  )}

                  {aiAnalysis.recommendations.length > 0 && (
                    <div className="p-3 neu-inset-sm text-[var(--stat-green)] text-[11px]">
                      <strong className="block font-bold">Catatan Rekomendasi AI:</strong>
                      {aiAnalysis.recommendations.map((r: string, idx: number) => (
                        <p key={idx}>• {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t border-[var(--shadow-dark)]/20 pt-6 sm:flex-row sm:items-center">
              <Link
                href="/dashboard/masyarakat"
                className="neu-pill px-6 py-3.5 text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)] text-center"
              >
                Batal
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="neu-btn-primary px-7 py-3.5 text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
