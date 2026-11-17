'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface RowActionMenuProps {
  label?: string;
  menuWidth?: number;
  triggerClassName?: string;
  children: (close: () => void) => React.ReactNode;
}

/**
 * Dropdown aksi berbasis portal (dirender ke document.body) sehingga tidak
 * terpotong oleh kontainer overflow tabel. Menu otomatis membuka ke atas bila
 * ruang di bawah kurang (mentok dasar layar).
 */
export default function RowActionMenu({
  label = 'Aksi',
  menuWidth = 176,
  triggerClassName,
  children,
}: RowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const close = () => setOpen(false);

  const reposition = () => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menu.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 12 && rect.top > spaceBelow;
    const top = openUp
      ? Math.max(8, rect.top - menuHeight - 6)
      : rect.bottom + 6;
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) reposition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => reposition();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={
          triggerClassName ||
          'inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100'
        }
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60] cursor-default" onClick={close} />
          {createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: 'fixed',
                top: pos?.top ?? -9999,
                left: pos?.left ?? -9999,
                width: menuWidth,
              }}
              className="z-[70] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl shadow-slate-900/10"
            >
              {children(close)}
            </div>,
            document.body
          )}
        </>
      )}
    </>
  );
}
