'use client';

import React from 'react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  LogOut, 
  User, 
  Shield, 
  Camera,
  X,
  Loader2,
  Save,
  Phone,
  Mail
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { DESA } from '@/lib/desa-config';

interface DashboardHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    role: string;
    roleDisplayName?: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profileAvatar, setProfileAvatar] = useState(user.avatarUrl || '');
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const openProfile = () => {
    setProfileName(user.name);
    setProfilePhone(user.phone || '');
    setProfileEmail(user.email);
    setProfileAvatar(user.avatarUrl || '');
    setProfileError('');
    setProfileOpen(true);
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setProfileError('Gunakan gambar JPG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Ukuran foto maksimal 5 MB.');
      return;
    }

    try {
      const image = await createImageBitmap(file);
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Browser tidak dapat memproses gambar.');
      context.drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        320,
        320
      );
      image.close();
      const compressedImage = canvas.toDataURL('image/jpeg', 0.78);
      if (compressedImage.length > 700_000) {
        throw new Error('Foto terlalu besar setelah diproses. Pilih gambar lain.');
      }
      setProfileAvatar(compressedImage);
      setProfileError('');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Foto gagal diproses.');
    }
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          email: profileEmail,
          avatarUrl: profileAvatar || null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setProfileError(result.error || 'Profil gagal disimpan.');
        return;
      }
      setProfileOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Save profile error:', error);
      setProfileError('Tidak dapat menyimpan profil. Periksa koneksi lalu coba lagi.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'KEPALA_DESA':
        return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/60 dark:text-amber-100 dark:border-amber-600/70';
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-900/60 dark:text-purple-100 dark:border-purple-600/70';
      case 'STAFF':
        return 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-900/60 dark:text-sky-100 dark:border-sky-600/70';
      case 'MASYARAKAT':
      case 'CITIZEN':
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-800/80 dark:text-emerald-50 dark:border-emerald-500/70';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Village Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-[var(--accent-mint)] shadow-md group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  Pelayanan Desa
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  SKTM + AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Pemerintah {DESA.nama}</p>
            </div>
          </Link>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/verify"
            className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Cek Keaslian SKTM
          </Link>

          {/* Notifikasi */}
          <NotificationBell />

          {/* Mode terang/gelap */}
          <ThemeToggle />

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* User Profile Card */}
          <button
            type="button"
            onClick={openProfile}
            className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 focus-visible:outline-2 focus-visible:outline-emerald-600"
            aria-label="Buka pengaturan profil"
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={`Foto profil ${user.name}`}
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-[var(--accent-mint)] text-xs font-bold text-slate-900">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
              <span
                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border mt-0.5 shadow-xs whitespace-nowrap ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.roleDisplayName || user.role}
              </span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Keluar dari Akun"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {profileOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 sm:p-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setProfileOpen(false);
            }}
          >
            <div className="flex min-h-full items-center justify-center py-6 sm:py-10">
              <form
                onSubmit={saveProfile}
                className="w-full max-w-md my-auto flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5rem)] rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden text-left"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-dialog-title"
              >
            <div className="shrink-0 flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900">
              <div>
                <h2 id="profile-dialog-title" className="text-lg font-black text-slate-900 dark:text-white">
                  Pengaturan Profil
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Perbarui informasi profil akun Anda.</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                aria-label="Tutup pengaturan profil"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-4 text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-4">
                {profileAvatar ? (
                  <Image
                    src={profileAvatar}
                    alt="Pratinjau foto profil"
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-xl font-black text-emerald-700 dark:text-emerald-300">
                    {(profileName.trim().charAt(0) || user.name.charAt(0)).toUpperCase()}
                  </div>
                )}
                <div>
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInput.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Camera className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Pilih foto
                  </button>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">JPG, PNG, atau WebP · maksimal 5 MB</p>
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama tampilan</span>
                <span className="relative block">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    maxLength={80}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40"
                  />
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Hanya mengubah nama tampilan akun, bukan nama resmi pada data pengajuan.
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomor telepon</span>
                <span className="relative block">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(event) => setProfilePhone(event.target.value)}
                    maxLength={20}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40"
                  />
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</span>
                <span className="relative block">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    maxLength={120}
                    required
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40"
                  />
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  Email dipakai untuk login dan notifikasi — pastikan alamat aktif.
                </span>
              </label>

              {profileError && (
                <p role="alert" className="rounded-xl bg-rose-50 dark:bg-rose-950/60 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                  {profileError}
                </p>
              )}
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 px-6 py-3.5">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan profil
              </button>
            </div>
          </form>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
