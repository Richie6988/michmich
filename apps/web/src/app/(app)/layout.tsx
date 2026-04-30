'use client';

import React, { useEffect } from 'react';
import { Providers } from '@/components/providers';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleContextMenu = (e: MouseEvent) => {
      // Allow inputs and textareas (so users can paste)
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <Providers>
      <div className="min-h-screen bg-barry-canvas">
        {children}
      </div>
    </Providers>
  );
}
