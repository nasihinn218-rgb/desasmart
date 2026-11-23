'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertTriangle, 
  Loader2, 
  Eye,
  EyeOff,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { DESA } from '@/lib/desa-config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'NOT_VERIFIED') {
          router.push(`/verifikasi-otp?email=${encodeURIComponent(data.email || email)}`);
          return;
        }
        throw new Error(data.error || 'Login gagal.');
      }

      router.push(data.redirectUrl || '/dashboard/masyarakat');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 neu-circle-inset flex items-center justify-center text-[var(--accent)] group-hover:scale-105 transition-transform">
            <Home className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="font-extrabold text-xl tracking-tight text-[var(--ink)]">
              Pelayanan Desa
            </h1>
            <p className="text-xs text-[var(--muted)] font-medium">Sistem Pelayanan {DESA.nama}</p>
          </div>
        </Link>
        <h2 className="mt-6 text-2xl font-black text-[var(--ink)] tracking-tight">
          Masuk ke Akun Anda
        </h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Gunakan email dan kata sandi akun Anda (warga maupun petugas desa)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="neu-raised py-8 px-6 sm:px-10 space-y-6">

          {error && (
            <div className="p-3.5 neu-inset-sm text-[var(--stat-red)] text-xs rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm neu-inset text-[var(--ink)] placeholder:text-[var(--muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus:outline-none ${
                    showPassword ? 'text-[var(--accent)]' : 'text-[var(--muted)] hover:text-[var(--accent)]'
                  }`}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={2.25} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={2.25} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neu-btn-primary w-full py-3 px-4 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-[var(--muted)]">
              Belum punya akun warga?{' '}
              <Link href="/register" className="font-bold text-[var(--accent)] hover:underline">
                Daftar Akun Baru
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
