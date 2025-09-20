'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './AppShell.module.css';

type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

interface AppShellProps {
  appName: string;
  role?: string | null;
  loggedIn?: boolean;
  navItems?: NavItem[];
  children: React.ReactNode;
}

export function AppShell({
  appName,
  role,
  loggedIn = false,
  navItems = [],
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const NavLinks = () => (
    <div className={styles.navList}>
      {navItems.map(item => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            onClick={() => setOpen(false)}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.mobileBar}>
            <button className={styles.menuBtn} aria-label="Open Menu" onClick={() => setOpen(true)}>
              ☰
            </button>
          </div>
          <div className={styles.brand}>
            <Link href="/dashboard" className={styles.logoLink}>
              {appName}
            </Link>
            {role ? <span className={styles.roleBadge}>{role}</span> : null}
          </div>
          <div className={styles.actions}>
            {loggedIn ? (
              <>
                <Link href="/settings" className={styles.ghostBtn}>
                  Settings
                </Link>
                <a href="/api/session/logout" className={styles.ghostBtn}>
                  Sign out
                </a>
              </>
            ) : (
              <>
                <Link href="/login" className={styles.ghostBtn}>
                  Login
                </Link>
                <Link href="/register" className={styles.primaryBtn}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {open ? (
        <div
          className={styles.mobileDrawer}
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
            <NavLinks />
          </div>
        </div>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarInner}>
            <NavLinks />
          </div>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

export default AppShell;
