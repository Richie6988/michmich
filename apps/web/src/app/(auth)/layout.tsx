'use client';

import { Providers } from '@/components/providers';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-barry-canvas flex flex-col items-center justify-center px-4">
        {children}
      </div>
    </Providers>
  );
}
