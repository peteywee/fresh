'use client';

import React from 'react';

type ProvidersProps = {
  children: React.ReactNode;
  initialIndustry?: string;
};

// Minimal stub implementations to prevent build errors
export function useBranding() {
  return {
    config: {
      industry: 'general',
      name: 'Fresh',
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        muted: '#9ca3af'
      },
      terminology: {
        organization: 'Organization',
        member: 'Member',
        team: 'Team',
        schedule: 'Schedule',
        appointment: 'Appointment',
        schedule_verb: 'schedule',
        reschedule: 'reschedule',
        cancel: 'cancel',
        admin: 'Admin',
        staff: 'Staff',
        team_member: 'Team Member',
        viewer: 'Viewer',
        dashboard: 'Dashboard',
        calendar: 'Calendar',
        settings: 'Settings',
        notifications: 'Notifications'
      },
      features: {
        chat_enabled: true,
        chat_name: 'Team Chat',
        appointments_enabled: true,
        appointments_name: 'Appointments',
        resources_enabled: true,
        resources_name: 'Resources'
      },
      ui: {
        app_name: 'Fresh',
        tagline: 'Team Management Platform'
      }
    },
    setIndustry: () => {},
    availableIndustries: ['general'],
    isLoading: false
  };
}

export function useColors() {
  return {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1f2937'
  };
}

export function useTerminology() {
  return {
    employee: 'Employee',
    employees: 'Employees',
    team: 'Team',
    teams: 'Teams',
    team_member: 'Team Member',
    shift: 'Shift',
    shifts: 'Shifts',
    schedule: 'Schedule',
    schedules: 'Schedules',
    settings: 'Settings'
  };
}

export function useFeatures() {
  return {
    scheduling: true,
    timeTracking: true,
    reporting: true,
    messaging: true,
    notifications: true,
    chat_enabled: true,
    chat_name: 'Team Chat'
  };
}

// Default export to eliminate import ambiguity
export default function Providers({ children }: ProvidersProps) {
  // Temporarily simplified - just pass through children
  // TODO: Re-add BrandingProvider after fixing the core import issue
  return <>{children}</>;
}
