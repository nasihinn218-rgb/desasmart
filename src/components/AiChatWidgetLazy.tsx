'use client';

import dynamic from 'next/dynamic';

// Widget AI dimuat setelah halaman tampil (lazy) supaya akses halaman tidak lambat
// dan tanpa menunggu rendering komponen AI terlebih dahulu.
const AiChatWidget = dynamic(() => import('./AiChatWidget'), { ssr: false });

export default function AiChatWidgetLazy() {
  return <AiChatWidget />;
}
