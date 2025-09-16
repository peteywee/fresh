'use client';

import { useState, useEffect } from 'react';

export interface UserSession {
  isLoggedIn: boolean;
  isOnboarded: boolean;
  userId?: string;
  email?: string;
  displayName?: string;
  role?: string;
  orgId?: string;
  orgName?: string;
}

export function useSession(): UserSession {
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    isOnboarded: false,
  });

  useEffect(() => {
    // Fetch session from API endpoint instead of parsing flags cookie
    async function fetchSession() {
      try {
        const response = await fetch('/api/session/current');
        if (response.ok) {
          const sessionData = await response.json();
          setSession({
            isLoggedIn: !!sessionData.sub,
            isOnboarded: !!sessionData.onboardingComplete,
            userId: sessionData.sub,
            email: sessionData.email,
            displayName: sessionData.displayName,
            role: sessionData.role,
            orgId: sessionData.orgId,
            orgName: sessionData.orgName,
          });
        } else {
          setSession({
            isLoggedIn: false,
            isOnboarded: false,
          });
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setSession({
          isLoggedIn: false,
          isOnboarded: false,
        });
      }
    }

    fetchSession();
  }, []);

  return session;
}