import type { ReactNode } from 'react';
import AiChatWidgetLazy from '@/components/AiChatWidgetLazy';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <AiChatWidgetLazy />
    </>
  );
}
