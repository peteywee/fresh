// Temporarily commented PWA widgets while debugging
// import { OfflineIndicator, PWAInstallPrompt } from '@/components/PWAComponents';
// import { getServerSession } from '@/lib/session';
import Providers from '@/components/Providers.client-wrapper';

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

        <nav style={{ padding: '1rem', background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
          <a
            href="/login"
            style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
          >
            Fresh
          </a>
          <a href="/login" style={{ float: 'right', color: '#2563eb' }}>
            Login
          </a>
        </nav>

        <main style={{ padding: '2rem' }}>
          <Providers>{children}</Providers>
        </main>

        {/* Temporarily commented PWA widgets
        <PWAInstallPrompt />
        */}
      </body>
    </html>
  );
}
