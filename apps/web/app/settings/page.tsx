'use client';

import React, { useEffect, useState } from 'react';

import { BrandingConfig, INDUSTRY_CONFIGS } from '@/lib/branding';
import { useBranding, useColors, useTerminology } from '@/lib/useBranding';

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

  const { config, setIndustry, availableIndustries, isLoading } = branding;
  const [selectedIndustry, setSelectedIndustry] = useState(config.industry);
  const [errored, setErrored] = useState(false);

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

  if (isLoading) {
    return (
      <main style={{ padding: 24 }}>
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
      <main style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Limited Settings Available
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: '#374151', marginBottom: 24 }}>
          Branding services are temporarily unavailable. You can continue using the application, but
          industry-specific customization and feature toggles are disabled. Please refresh the page
          or try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: colors.primary,
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
    <main style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: colors.text }}>
          {terminology.settings}
        </h1>
        <p style={{ color: colors.muted, fontSize: 16 }}>
          Customize your {config.ui.app_name} experience
        </p>
      </div>

      {/* Industry Selection */}
      <div
        style={{
          backgroundColor: 'white',
          border: `1px solid ${colors.muted}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: colors.text }}>
          Industry Configuration
        </h2>
        <p style={{ color: colors.muted, marginBottom: 20, fontSize: 14 }}>
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
                  border: `2px solid ${isSelected ? colors.primary : colors.muted}`,
                  borderRadius: 8,
                  padding: 16,
                  cursor: 'pointer',
                  backgroundColor: isSelected ? `${colors.primary}10` : 'white',
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
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>
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
                <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>
                  {industryConfig.ui.tagline}
                </p>
                <div style={{ marginTop: 12, fontSize: 12 }}>
                  <strong style={{ color: colors.text }}>App Name:</strong>{' '}
                  <span style={{ color: colors.muted }}>{industryConfig.ui.app_name}</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  <strong style={{ color: colors.text }}>Team Members:</strong>{' '}
                  <span style={{ color: colors.muted }}>
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
          backgroundColor: 'white',
          border: `1px solid ${colors.muted}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: colors.text }}>
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
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: colors.text }}>
              Terminology
            </h3>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: colors.text }}>{terminology.organization}:</strong>{' '}
                <span style={{ color: colors.muted }}>Your organization</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: colors.text }}>{terminology.team}:</strong>{' '}
                <span style={{ color: colors.muted }}>Team or department</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: colors.text }}>{terminology.member}:</strong>{' '}
                <span style={{ color: colors.muted }}>Organization members</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: colors.text }}>{terminology.appointment}:</strong>{' '}
                <span style={{ color: colors.muted }}>Scheduled events</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong style={{ color: colors.text }}>{terminology.calendar}:</strong>{' '}
                <span style={{ color: colors.muted }}>Schedule view</span>
              </div>
            </div>
          </div>

          {/* Color Scheme Preview */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: colors.text }}>
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
                <div style={{ fontSize: 12, color: colors.muted }}>Primary</div>
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
                <div style={{ fontSize: 12, color: colors.muted }}>Secondary</div>
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
                <div style={{ fontSize: 12, color: colors.muted }}>Accent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Configuration */}
      <div
        style={{
          backgroundColor: 'white',
          border: `1px solid ${colors.muted}`,
          borderRadius: 8,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: colors.text }}>
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
              border: `1px solid ${config.features.chat_enabled ? colors.primary : colors.muted}`,
              borderRadius: 6,
              backgroundColor: config.features.chat_enabled ? `${colors.primary}10` : '#f9f9f9',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: config.features.chat_enabled ? colors.primary : colors.muted,
                  marginRight: 8,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                {config.features.chat_name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>
              {config.features.chat_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div
            style={{
              padding: 16,
              border: `1px solid ${config.features.appointments_enabled ? colors.primary : colors.muted}`,
              borderRadius: 6,
              backgroundColor: config.features.appointments_enabled
                ? `${colors.primary}10`
                : '#f9f9f9',
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
                    : colors.muted,
                  marginRight: 8,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                {config.features.appointments_name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>
              {config.features.appointments_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div
            style={{
              padding: 16,
              border: `1px solid ${config.features.resources_enabled ? colors.primary : colors.muted}`,
              borderRadius: 6,
              backgroundColor: config.features.resources_enabled
                ? `${colors.primary}10`
                : '#f9f9f9',
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
                    : colors.muted,
                  marginRight: 8,
                }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                {config.features.resources_name}
              </span>
            </div>
            <p style={{ fontSize: 12, color: colors.muted, margin: 0 }}>
              {config.features.resources_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
