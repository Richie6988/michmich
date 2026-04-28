'use client';

import { Providers } from '@/components/providers';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-barry-canvas">
        {children}
      </div>
    </Providers>
  );
}
