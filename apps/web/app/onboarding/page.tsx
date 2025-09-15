'use client';

import { useState } from 'react';

type OnboardingStep = 'welcome' | 'choice' | 'personal' | 'organization' | 'join' | 'complete';
type OrgChoice = 'create' | 'join';

interface PersonalInfo {
  displayName: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  phoneNumber: string;
  timezone: string;
}

interface OrgInfo {
  name: string;
  displayName: string;
  description: string;
  website: string;
  industry: string;
  size: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [choice, setChoice] = useState<OrgChoice>('create');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    displayName: '',
    firstName: '',
    lastName: '',
    jobTitle: '',
    department: '',
    phoneNumber: '',
    timezone: 'UTC',
  });

  const [orgInfo, setOrgInfo] = useState<OrgInfo>({
    name: '',
    displayName: '',
    description: '',
    website: '',
    industry: 'technology',
    size: '11-50',
  });

  const [inviteCode, setInviteCode] = useState('');

  async function handleComplete() {
    setBusy(true);
    setError(null);

    try {
      const endpoint = choice === 'create' ? '/api/onboarding/complete' : '/api/onboarding/join';
      const payload =
        choice === 'create'
          ? {
              type: 'create',
              user: personalInfo,
              org: orgInfo,
            }
          : {
              type: 'join',
              user: personalInfo,
              inviteCode,
            };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || response.statusText);
      }

      setStep('complete');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (e: any) {
      setError(e?.message || 'Onboarding failed');
    } finally {
      setBusy(false);
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 40, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              Welcome to Fresh! 👋
            </h1>
            <p
              style={{
                fontSize: 18,
                color: '#6b7280',
                maxWidth: 500,
                marginTop: 0,
                marginRight: 'auto',
                marginBottom: 32,
                marginLeft: 'auto',
              }}
            >
              Let's get you set up in just a few steps. This will only take a couple of minutes.
            </p>
            <button
              onClick={() => setStep('choice')}
              style={{
                padding: '16px 32px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              Get Started
            </button>
          </div>
        );

      case 'choice':
        return (
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              How would you like to get started?
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' }}>
              Choose the option that best describes your situation
            </p>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}
            >
              <div
                onClick={() => setChoice('create')}
                style={{
                  padding: 24,
                  border: choice === 'create' ? '2px solid #2563eb' : '2px solid #e5e7eb',
                  borderRadius: 16,
                  cursor: 'pointer',
                  backgroundColor: choice === 'create' ? '#eff6ff' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>🏢</div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  Create Organization
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                  Start fresh with your own organization and invite team members
                </p>
              </div>

              <div
                onClick={() => setChoice('join')}
                style={{
                  padding: 24,
                  border: choice === 'join' ? '2px solid #2563eb' : '2px solid #e5e7eb',
                  borderRadius: 16,
                  cursor: 'pointer',
                  backgroundColor: choice === 'join' ? '#eff6ff' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16, textAlign: 'center' }}>👥</div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  Join Organization
                </h3>
                <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center' }}>
                  Join an existing team using an invite code
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setStep('personal')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Tell us about yourself
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' }}>
              This information helps us personalize your experience
            </p>

            <div
              style={{
                display: 'grid',
                gap: 16,
                maxWidth: 500,
                marginTop: 0,
                marginRight: 'auto',
                marginBottom: 0,
                marginLeft: 'auto',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: 4,
                    }}
                  >
                    First Name
                  </label>
                  <input
                    value={personalInfo.firstName}
                    onChange={e => setPersonalInfo({ ...personalInfo, firstName: e.target.value })}
                    placeholder="John"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#374151',
                      marginBottom: 4,
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    value={personalInfo.lastName}
                    onChange={e => setPersonalInfo({ ...personalInfo, lastName: e.target.value })}
                    placeholder="Doe"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Display Name
                </label>
                <input
                  value={personalInfo.displayName}
                  onChange={e => setPersonalInfo({ ...personalInfo, displayName: e.target.value })}
                  placeholder="How you'd like to be called"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Job Title
                </label>
                <input
                  value={personalInfo.jobTitle}
                  onChange={e => setPersonalInfo({ ...personalInfo, jobTitle: e.target.value })}
                  placeholder="Software Engineer, Product Manager, etc."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Department (Optional)
                </label>
                <input
                  value={personalInfo.department}
                  onChange={e => setPersonalInfo({ ...personalInfo, department: e.target.value })}
                  placeholder="Engineering, Sales, Marketing, etc."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={() => setStep(choice === 'create' ? 'organization' : 'join')}
                disabled={
                  !personalInfo.displayName || !personalInfo.firstName || !personalInfo.lastName
                }
                style={{
                  padding: '12px 24px',
                  backgroundColor:
                    !personalInfo.displayName || !personalInfo.firstName || !personalInfo.lastName
                      ? '#9ca3af'
                      : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor:
                    !personalInfo.displayName || !personalInfo.firstName || !personalInfo.lastName
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 'organization':
        return (
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Create your organization
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' }}>
              Set up your team's workspace
            </p>

            <div
              style={{
                display: 'grid',
                gap: 16,
                maxWidth: 500,
                marginTop: 0,
                marginRight: 'auto',
                marginBottom: 0,
                marginLeft: 'auto',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Organization Name *
                </label>
                <input
                  value={orgInfo.name}
                  onChange={e => setOrgInfo({ ...orgInfo, name: e.target.value })}
                  placeholder="Acme Inc, ACME Corp, etc."
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Display Name (Optional)
                </label>
                <input
                  value={orgInfo.displayName}
                  onChange={e => setOrgInfo({ ...orgInfo, displayName: e.target.value })}
                  placeholder="A friendly name for your organization"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Industry
                </label>
                <select
                  value={orgInfo.industry}
                  onChange={e => setOrgInfo({ ...orgInfo, industry: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="consulting">Consulting</option>
                  <option value="non-profit">Non-Profit</option>
                  <option value="government">Government</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Organization Size
                </label>
                <select
                  value={orgInfo.size}
                  onChange={e => setOrgInfo({ ...orgInfo, size: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: 'white',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Description (Optional)
                </label>
                <textarea
                  value={orgInfo.description}
                  onChange={e => setOrgInfo({ ...orgInfo, description: e.target.value })}
                  placeholder="Brief description of your organization..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={handleComplete}
                disabled={!orgInfo.name || busy}
                style={{
                  padding: '12px 24px',
                  backgroundColor: !orgInfo.name || busy ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: !orgInfo.name || busy ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'Creating Organization...' : 'Create Organization'}
              </button>
            </div>
          </div>
        );

      case 'join':
        return (
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#111827',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Join an organization
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' }}>
              Enter your invite code to join an existing team
            </p>

            <div
              style={{
                maxWidth: 400,
                marginTop: 0,
                marginRight: 'auto',
                marginBottom: 0,
                marginLeft: 'auto',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: 4,
                  }}
                >
                  Invite Code *
                </label>
                <input
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="DEMO-123456"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '18px',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#6b7280',
                }}
              >
                <strong>Demo Invite Code:</strong> DEMO-123456
                <br />
                Use this code to join the demo organization and see how Fresh works.
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button
                onClick={handleComplete}
                disabled={!inviteCode || busy}
                style={{
                  padding: '12px 24px',
                  backgroundColor: !inviteCode || busy ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: !inviteCode || busy ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'Joining Organization...' : 'Join Organization'}
              </button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              Welcome to Fresh!
            </h2>
            <p style={{ fontSize: 18, color: '#6b7280', marginBottom: 32 }}>
              Your account has been set up successfully. <br />
              Redirecting you to the dashboard...
            </p>
            <div
              style={{
                display: 'inline-block',
                width: 32,
                height: 32,
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <style jsx>{`
              @keyframes spin {
                0% {
                  transform: rotate(0deg);
                }
                100% {
                  transform: rotate(360deg);
                }
              }
            `}</style>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <main
      style={{
        maxWidth: 800,
        marginTop: 0,
        marginRight: 'auto',
        marginBottom: 0,
        marginLeft: 'auto',
        padding: 24,
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%' }}>
        {/* Progress indicator */}
        {step !== 'welcome' && step !== 'complete' && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              {['choice', 'personal', choice === 'create' ? 'organization' : 'join'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor:
                        step === s ||
                        (step === 'organization' && s === 'organization') ||
                        (step === 'join' && s === 'join')
                          ? '#2563eb'
                          : '#e5e7eb',
                      color:
                        step === s ||
                        (step === 'organization' && s === 'organization') ||
                        (step === 'join' && s === 'join')
                          ? 'white'
                          : '#9ca3af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      style={{
                        width: 48,
                        height: 2,
                        backgroundColor: '#e5e7eb',
                        marginTop: 0,
                        marginRight: 8,
                        marginBottom: 0,
                        marginLeft: 8,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {renderStep()}

        {error && (
          <div
            style={{
              marginTop: 24,
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
