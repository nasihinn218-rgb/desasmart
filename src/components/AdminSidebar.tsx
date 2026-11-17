'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileCheck2, 
  ShieldCheck, 
  Search, 
  ShieldAlert,
  UserCog,
  BellRing,
  Menu,
  X
} from 'lucide-react';
import { DESA } from '@/lib/desa-config';

interface AdminSidebarProps {
  role: 'STAFF' | 'SUPERADMIN' | 'KEPALA_DESA';
  counts?: {
    pendingReview?: number;
    pendingSuperadmin?: number;
    pendingHead?: number;
  };
}

export default function AdminSidebar({ role, counts }: AdminSidebarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
          label: 'Cek Verifikasi Publik',
          href: '/verify',
          icon: <Search className="w-4 h-4" />,
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
          label: 'Cek Verifikasi Publik',
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
      // KEPALA_DESA
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
          label: 'Cek Verifikasi Publik',
          href: '/verify',
          icon: <Search className="w-4 h-4" />,
        },
        {
          label: 'Audit Log Sistem',
          href: '/dashboard/audit-logs',
          icon: <ShieldAlert className="w-4 h-4" />,
        },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`flex shrink-0 flex-col gap-3 overflow-hidden bg-slate-950 p-3 text-slate-300 transition-[width] duration-150 ease-out lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto lg:p-4 ${
        menuOpen ? 'w-full lg:w-64' : 'w-full lg:w-20'
      }`}
    >
      {/* Toggle: menu disembunyikan kesamping, muncul saat garis tiga ditekan */}
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls="sidebar-nav-panel"
        aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        title={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        className={`flex cursor-pointer items-center rounded-2xl border border-white/10 bg-white/[0.04] transition-colors hover:bg-white/10 ${
          menuOpen
            ? 'w-full justify-between px-3 py-2'
            : 'w-full justify-between px-3 py-2 lg:justify-center lg:rounded-xl lg:p-2.5'
        }`}
      >
        <span
          className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${
            menuOpen ? '' : 'lg:hidden'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
          Menu Navigasi
        </span>
        {menuOpen ? (
          <X className="h-4 w-4 shrink-0 text-slate-300" />
        ) : (
          <Menu className="h-4 w-4 shrink-0 text-slate-300 lg:h-5 lg:w-5" />
        )}
      </button>

      <div
        id="sidebar-nav-panel"
        className={`grid transition-all duration-150 ease-out ${
          menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 lg:space-y-6">
        {/* Role Portal Header */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 px-4 py-3 shadow-lg shadow-black/10">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Portal Administrasi
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            {role === 'KEPALA_DESA'
              ? `Kepala ${DESA.nama}`
              : role === 'SUPERADMIN'
              ? 'Kasi Pelayanan (Superadmin)'
              : 'Staf Loket Pelayanan'}
          </p>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-wrap gap-2 pb-1 lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0">
          {menuItems.map((item) => {
            const isDashboardRoot = [
              '/dashboard/staf',
              '/dashboard/superadmin',
              '/dashboard/kades',
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
                className={`flex min-w-max items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all lg:w-full ${
                  isActive
                    ? 'bg-[var(--accent-mint)] text-slate-900 shadow-lg shadow-black/10'
                    : 'border border-white/5 bg-white/[0.04] text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-slate-900 text-white' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
