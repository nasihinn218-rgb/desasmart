'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  TimerReset,
  Mail,
  MessageSquareText,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { DESA } from '@/lib/desa-config';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(60);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeInputRef.current?.focus();
    const timer = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Email akun belum diisi.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('Kode OTP harus 6 digit angka.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyVerified) {
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Verifikasi gagal.');
      }

      router.push(data.redirectUrl || '/dashboard/masyarakat');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (!email.trim()) {
      setError('Email akun belum diisi.');
      return;
    }
    setResending(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.alreadyVerified) {
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Kode gagal dikirim ulang.');
      }
      setNotice(data.message || 'Kode OTP baru telah dikirim.');
      setCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim ulang kode.');
    } finally {
      setResending(false);
    }
  }, [email, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
            <Home className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="font-extrabold text-xl tracking-tight text-slate-900">
              Pelayanan Desa
            </h1>
            <p className="text-xs text-slate-500 font-medium">Verifikasi Akun Warga {DESA.nama}</p>
          </div>
        </Link>
        <h2 className="mt-6 text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
          Verifikasi Akun Anda
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Masukkan kode OTP 6 digit yang dikirim ke WhatsApp dan Email pendaftaran
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {notice && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            {!initialEmail && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Akun</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@anda.com"
                  required
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kode OTP (6 digit)</label>
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className="w-full py-3.5 px-4 text-center text-2xl sm:text-3xl font-black tracking-[0.5em] indent-[0.5em] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
              <p className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Cek pesan &quot;Kode verifikasi akun DesaSmart&quot; di WhatsApp / Email Anda.
              </p>
              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                <TimerReset className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Kode berlaku 10 menit sejak dikirim.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verifikasi & Masuk
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-5 border-t border-slate-100 mt-6 space-y-2">
            <p className="text-xs text-slate-500">Tidak menerima kode?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Mengirim ulang...
                </>
              ) : cooldown > 0 ? (
                `Kirim ulang kode dalam ${cooldown}s`
              ) : (
                'Kirim ulang kode OTP'
              )}
            </button>
            <p className="text-[11px] text-slate-400 pt-1">
              <Link href="/login" className="font-bold text-slate-600 hover:text-emerald-600">
                Kembali ke halaman login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
