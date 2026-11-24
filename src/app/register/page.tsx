'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Lock, 
  ArrowRight, 
  AlertTriangle, 
  Loader2, 
  MapPin, 
  IdCard,
  Home,
  Eye,
  EyeOff
} from 'lucide-react';
import { DESA, findRtWilayah, findRwWilayah } from '@/lib/desa-config';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    nik: '',
    noKk: '',
    birthPlace: 'Cirebon',
    birthDate: '1995-05-10',
    gender: 'LAKI_LAKI',
    address: 'Kp. Sukarasa',
    rt: '001',
    rw: '001',
    dusun: 'Dusun Wage',
    occupation: 'Buruh Harian',
    monthlyIncome: '1200000',
    familyMembersCount: '4',
    houseCondition: 'Menumpang / Kontrakan',
    economicDescription: 'Bekerja serabutan untuk menafkahi keluarga.',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

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

  const rtOptions = findRwWilayah(formData.rw)?.rt ?? [];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.nik || !formData.noKk) {
      setError('Mohon lengkapi data identitas wajib.');
      return;
    }

    if (!/^\d{16}$/.test(formData.nik.trim())) {
      setError('NIK harus berupa 16 digit angka kependudukan yang sah.');
      return;
    }

    if (!/^\d{16}$/.test(formData.noKk.trim())) {
      setError('Nomor KK harus berupa 16 digit angka.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pendaftaran gagal.');
      }

      if (data.requiresVerification) {
        const queryParams = new URLSearchParams({ email: data.email || formData.email });
        if (data.otpCode) {
          queryParams.set('code', data.otpCode);
        }
        router.push(`/verifikasi-otp?${queryParams.toString()}`);
        return;
      }

      router.push('/dashboard/masyarakat');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-6 sm:py-10 sm:px-6 lg:px-8 font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      <div className="fixed right-3 top-3 sm:right-4 sm:top-4 z-50">
        <ThemeToggle className="neu-raised-sm !h-9 !w-9 sm:!h-10 sm:!w-10 !p-0 !border-none text-[var(--ink)]" />
      </div>

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 neu-circle-inset flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition-transform">
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-left">
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-[var(--ink)]">Pelayanan Desa</h1>
            <p className="text-[10px] sm:text-xs text-[var(--muted)] font-medium">Pendaftaran Warga {DESA.nama}</p>
          </div>
        </Link>
        <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight">
          Buat Akun Pemohon Baru
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)] px-3">
          Lengkapi data identitas kependudukan — kode verifikasi (OTP) akan dikirim ke WhatsApp dan Email Anda
        </p>
      </div>

      <div className="mt-5 sm:mt-6 sm:mx-auto sm:w-full sm:max-w-2xl px-3 sm:px-0">
        <div className="neu-raised py-5 px-4 sm:py-8 sm:px-10">

          {error && (
            <div className="mb-6 p-3.5 neu-inset-sm text-[var(--stat-red)] text-xs rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">

            {/* Section 1: Kependudukan */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] pb-2 border-b border-[var(--shadow-dark)]/20 flex items-center gap-1.5">
                <IdCard className="w-4 h-4" /> 1. Data Kependudukan & Akun
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Nama Lengkap (Sesuai KTP) *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Contoh: Ahmad Dahlan"
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Email Aktif *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ahmad@gmail.com"
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">NIK (16 Digit) *</label>
                  <input
                    type="text"
                    name="nik"
                    maxLength={16}
                    value={formData.nik}
                    onChange={handleChange}
                    placeholder="320101XXXXXXXXXX"
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">No. KK (16 Digit) *</label>
                  <input
                    type="text"
                    name="noKk"
                    maxLength={16}
                    value={formData.noKk}
                    onChange={handleChange}
                    placeholder="320101XXXXXXXXXX"
                    required
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0812XXXXXXXX"
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Kata Sandi *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimal 6 karakter"
                      required
                      className="w-full py-2.5 pl-3.5 pr-11 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Sembunyikan' : 'Lihat kata sandi'}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus:outline-none ${
                        showPassword ? 'text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--accent)]'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.25} /> : <Eye className="w-5 h-5" strokeWidth={2.25} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    name="birthPlace"
                    value={formData.birthPlace}
                    onChange={handleChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Alamat */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] pb-2 border-b border-[var(--shadow-dark)]/20 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> 2. Alamat Domisili di {DESA.nama}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Alamat Jalan / Kampung</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">RT</label>
                  <select name="rt" value={formData.rt} onChange={handleWilayahChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]">
                    {rtOptions.map((rt) => <option key={rt} value={rt}>RT {rt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">RW</label>
                  <select name="rw" value={formData.rw} onChange={handleWilayahChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]">
                    {DESA.petaRWRT.map((row) => <option key={row.rw} value={row.rw}>RW {row.rw}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Dusun / Lingkungan</label>
                  <select name="dusun" value={formData.dusun} onChange={handleChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)]">
                    {DESA.dusun.map((row) => <option key={row.nama} value={row.nama}>{row.nama}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Sosial Ekonomi */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] pb-2 border-b border-[var(--shadow-dark)]/20 flex items-center gap-1.5">
                <Home className="w-4 h-4" /> 3. Data Sosial & Ekonomi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Pekerjaan</label>
                  <input type="text" name="occupation" value={formData.occupation} onChange={handleChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Penghasilan / Bulan (Rp)</label>
                  <input type="number" name="monthlyIncome" value={formData.monthlyIncome} onChange={handleChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">Jml Tanggungan Keluarga</label>
                  <input type="number" name="familyMembersCount" value={formData.familyMembersCount} onChange={handleChange}
                    className="w-full py-2.5 px-3.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neu-btn-primary w-full py-3.5 px-4 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan Akun...</>
              ) : (
                <> Daftar & Kirim Kode Verifikasi <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="text-center pt-6 border-t border-[var(--shadow-dark)]/20 mt-6">
            <p className="text-xs text-[var(--muted)]">
              Sudah memiliki akun?{' '}
              <Link href="/login" className="font-bold text-[var(--accent)] hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
