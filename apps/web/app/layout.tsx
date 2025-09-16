import ClientPerformanceShell from '@/components/ClientPerformanceShell';
import { OfflineIndicator, PWAInstallPrompt } from '@/components/PWAComponents';
import { getServerSession } from '@/lib/session';
import { BrandingProvider } from '@/lib/useBranding';

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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
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
        <ClientPerformanceShell>
          <BrandingProvider>
            <OfflineIndicator />
            {/* Global Header / Navigation */}
            <header
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 30,
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <nav
                style={{
                  maxWidth: 1200,
                  margin: '0 auto',
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <a
                    href={loggedIn && onboarded ? '/dashboard' : '/'}
                    style={{
                      color: '#111827',
                      fontWeight: 800,
                      textDecoration: 'none',
                      fontSize: 18,
                    }}
                  >
                    {appName}
                  </a>
                  {loggedIn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <a
                        href="/dashboard"
                        style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}
                      >
                        Dashboard
                      </a>
                      {!onboarded && (
                        <a
                          href="/onboarding"
                          style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}
                        >
                          Onboarding
                        </a>
                      )}
                      <a
                        href="/team"
                        style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}
                      >
                        Team
                      </a>
                      <a
                        href="/calendar"
                        style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}
                      >
                        Calendar
                      </a>
                      <a
                        href="/settings"
                        style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}
                      >
                        Settings
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {loggedIn ? (
                    <>
                      {session?.role && (
                        <span
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: 9999,
                            padding: '4px 10px',
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {session.role}
                        </span>
                      )}
                      <a
                        href="/api/session/logout"
                        style={{
                          color: '#374151',
                          backgroundColor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          padding: '6px 12px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: 14,
                        }}
                      >
                        Sign out
                      </a>
                    </>
                  ) : (
                    <>
                      <a
                        href="/login"
                        style={{ color: '#374151', textDecoration: 'none', fontSize: 14 }}
                      >
                        Login
                      </a>
                      <a
                        href="/register"
                        style={{
                          color: 'white',
                          backgroundColor: '#2563eb',
                          padding: '6px 12px',
                          borderRadius: 8,
                          textDecoration: 'none',
                          fontSize: 14,
                        }}
                      >
                        Sign up
                      </a>
                    </>
                  )}
                </div>
              </nav>
            </header>

            <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>{children}</div>
            </div>
            <PWAInstallPrompt />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  'if("serviceWorker" in navigator && "production" === process.env.NODE_ENV){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").then(reg=>console.log("SW registered:",reg)).catch(err=>console.log("SW registration failed:",err)));}',
              }}
            />
          </BrandingProvider>
        </ClientPerformanceShell>
      </body>
    </html>
  );
}
