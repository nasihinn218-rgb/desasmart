'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'desasmart-theme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  // null = belum terbaca dari DOM (hindari mismatch hydration)
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !(isDark ?? false);
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch {
      /* abaikan bila penyimpanan tidak tersedia */
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-300 text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 ${className}`}
    >
      {isDark === null ? (
        <span className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4 text-amber-500" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
