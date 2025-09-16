// Industry-specific branding and terminology configuration

export interface BrandingConfig {
  industry: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  terminology: {
    // Core entities
    organization: string;
    member: string;
    team: string;
    schedule: string;
    appointment: string;
    
    // Actions
    schedule_verb: string; // "schedule", "book", "reserve"
    reschedule: string;
    cancel: string;
    
    // Roles
    admin: string;
    staff: string;
    team_member: string; // Changed from 'member' to avoid conflict
    viewer: string;
    
    // Common terms
    dashboard: string;
    calendar: string;
    settings: string;
    notifications: string;
  };
  features: {
    // Feature-specific terms
    chat_enabled: boolean;
    chat_name: string; // "Team Chat", "Communication Hub", "Messages"
    
    appointments_enabled: boolean;
    appointments_name: string; // "Appointments", "Sessions", "Bookings"
    
    resources_enabled: boolean;
    resources_name: string; // "Resources", "Equipment", "Facilities"
  };
  ui: {
    // UI customizations
    logo_url?: string;
    favicon_url?: string;
    app_name: string;
    tagline?: string;
    
    // Layout preferences
    sidebar_style: 'minimal' | 'detailed' | 'icon-only';
    density: 'compact' | 'comfortable' | 'spacious';
  };
}

