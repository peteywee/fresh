import AppShell from '@/components/AppShell';
import { OfflineIndicator, PWAInstallPrompt } from '@/components/PWAComponents';
import { Providers } from '@/components/Providers';
import { getServerSession } from '@/lib/session';

import styles from './layout.module.css';

// Removed temporary SafeClientPerformanceShell guard after stabilization.

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Fresh Team Management',
  description: 'Lightning-fast team management and scheduling platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fresh',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Fresh',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': 'none',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const loggedIn = !!session?.sub;
  const onboarded = !!session?.onboardingComplete;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Fresh';

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        {/* Favicon + PWA Icons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#2563eb" />
        {/* Meta Theming */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fresh" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          margin: 0,
        }}
      >
        <OfflineIndicator />
        <Providers>
          <AppShell
            appName={appName}
            role={session?.role ?? null}
            loggedIn={loggedIn}
            navItems={
              loggedIn
                ? [
                    { href: onboarded ? '/dashboard' : '/onboarding', label: 'Home' },
                    { href: '/team', label: 'Team' },
                    { href: '/calendar', label: 'Calendar' },
                    { href: '/settings', label: 'Settings' },
                  ]
                : [
                    { href: '/dashboard', label: 'Home' },
                    { href: '/login', label: 'Login' },
                    { href: '/register', label: 'Sign up' },
                  ]
            }
          >
            {children}
          </AppShell>
        </Providers>
        <PWAInstallPrompt />
        <script src="/sw-register.js" defer />
      </body>
    </html>
  );
}
