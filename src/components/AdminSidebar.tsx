'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileCheck2, 
  ShieldCheck, 
  Search, 
  ShieldAlert,
  UserCog,
  BellRing,
  X,
  Home,
  LogOut,
  Sparkles
} from 'lucide-react';
import { DESA } from '@/lib/desa-config';

interface AdminSidebarProps {
  role: 'STAFF' | 'SUPERADMIN' | 'KEPALA_DESA' | 'MASYARAKAT';
  counts?: {
    pendingReview?: number;
    pendingSuperadmin?: number;
    pendingHead?: number;
  };
}

export default function AdminSidebar({ role, counts }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const handleToggle = () => setMenuOpen((prev) => !prev);
    const handleClose = () => setMenuOpen(false);

    window.addEventListener('toggle-desasmart-drawer', handleToggle);
    window.addEventListener('close-desasmart-drawer', handleClose);

    return () => {
      window.removeEventListener('toggle-desasmart-drawer', handleToggle);
      window.removeEventListener('close-desasmart-drawer', handleClose);
    };
  }, []);

  const getMenuItems = () => {
    if (role === 'STAFF') {
      return [
        {
          label: 'Dashboard & Antrean Staf',
          href: '/dashboard/staf',
          icon: <LayoutDashboard className="w-4 h-4" />,
          badge: counts?.pendingReview,
        },
        {
          label: 'Notifikasi Proses',
          href: '/dashboard/notifikasi-proses',
          icon: <BellRing className="w-4 h-4" />,
        },
        {
          label: 'Cek Keaslian Surat',
          href: '/verify',
          icon: <Search className="w-4 h-4" />,
        },
        {
          label: 'Pengaturan AI',
          href: '/dashboard/staf#pengaturan-ai',
          icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
        },
        {
          label: 'Audit Log Sistem',
          href: '/dashboard/audit-logs',
          icon: <ShieldAlert className="w-4 h-4" />,
        },
      ];
    } else if (role === 'SUPERADMIN') {
      return [
        {
          label: 'Dashboard Verifikasi',
          href: '/dashboard/superadmin',
          icon: <FileCheck2 className="w-4 h-4" />,
          badge: counts?.pendingSuperadmin,
        },
        {
          label: 'Manajemen Admin',
          href: '/dashboard/superadmin/users',
          icon: <UserCog className="w-4 h-4" />,
        },
        {
          label: 'Pengaturan AI',
          href: '/dashboard/superadmin#pengaturan-ai',
          icon: <Sparkles className="w-4 h-4 text-violet-500" />,
        },
        {
          label: 'Notifikasi Proses',
          href: '/dashboard/notifikasi-proses',
          icon: <BellRing className="w-4 h-4" />,
        },
        {
          label: 'Pengumuman Warga',
          href: '/dashboard/superadmin/notifications',
          icon: <BellRing className="w-4 h-4" />,
        },
        {
          label: 'Cek Keaslian Surat',
          href: '/verify',
          icon: <Search className="w-4 h-4" />,
        },
        {
          label: 'Audit Log Sistem',
          href: '/dashboard/audit-logs',
          icon: <ShieldAlert className="w-4 h-4" />,
        },
      ];
    } else if (role === 'KEPALA_DESA') {
      return [
        {
          label: 'Dashboard & Persetujuan',
          href: '/dashboard/kades',
          icon: <ShieldCheck className="w-4 h-4" />,
          badge: counts?.pendingHead,
        },
        {
          label: 'Notifikasi Proses',
          href: '/dashboard/notifikasi-proses',
          icon: <BellRing className="w-4 h-4" />,
        },
        {
          label: 'Cek Keaslian Surat',
          href: '/verify',
          icon: <Search className="w-4 h-4" />,
        },
        {
          label: 'Audit Log Sistem',
          href: '/dashboard/audit-logs',
          icon: <ShieldAlert className="w-4 h-4" />,
        },
      ];
    } else {
      return [
        {
          label: 'Dashboard Warga',
          href: '/dashboard/masyarakat',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          label: 'Ajukan SKTM Baru',
          href: '/dashboard/masyarakat/new',
          icon: <FileCheck2 className="w-4 h-4" />,
        },
        {
          label: 'Cek Keaslian Surat',
          href: '/verify',
          icon: <Search className="w-4 h-4" />,
        },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Scrim Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#0a100d]/50 backdrop-blur-xs transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Kiri (Semua Ukuran Layar: Fixed, min(320px, 86vw), Latar --bg, Animasi translateX) */}
      <aside
        id="sidebar-nav-panel"
        aria-label="Menu navigasi utama"
        className={`fixed top-0 left-0 bottom-0 z-50 flex w-[min(320px,86vw)] flex-col justify-between overflow-y-auto p-5 neu-drawer transition-transform duration-400 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5">
          {/* Header Drawer */}
          <div className="flex items-center justify-between pb-2">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 no-underline"
            >
              <div
                className="neu-raised-sm flex h-11 w-11 shrink-0 items-center justify-center font-extrabold text-lg text-[var(--accent)]"
                aria-hidden="true"
              >
                D
              </div>
              <div>
                <b className="block text-sm font-extrabold leading-tight text-[var(--ink)]">
                  DesaSmart
                </b>
                <span className="block text-[11px] text-[var(--muted)]">
                  {DESA.nama}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Tutup menu navigasi"
              className="neu-raised-sm flex h-11 w-11 items-center justify-center text-[var(--ink)] cursor-pointer active:shadow-[inset_3px_3px_6px_var(--shadow-dark),inset_-3px_-3px_6px_var(--shadow-light)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Kartu Peran: Inset */}
          <div className="neu-inset p-4 rounded-[18px]">
            <p className="text-[11px] font-bold tracking-wider text-[var(--muted)]">
              Portal Administrasi
            </p>
            <p className="mt-1 text-sm font-extrabold text-[var(--ink)]">
              {role === 'KEPALA_DESA'
                ? `Kepala ${DESA.nama}`
                : role === 'SUPERADMIN'
                ? 'Kasi Pelayanan (Superadmin)'
                : role === 'STAFF'
                ? 'Staf Loket Pelayanan'
                : 'Masyarakat Desa'}
            </p>
          </div>

          {/* Nav Items */}
          <nav className="flex flex-col space-y-2.5">
            {menuItems.map((item) => {
              const isDashboardRoot = [
                '/dashboard/staf',
                '/dashboard/superadmin',
                '/dashboard/kades',
                '/dashboard/masyarakat',
              ].includes(item.href);
              const isActive =
                pathname === item.href ||
                (isDashboardRoot
                  ? pathname.startsWith(`${item.href}/applications/`)
                  : pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`neu-drawer-item ${isActive ? 'neu-drawer-item-active' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="neu-status-badge stat-val-blue text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout di dalam drawer */}
        <div className="pt-4 border-t border-[var(--shadow-dark)]/20 space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="neu-drawer-item w-full !text-rose-600 hover:!text-rose-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
                <LogOut className="w-4 h-4" />
              </span>
              <span className="font-bold text-sm">
                {loggingOut ? 'Sedang keluar...' : 'Keluar dari Akun'}
              </span>
            </div>
          </button>

          <div className="text-center text-[11px] text-[var(--muted)]">
            &copy; {new Date().getFullYear()} Pemerintah {DESA.nama}
          </div>
        </div>
      </aside>
    </>
  );
}
