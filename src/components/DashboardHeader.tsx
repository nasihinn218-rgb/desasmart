'use client';

import React from 'react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Camera,
  X,
  Loader2,
  Save,
  Phone,
  Mail,
  Menu,
  Trash2
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


  return (
    <header className="sticky top-0 z-30 w-full neu-raised-sm !rounded-none backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-3">
        {/* Sisi Kiri: Hamburger & Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Tombol Hamburger di kiri sebelum logo */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-desasmart-drawer'))}
            aria-label="Buka menu navigasi"
            title="Buka menu navigasi"
            className="neu-raised-sm flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center text-[var(--ink)] cursor-pointer active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Brand & Village Identity */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 no-underline min-w-0">
            <div
              className="neu-raised-sm flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center font-extrabold text-base sm:text-xl text-[var(--accent)]"
              aria-hidden="true"
            >
              D
            </div>
            <div className="min-w-0">
              <span className="block font-extrabold text-sm sm:text-base tracking-tight text-[var(--ink)] leading-tight">
                DesaSmart
              </span>
              <p className="text-[10px] sm:text-[11px] text-[var(--muted)] font-medium leading-tight whitespace-nowrap">
                {DESA.nama}
              </p>
            </div>
          </Link>
        </div>

        {/* Sisi Kanan: Action Buttons seragam raised-sm */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/verify"
            className="neu-raised-sm hidden md:inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-bold text-[var(--ink)] no-underline active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
          >
            <Shield className="h-4 w-4 text-[var(--accent)]" />
            <span>Cek keaslian surat</span>
          </Link>

          {/* Notifikasi */}
          <NotificationBell />

          {/* Mode terang/gelap */}
          <ThemeToggle className="neu-raised-sm !h-9 !w-9 sm:!h-11 sm:!w-11 !min-h-[36px] !min-w-[36px] sm:!min-h-[44px] sm:!min-w-[44px] !p-0 !border-none text-[var(--ink)]" />

          {/* Profil Button */}
          <button
            type="button"
            onClick={openProfile}
            className="neu-raised-sm flex h-9 min-w-[36px] sm:h-11 sm:min-w-[44px] items-center gap-2 px-1 sm:px-3 py-1 text-left cursor-pointer active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
            aria-label="Buka pengaturan profil"
          >
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={`Foto profil ${user.name}`}
                width={32}
                height={32}
                unoptimized
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
              />
            ) : (
              <div className="neu-circle-inset-sm !h-7 !w-7 sm:!h-8 sm:!w-8 text-[11px] sm:text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-extrabold text-[var(--ink)] leading-tight">{user.name}</p>
              <span className="text-[10px] text-[var(--muted)] font-semibold">
                {user.roleDisplayName || user.role}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Modal Pengaturan Profil */}
      {profileOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-[#0a100d]/50 p-4 sm:p-6 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setProfileOpen(false);
            }}
          >
            <div className="flex min-h-full items-center justify-center py-6 sm:py-10">
              <form
                onSubmit={saveProfile}
                className="w-full max-w-md my-auto flex flex-col max-h-[calc(100vh-3rem)] sm:max-h-[calc(100vh-5rem)] neu-raised p-6 sm:p-7 overflow-hidden text-left"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-dialog-title"
              >
                <div className="shrink-0 flex items-start justify-between pb-4 border-b border-[var(--shadow-dark)]/20">
                  <div>
                    <h2 id="profile-dialog-title" className="text-lg font-black text-[var(--ink)]">
                      Pengaturan Profil
                    </h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Perbarui informasi profil akun Anda.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="neu-raised-sm flex h-11 w-11 shrink-0 items-center justify-center text-[var(--muted)] cursor-pointer active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
                    aria-label="Tutup pengaturan profil"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-y-auto py-5 space-y-4 text-[var(--ink)]">
                  <div className="flex items-center gap-4">
                    {profileAvatar ? (
                      <Image
                        src={profileAvatar}
                        alt="Pratinjau foto profil"
                        width={64}
                        height={64}
                        unoptimized
                        className="h-16 w-16 rounded-full object-cover neu-raised-sm"
                      />
                    ) : (
                      <div className="neu-circle-inset !h-16 !w-16 text-xl font-black">
                        {(profileName.trim().charAt(0) || user.name.charAt(0)).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-2">
                      <input
                        ref={avatarInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => avatarInput.current?.click()}
                          className="neu-raised-sm inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-[var(--ink)] cursor-pointer active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
                        >
                          <Camera className="h-4 w-4 text-[var(--accent)]" />
                          {profileAvatar ? 'Ganti foto' : 'Pilih foto'}
                        </button>
                        {profileAvatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setProfileAvatar('');
                              if (avatarInput.current) avatarInput.current.value = '';
                            }}
                            className="neu-raised-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
                            title="Hapus foto profil"
                          >
                            <Trash2 className="h-4 w-4" />
                            Hapus foto
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted)]">JPG, PNG, atau WebP · maksimal 5 MB</p>
                    </div>
                  </div>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[var(--ink)]">Nama tampilan</span>
                    <span className="relative block">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                      <input
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        maxLength={80}
                        required
                        className="neu-inset w-full min-h-[46px] py-2.5 pl-10 pr-3 text-sm text-[var(--ink)] outline-none"
                      />
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      Hanya mengubah nama tampilan akun, bukan nama resmi pada data pengajuan.
                    </span>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[var(--ink)]">Nomor telepon</span>
                    <span className="relative block">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(event) => setProfilePhone(event.target.value)}
                        maxLength={20}
                        placeholder="Contoh: 081234567890"
                        className="neu-inset w-full min-h-[46px] py-2.5 pl-10 pr-3 text-sm text-[var(--ink)] outline-none"
                      />
                    </span>
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-xs font-bold text-[var(--ink)]">Email</span>
                    <span className="relative block">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--muted)]" />
                      <input
                        type="email"
                        value={profileEmail}
                        onChange={(event) => setProfileEmail(event.target.value)}
                        maxLength={120}
                        required
                        placeholder="nama@email.com"
                        className="neu-inset w-full min-h-[46px] py-2.5 pl-10 pr-3 text-sm text-[var(--ink)] outline-none"
                      />
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      Email dipakai untuk login dan notifikasi — pastikan alamat aktif.
                    </span>
                  </label>

                  {profileError && (
                    <p role="alert" className="neu-inset-sm p-3 text-xs font-medium stat-val-red">
                      {profileError}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center justify-end gap-2 pt-4 border-t border-[var(--shadow-dark)]/20">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(false)}
                    className="neu-raised-sm px-4 py-2 text-xs font-bold text-[var(--muted)] cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="neu-btn-primary !min-h-[42px] !py-2 !px-5 text-xs"
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
