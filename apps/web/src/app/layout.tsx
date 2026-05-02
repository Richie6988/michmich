import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, JetBrains_Mono } from 'next/font/google';

import '@/styles/globals.css';
import { ThemeManager } from '@/components/theme/theme-manager';
import { ToastProvider } from '@/components/ui/toast';
import { DialogProvider } from '@/components/ui/dialog';
import { CookieConsentBanner } from '@/components/legal/cookie-consent-banner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Barry. Where the smart group meets.',
  description:
    'The map app that finds the fairest meeting point for any group. No more endless debates. No more unfair commutes. Barry knows where.',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Allow user-zoom up to 5x for accessibility (WCAG 2.1 SC 1.4.4)
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#2563EB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased bg-white dark:bg-slate-950 dark:text-slate-100 transition-colors">
        <ThemeManager />
        <DialogProvider>
          <ToastProvider>
            {children}
            <CookieConsentBanner />
          </ToastProvider>
        </DialogProvider>
      </body>
    </html>
  );
}
