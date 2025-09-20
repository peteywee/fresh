// Temporarily commented PWA widgets while debugging
// import { OfflineIndicator, PWAInstallPrompt } from '@/components/PWAComponents';
// import { getServerSession } from '@/lib/session';
import Providers from '@/components/Providers';
import AppShell from '@/components/AppShell';

// import styles from './layout.module.css';

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Fresh Team Management',
  description: 'Lightning-fast team management and scheduling platform',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Temporarily simplified - comment out session and PWA widgets
  // const session = await getServerSession();
  // const loggedIn = !!session?.sub;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Fresh';

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body style={{ fontFamily: 'system-ui', margin: 0 }}>
        {/* Temporarily commented PWA widgets
        <OfflineIndicator />
        */}
        <Providers>
          <AppShell
            appName={appName}
            role={null}
            loggedIn={false}
            navItems={[
              { href: '/dashboard', label: 'Home' },
              { href: '/login', label: 'Login' },
              { href: '/register', label: 'Sign up' },
            ]}
          >
            {children}
          </AppShell>
        </Providers>
        {/* PWAInstallPrompt temporarily disabled */}
      </body>
    </html>
  );
}
