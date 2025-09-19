'use client';

import React, { useEffect, useState } from 'react';

import { useBranding, useColors, useTerminology } from '@/components/Providers';
import { BrandingConfig, INDUSTRY_CONFIGS } from '@/lib/branding';
import { useTheme, useThemeColors } from '@/lib/useTheme';

// Lightweight runtime guard so a failed branding hook doesn't crash the page.
function useSafe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

export default function SettingsPage() {
  const branding = useSafe(() => useBranding(), {
    config: {
      industry: 'general',
      ui: { app_name: 'App', tagline: '' },
      terminology: {
        organization: 'Organization',
        team: 'Team',
        team_member: 'Member',
        appointment: 'Appointment',
        calendar: 'Calendar',
        settings: 'Settings',
      },
      features: {
        chat_enabled: false,
        chat_name: 'Chat',
        appointments_enabled: false,
        appointments_name: 'Appointments',
        resources_enabled: false,
        resources_name: 'Resources',
      },
    },
    setIndustry: () => {},
    availableIndustries: [],
    isLoading: false,
  } as any);
  const terminology = useSafe(() => useTerminology(), {
    organization: 'Organization',
    team: 'Team',
    member: 'Member',
    appointment: 'Appointment',
    calendar: 'Calendar',
    settings: 'Settings',
  } as any);
  const colors = useSafe(() => useColors(), {
    primary: '#2563eb',
    secondary: '#4b5563',
    accent: '#10b981',
    text: '#111827',
    muted: '#d1d5db',
  } as any);

  // Theme management
  const { theme, toggleTheme, isDark } = useSafe(() => useTheme(), {
    theme: 'light' as const,
    toggleTheme: () => {},
    isDark: false,
  });
  const themeColors = useSafe(() => useThemeColors(), {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    border: '#e5e7eb',
    primary: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
  });

  const { config, setIndustry, availableIndustries, isLoading } = branding;
  const [selectedIndustry, setSelectedIndustry] = useState(config.industry);
  const [errored, setErrored] = useState(false);

  // User profile state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // If fallback values are being used (no industries), mark degraded mode.
    if (!availableIndustries?.length) {
      setErrored(true);
    }
  }, [availableIndustries]);

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustry(industry);
    setIndustry(industry);
  };

  // Handle profile image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Create a preview URL
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);

      // In a real app, you would upload to a service like Firebase Storage or AWS S3
      // For now, we'll just store the preview
      setTimeout(() => setUploading(false), 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <main style={{ padding: 24, backgroundColor: themeColors.bg, minHeight: '100vh' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (errored) {
    return (
      <main
        style={{
          padding: 24,
          maxWidth: 600,
          margin: '0 auto',
          backgroundColor: themeColors.bg,
          minHeight: '100vh',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: themeColors.text }}>
          Limited Settings Available
        </h1>
        <p
          style={{ fontSize: 14, lineHeight: 1.5, color: themeColors.textMuted, marginBottom: 24 }}
        >
          Branding services are temporarily unavailable. You can continue using the application, but
          industry-specific customization and feature toggles are disabled. Please refresh the page
          or try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: themeColors.primary,
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        maxWidth: 800,
        margin: '0 auto',
        backgroundColor: themeColors.bg,
        color: themeColors.text,
        minHeight: '100vh',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: themeColors.text }}>
          {terminology.settings}
        </h1>
        <p style={{ color: themeColors.textMuted, fontSize: 16 }}>
          Customize your {config.ui.app_name} experience
        </p>
      </div>

      {/* User Profile Section */}
      <div
        style={{
          backgroundColor: themeColors.bgSecondary,
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
          User Profile
        </h2>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'start' }}
        >
          {/* Profile Picture */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: profileImage ? 'transparent' : themeColors.border,
                backgroundImage: profileImage ? `url(${profileImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${themeColors.border}`,
              }}
            >
              {!profileImage && (
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={themeColors.textMuted}
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <label
              style={{
                fontSize: 12,
                padding: '6px 12px',
                backgroundColor: themeColors.primary,
                color: 'white',
                borderRadius: 4,
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Profile Info */}
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 4,
                  color: themeColors.text,
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: themeColors.bg,
                  color: themeColors.text,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 4,
                  color: themeColors.text,
                }}
              >
                Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell others about yourself"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  backgroundColor: themeColors.bg,
                  color: themeColors.text,
                  resize: 'vertical',
                }}
              />
            </div>
            <button
              style={{
                alignSelf: 'start',
                padding: '8px 16px',
                backgroundColor: themeColors.primary,
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div
        style={{
          backgroundColor: themeColors.bgSecondary,
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
          Appearance
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: themeColors.text }}>
              Dark Mode
            </h3>
            <p style={{ fontSize: 14, color: themeColors.textMuted, margin: 0, marginTop: 4 }}>
              {isDark ? 'Dark theme is enabled' : 'Light theme is enabled'}
            </p>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              position: 'relative',
              width: 56,
              height: 28,
              backgroundColor: isDark ? themeColors.primary : themeColors.border,
              border: 'none',
              borderRadius: 14,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 2,
                left: isDark ? 30 : 2,
                width: 24,
                height: 24,
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: 'left 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDark ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1f2937"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Industry Selection */}
      <div
        style={{
          backgroundColor: themeColors.bgSecondary,
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
          Industry Configuration
        </h2>
        <p style={{ color: themeColors.textMuted, marginBottom: 20, fontSize: 14 }}>
          Select your industry to customize terminology and features for your organization.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16,
          }}
        >
          {availableIndustries.map((industry: { key: string; name: string }) => {
            const isSelected = selectedIndustry === industry.key;
            const industryConfig = INDUSTRY_CONFIGS[industry.key] as BrandingConfig;

            return (
              <div
                key={industry.key}
                onClick={() => handleIndustryChange(industry.key)}
                style={{
                  border: `2px solid ${isSelected ? colors.primary : themeColors.border}`,
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? `${colors.primary}10` : themeColors.bg,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: themeColors.text, margin: 0 }}>
                    {industry.name}
                  </h3>
                  {isSelected && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 12,
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0 }}>
                  {industryConfig.ui.tagline}
                </p>
                <div style={{ marginTop: 12, fontSize: 12 }}>
                  <strong style={{ color: themeColors.text }}>App Name:</strong>{' '}
                  <span style={{ color: themeColors.textMuted }}>{industryConfig.ui.app_name}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  <strong style={{ color: themeColors.text }}>Team Members:</strong>{' '}
                  <span style={{ color: themeColors.textMuted }}>
                    {industryConfig.terminology.team_member}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Configuration Preview */}
      <div
        style={{
          backgroundColor: themeColors.bgSecondary,
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
          Current Configuration
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {/* Terminology Preview */}
          <div>
            <h3
              style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: themeColors.text }}
            >
              Terminology
            </h3>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: themeColors.text }}>{terminology.organization}:</strong>{' '}
                <span style={{ color: themeColors.textMuted }}>Your organization</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: themeColors.text }}>{terminology.team}:</strong>{' '}
                <span style={{ color: themeColors.textMuted }}>Team or department</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: themeColors.text }}>{terminology.member}:</strong>{' '}
                <span style={{ color: themeColors.textMuted }}>Organization members</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: themeColors.text }}>{terminology.appointment}:</strong>{' '}
                <span style={{ color: themeColors.textMuted }}>Scheduled events</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: themeColors.text }}>{terminology.calendar}:</strong>{' '}
                <span style={{ color: themeColors.textMuted }}>Schedule view</span>
              </div>
            </div>
          </div>

          {/* Color Scheme Preview */}
          <div>
            <h3
              style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: themeColors.text }}
            >
              Color Scheme
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    height: 40,
                    backgroundColor: colors.primary,
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 12, color: themeColors.textMuted }}>Primary</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    height: 40,
                    backgroundColor: colors.secondary,
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 12, color: themeColors.textMuted }}>Secondary</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    height: 40,
                    backgroundColor: colors.accent,
                    borderRadius: 4,
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 12, color: themeColors.textMuted }}>Accent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Configuration */}
      <div
        style={{
          backgroundColor: themeColors.bgSecondary,
          border: `1px solid ${themeColors.border}`,
          borderRadius: 8,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
          Features
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              border: `1px solid ${config.features.chat_enabled ? colors.primary : themeColors.border}`,
              borderRadius: 6,
              backgroundColor: config.features.chat_enabled
                ? `${colors.primary}10`
                : themeColors.bg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: config.features.chat_enabled
                    ? colors.primary
                    : themeColors.textMuted,
                  marginRight: 8,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: themeColors.text }}>
                {config.features.chat_name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0 }}>
              {config.features.chat_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div
            style={{
              padding: 16,
              border: `1px solid ${config.features.appointments_enabled ? colors.primary : themeColors.border}`,
              borderRadius: 6,
              backgroundColor: config.features.appointments_enabled
                ? `${colors.primary}10`
                : themeColors.bg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: config.features.appointments_enabled
                    ? colors.primary
                    : themeColors.textMuted,
                  marginRight: 8,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: themeColors.text }}>
                {config.features.appointments_name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0 }}>
              {config.features.appointments_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div
            style={{
              padding: 16,
              border: `1px solid ${config.features.resources_enabled ? colors.primary : themeColors.border}`,
              borderRadius: 6,
              backgroundColor: config.features.resources_enabled
                ? `${colors.primary}10`
                : themeColors.bg,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: config.features.resources_enabled
                    ? colors.primary
                    : themeColors.textMuted,
                  marginRight: 8,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: themeColors.text }}>
                {config.features.resources_name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: themeColors.textMuted, margin: 0 }}>
              {config.features.resources_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