// Predefined industry configurations
export const INDUSTRY_CONFIGS: Record<string, BrandingConfig> = {
  healthcare: {
    industry: 'healthcare',
    name: 'Healthcare',
    colors: {
      primary: '#2563eb', // Medical blue
      secondary: '#10b981', // Health green
      accent: '#f59e0b', // Warning amber
      background: '#f8fafc',
      text: '#1e293b',
      muted: '#64748b',
    },
    terminology: {
      organization: 'Practice',
      member: 'Patient',
      team: 'Care Team',
      schedule: 'Schedule',
      appointment: 'Appointment',
      schedule_verb: 'Schedule',
      reschedule: 'Reschedule',
      cancel: 'Cancel',
      admin: 'Administrator',
      staff: 'Staff',
      team_member: 'Provider',
      viewer: 'Viewer',
      dashboard: 'Dashboard',
      calendar: 'Schedule',
      settings: 'Settings',
      notifications: 'Alerts',
    },
    features: {
      chat_enabled: true,
      chat_name: 'Team Communication',
      appointments_enabled: true,
      appointments_name: 'Appointments',
      resources_enabled: true,
      resources_name: 'Medical Equipment',
    },
    ui: {
      app_name: 'MedSchedule',
      tagline: 'Healthcare scheduling made simple',
      sidebar_style: 'detailed',
      density: 'comfortable',
    },
  },

  education: {
    industry: 'education',
    name: 'Education',
    colors: {
      primary: '#7c3aed', // Academic purple
      secondary: '#059669', // Learning green
      accent: '#dc2626', // Important red
      background: '#fefffe',
      text: '#111827',
      muted: '#6b7280',
    },
    terminology: {
      organization: 'Institution',
      member: 'Student',
      team: 'Faculty',
      schedule: 'Timetable',
      appointment: 'Session',
      schedule_verb: 'Schedule',
      reschedule: 'Reschedule',
      cancel: 'Cancel',
      admin: 'Administrator',
      staff: 'Faculty',
      team_member: 'Instructor',
      viewer: 'Observer',
      dashboard: 'Dashboard',
      calendar: 'Academic Calendar',
      settings: 'Preferences',
      notifications: 'Announcements',
    },
    features: {
      chat_enabled: true,
      chat_name: 'Faculty Discussion',
      appointments_enabled: true,
      appointments_name: 'Class Sessions',
      resources_enabled: true,
      resources_name: 'Classroom Resources',
    },
    ui: {
      app_name: 'EduSchedule',
      tagline: 'Academic scheduling platform',
      sidebar_style: 'detailed',
      density: 'comfortable',
    },
  },

  corporate: {
    industry: 'corporate',
    name: 'Corporate',
    colors: {
      primary: '#1f2937', // Professional dark
      secondary: '#3b82f6', // Business blue
      accent: '#f59e0b', // Highlight gold
      background: '#ffffff',
      text: '#111827',
      muted: '#6b7280',
    },
    terminology: {
      organization: 'Company',
      member: 'Employee',
      team: 'Team',
      schedule: 'Schedule',
      appointment: 'Meeting',
      schedule_verb: 'Book',
      reschedule: 'Reschedule',
      cancel: 'Cancel',
      admin: 'Admin',
      staff: 'Staff',
      team_member: 'Member',
      viewer: 'Viewer',
      dashboard: 'Dashboard',
      calendar: 'Calendar',
      settings: 'Settings',
      notifications: 'Notifications',
    },
    features: {
      chat_enabled: true,
      chat_name: 'Team Chat',
      appointments_enabled: true,
      appointments_name: 'Meetings',
      resources_enabled: true,
      resources_name: 'Resources',
    },
    ui: {
      app_name: 'Fresh',
      tagline: 'Team scheduling platform',
      sidebar_style: 'minimal',
      density: 'compact',
    },
  },

  hospitality: {
    industry: 'hospitality',
    name: 'Hospitality',
    colors: {
      primary: '#dc2626', // Hospitality red
      secondary: '#f59e0b', // Gold accent
      accent: '#059669', // Service green
      background: '#fffbeb',
      text: '#1c1917',
      muted: '#78716c',
    },
    terminology: {
      organization: 'Venue',
      member: 'Guest',
      team: 'Staff',
      schedule: 'Schedule',
      appointment: 'Reservation',
      schedule_verb: 'Reserve',
      reschedule: 'Modify',
      cancel: 'Cancel',
      admin: 'Manager',
      staff: 'Staff',
      team_member: 'Team Member',
      viewer: 'Observer',
      dashboard: 'Dashboard',
      calendar: 'Booking Calendar',
      settings: 'Settings',
      notifications: 'Updates',
    },
    features: {
      chat_enabled: true,
      chat_name: 'Staff Communication',
      appointments_enabled: true,
      appointments_name: 'Reservations',
      resources_enabled: true,
      resources_name: 'Facilities',
    },
    ui: {
      app_name: 'VenueBook',
      tagline: 'Hospitality booking system',
      sidebar_style: 'detailed',
      density: 'spacious',
    },
  },

  fitness: {
    industry: 'fitness',
    name: 'Fitness & Wellness',
    colors: {
      primary: '#059669', // Fitness green
      secondary: '#dc2626', // Energy red
      accent: '#f59e0b', // Motivation orange
      background: '#f0fdf4',
      text: '#14532d',
      muted: '#6b7280',
    },
    terminology: {
      organization: 'Gym',
      member: 'Member',
      team: 'Trainers',
      schedule: 'Schedule',
      appointment: 'Session',
      schedule_verb: 'Book',
      reschedule: 'Reschedule',
      cancel: 'Cancel',
      admin: 'Manager',
      staff: 'Trainer',
      team_member: 'Instructor',
      viewer: 'Observer',
      dashboard: 'Dashboard',
      calendar: 'Class Schedule',
      settings: 'Settings',
      notifications: 'Updates',
    },
    features: {
      chat_enabled: true,
      chat_name: 'Trainer Chat',
      appointments_enabled: true,
      appointments_name: 'Training Sessions',
      resources_enabled: true,
      resources_name: 'Equipment',
    },
    ui: {
      app_name: 'FitSchedule',
      tagline: 'Fitness scheduling platform',
      sidebar_style: 'minimal',
      density: 'comfortable',
    },
  },

  consulting: {
    industry: 'consulting',
    name: 'Professional Services',
    colors: {
      primary: '#1e40af', // Professional blue
      secondary: '#7c3aed', // Expertise purple
      accent: '#059669', // Success green
      background: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
    },
    terminology: {
      organization: 'Firm',
      member: 'Client',
      team: 'Consultants',
      schedule: 'Schedule',
      appointment: 'Consultation',
      schedule_verb: 'Schedule',
      reschedule: 'Reschedule',
      cancel: 'Cancel',
      admin: 'Partner',
      staff: 'Consultant',
      team_member: 'Associate',
      viewer: 'Observer',
      dashboard: 'Dashboard',
      calendar: 'Schedule',
      settings: 'Preferences',
      notifications: 'Updates',
    },
    features: {
      chat_enabled: true,
      chat_name: 'Team Discussion',
      appointments_enabled: true,
      appointments_name: 'Consultations',
      resources_enabled: true,
      resources_name: 'Resources',
    },
    ui: {
      app_name: 'ConsultSchedule',
      tagline: 'Professional scheduling platform',
      sidebar_style: 'detailed',
      density: 'comfortable',
    },
  },
};

// Default fallback configuration
export const DEFAULT_CONFIG: BrandingConfig = INDUSTRY_CONFIGS.corporate;

// Helper function to get configuration by industry
export function getBrandingConfig(industry?: string): BrandingConfig {
  if (!industry || !INDUSTRY_CONFIGS[industry]) {
    return DEFAULT_CONFIG;
  }
  return INDUSTRY_CONFIGS[industry];
}

// Helper function to get available industries
export function getAvailableIndustries(): Array<{ key: string; name: string }> {
  return Object.entries(INDUSTRY_CONFIGS).map(([key, config]) => ({
    key,
    name: config.name,
  }));
}