import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { DESA } from '@/lib/desa-config';

export const metadata: Metadata = {
  title: `Sistem Pelayanan Desa | ${DESA.nama}`,
  description:
    'Layanan digital permohonan Surat Keterangan Tidak Mampu (SKTM) online dengan pemantauan status, validasi kelengkapan dokumen, dan persetujuan berjenjang perangkat desa.',
};

// Terapkan tema tersimpan/preferensi sistem sebelum render pertama agar tidak berkedip
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('desasmart-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Script id="theme-init" strategy="beforeInteractive">{themeInitScript}</Script>
        {children}
      </body>
    </html>
  );
}
