"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type OnboardingStep = "welcome" | "create-org" | "join-org";
type CreateOrgStep = "personal" | "organization" | "preferences" | "review";
type JoinOrgStep = "personal" | "invitation" | "profile" | "review";

export const dynamic = "force-dynamic";

interface PersonalInfo {
  displayName: string;
  title: string;
  department: string;
  phone: string;
  bio: string;
}

interface OrganizationInfo {
  name: string;
  industry: string;
  size: string;
  description: string;
  website: string;
}

interface PreferencesInfo {
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    mentions: boolean;
  };
  startTime: string;
  endTime: string;
}

interface JoinInfo {
  inviteCode: string;
  expectedRole: string;
  referrer: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  
  // Form data states
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    displayName: "",
    title: "",
    department: "",
    phone: "",
    bio: "",
  });
  
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo>({
    name: "",
    industry: "",
    size: "",
    description: "",
    website: "",
  });
  
  const [preferences, setPreferences] = useState<PreferencesInfo>({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      email: true,
      push: true,
      mentions: true,
    },
    startTime: "09:00",
    endTime: "17:00",
  });
  
  const [joinInfo, setJoinInfo] = useState<JoinInfo>({
    inviteCode: "",
    expectedRole: "",
    referrer: "",
  });

  useEffect(() => {
    // Check authentication status
    fetch("/api/session/current")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedIn) {
          router.push("/login");
        } else if (data.user.onboardingComplete) {
          router.push("/dashboard");
        } else {
          setUser(data.user);
          // Pre-fill display name if available
          if (data.user.displayName) {
            setPersonalInfo(prev => ({ ...prev, displayName: data.user.displayName }));
          }
          // Check if there's a specific step in URL params
          const urlStep = searchParams.get("step") as OnboardingStep;
          if (urlStep && ["welcome", "create-org", "join-org"].includes(urlStep)) {
            setStep(urlStep);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
        setLoading(false);
      });
  }, [router, searchParams]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h1>Loading...</h1>
        <p>Setting up your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <div style={{ padding: 24 }}>Redirecting to login...</div>;
  }

  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      {step === "welcome" && <WelcomeStep user={user} onNext={setStep} />}
      {step === "create-org" && (
        <CreateOrgFlow
          user={user}
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
          orgInfo={orgInfo}
          setOrgInfo={setOrgInfo}
          preferences={preferences}
          setPreferences={setPreferences}
          router={router}
        />
      )}
      {step === "join-org" && (
        <JoinOrgFlow
          user={user}
          personalInfo={personalInfo}
          setPersonalInfo={setPersonalInfo}
          joinInfo={joinInfo}
          setJoinInfo={setJoinInfo}
          router={router}
        />
      )}
    </main>
  );
}

function WelcomeStep({ user, onNext }: { user: any; onNext: (step: OnboardingStep) => void }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Welcome to Fresh! 👋</h1>
      <p style={{ fontSize: "1.1em", marginBottom: "2rem" }}>
        Hi {user.email}! Let's get you set up with your workspace.
      </p>
      
      <div style={{ display: "grid", gap: "1rem", maxWidth: 400, margin: "0 auto" }}>
        <div 
          style={{ 
            border: "2px solid #e2e8f0", 
            borderRadius: 8, 
            padding: "1.5rem", 
            cursor: "pointer",
            transition: "border-color 0.2s",
            backgroundColor: "#f8fafc"
          }}
          onClick={() => onNext("create-org")}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>🏢 Create Organization</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9em" }}>
            Start fresh with your own organization and invite team members later.
          </p>
        </div>

        <div 
          style={{ 
            border: "2px solid #e2e8f0", 
            borderRadius: 8, 
            padding: "1.5rem", 
            cursor: "pointer",
            transition: "border-color 0.2s",
            backgroundColor: "#f8fafc"
          }}
          onClick={() => onNext("join-org")}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#10b981")}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>🤝 Join Organization</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9em" }}>
            Join an existing organization using an invitation code or organization name.
          </p>
        </div>
      </div>
    </div>
  );
}

// Multi-step Create Organization Flow
function CreateOrgFlow({ 
  user, 
  personalInfo, 
  setPersonalInfo, 
  orgInfo, 
  setOrgInfo, 
  preferences, 
  setPreferences, 
  router 
}: {
  user: any;
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
  orgInfo: OrganizationInfo;
  setOrgInfo: (info: OrganizationInfo) => void;
  preferences: PreferencesInfo;
  setPreferences: (prefs: PreferencesInfo) => void;
  router: any;
}) {
  const [currentStep, setCurrentStep] = useState<CreateOrgStep>("personal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          user: personalInfo,
          org: orgInfo,
          preferences,
          type: "create"
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create organization");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setBusy(false);
    }
  };

  if (currentStep === "personal") {
    return (
      <PersonalInfoStep
        personalInfo={personalInfo}
        setPersonalInfo={setPersonalInfo}
        onNext={() => setCurrentStep("organization")}
        title="Tell us about yourself"
        subtitle="Let's start with your personal information"
      />
    );
  }

  if (currentStep === "organization") {
    return (
      <OrganizationInfoStep
        orgInfo={orgInfo}
        setOrgInfo={setOrgInfo}
        onNext={() => setCurrentStep("preferences")}
        onBack={() => setCurrentStep("personal")}
      />
    );
  }

  if (currentStep === "preferences") {
    return (
      <PreferencesStep
        preferences={preferences}
        setPreferences={setPreferences}
        onNext={() => setCurrentStep("review")}
        onBack={() => setCurrentStep("organization")}
      />
    );
  }

  if (currentStep === "review") {
    return (
      <ReviewStep
        personalInfo={personalInfo}
        orgInfo={orgInfo}
        preferences={preferences}
        onSubmit={handleSubmit}
        onBack={() => setCurrentStep("preferences")}
        busy={busy}
        error={error}
        type="create"
      />
    );
  }

  return null;
}

// Multi-step Join Organization Flow  
function JoinOrgFlow({
  user,
  personalInfo,
  setPersonalInfo,
  joinInfo,
  setJoinInfo,
  router
}: {
  user: any;
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
  joinInfo: JoinInfo;
  setJoinInfo: (info: JoinInfo) => void;
  router: any;
}) {
  const [currentStep, setCurrentStep] = useState<JoinOrgStep>("personal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          user: personalInfo,
          inviteCode: joinInfo.inviteCode.trim(),
          additionalInfo: {
            expectedRole: joinInfo.expectedRole,
            referrer: joinInfo.referrer,
          }
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to join organization");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to join organization");
    } finally {
      setBusy(false);
    }
  };

  if (currentStep === "personal") {
    return (
      <PersonalInfoStep
        personalInfo={personalInfo}
        setPersonalInfo={setPersonalInfo}
        onNext={() => setCurrentStep("invitation")}
        title="Complete your profile"
        subtitle="Help your new team get to know you"
      />
    );
  }

  if (currentStep === "invitation") {
    return (
      <InvitationStep
        joinInfo={joinInfo}
        setJoinInfo={setJoinInfo}
        onNext={() => setCurrentStep("profile")}
        onBack={() => setCurrentStep("personal")}
      />
    );
  }

  if (currentStep === "profile") {
    return (
      <ProfileCompletionStep
        personalInfo={personalInfo}
        setPersonalInfo={setPersonalInfo}
        onNext={() => setCurrentStep("review")}
        onBack={() => setCurrentStep("invitation")}
      />
    );
  }

  if (currentStep === "review") {
    return (
      <ReviewStep
        personalInfo={personalInfo}
        joinInfo={joinInfo}
        onSubmit={handleSubmit}
        onBack={() => setCurrentStep("profile")}
        busy={busy}
        error={error}
        type="join"
      />
    );
  }

  return null;
}

// Step Components
function PersonalInfoStep({ 
  personalInfo, 
  setPersonalInfo, 
  onNext, 
  title, 
  subtitle 
}: {
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
  onNext: () => void;
  title: string;
  subtitle: string;
}) {
  const isValid = !!(personalInfo.displayName.trim() && personalInfo.title.trim());

  return (
    <div>
      <h1>{title} 👤</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>{subtitle}</p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Full Name *
          </label>
          <input
            type="text"
            value={personalInfo.displayName}
            onChange={(e) => setPersonalInfo({ ...personalInfo, displayName: e.target.value })}
            placeholder="John Doe"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Job Title *
          </label>
          <input
            type="text"
            value={personalInfo.title}
            onChange={(e) => setPersonalInfo({ ...personalInfo, title: e.target.value })}
            placeholder="Software Engineer, Product Manager, etc."
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Department
          </label>
          <input
            type="text"
            value={personalInfo.department}
            onChange={(e) => setPersonalInfo({ ...personalInfo, department: e.target.value })}
            placeholder="Engineering, Marketing, Sales, etc."
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Phone Number
          </label>
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            style={inputStyle}
          />
        </div>

        <button
          onClick={onNext}
          disabled={!isValid}
          style={buttonStyle(isValid)}
        >
          Next: Organization Details
        </button>
      </div>
    </div>
  );
}

function OrganizationInfoStep({ 
  orgInfo, 
  setOrgInfo, 
  onNext, 
  onBack 
}: {
  orgInfo: OrganizationInfo;
  setOrgInfo: (info: OrganizationInfo) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = !!(orgInfo.name.trim() && orgInfo.industry.trim() && orgInfo.size.trim());

  return (
    <div>
      <h1>Organization Details 🏢</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Tell us about your organization
      </p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Organization Name *
          </label>
          <input
            type="text"
            value={orgInfo.name}
            onChange={(e) => setOrgInfo({ ...orgInfo, name: e.target.value })}
            placeholder="Acme Corporation"
            style={inputStyle}
            required
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Industry *
          </label>
          <select
            value={orgInfo.industry}
            onChange={(e) => setOrgInfo({ ...orgInfo, industry: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="">Select an industry</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="consulting">Consulting</option>
            <option value="media">Media & Entertainment</option>
            <option value="nonprofit">Non-Profit</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Company Size *
          </label>
          <select
            value={orgInfo.size}
            onChange={(e) => setOrgInfo({ ...orgInfo, size: e.target.value })}
            style={inputStyle}
            required
          >
            <option value="">Select company size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-1000">201-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Website
          </label>
          <input
            type="url"
            value={orgInfo.website}
            onChange={(e) => setOrgInfo({ ...orgInfo, website: e.target.value })}
            placeholder="https://www.example.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Description
          </label>
          <textarea
            value={orgInfo.description}
            onChange={(e) => setOrgInfo({ ...orgInfo, description: e.target.value })}
            placeholder="Brief description of your organization..."
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={onBack} style={secondaryButtonStyle}>
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!isValid}
            style={buttonStyle(isValid)}
          >
            Next: Preferences
          </button>
        </div>
      </div>
    </div>
  );
}

function PreferencesStep({ 
  preferences, 
  setPreferences, 
  onNext, 
  onBack 
}: {
  preferences: PreferencesInfo;
  setPreferences: (prefs: PreferencesInfo) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1>Workspace Preferences ⚙️</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Configure your workspace settings
      </p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Time Zone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
            style={inputStyle}
          >
            <option value="America/New_York">Eastern Time (EST)</option>
            <option value="America/Chicago">Central Time (CST)</option>
            <option value="America/Denver">Mountain Time (MST)</option>
            <option value="America/Los_Angeles">Pacific Time (PST)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Central European (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Australia/Sydney">Sydney (AEST)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Working Hours
          </label>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <input
              type="time"
              value={preferences.startTime}
              onChange={(e) => setPreferences({ ...preferences, startTime: e.target.value })}
              style={{ ...inputStyle, width: "auto" }}
            />
            <span>to</span>
            <input
              type="time"
              value={preferences.endTime}
              onChange={(e) => setPreferences({ ...preferences, endTime: e.target.value })}
              style={{ ...inputStyle, width: "auto" }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "1rem", fontWeight: 600 }}>
            Notification Preferences
          </label>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={preferences.notifications.email}
                onChange={(e) => setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, email: e.target.checked }
                })}
              />
              Email notifications
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={preferences.notifications.push}
                onChange={(e) => setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, push: e.target.checked }
                })}
              />
              Push notifications
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                checked={preferences.notifications.mentions}
                onChange={(e) => setPreferences({
                  ...preferences,
                  notifications: { ...preferences.notifications, mentions: e.target.checked }
                })}
              />
              Mentions and direct messages
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={onBack} style={secondaryButtonStyle}>
            Back
          </button>
          <button onClick={onNext} style={buttonStyle(true)}>
            Review & Complete
          </button>
        </div>
      </div>
    </div>
  );
}

function InvitationStep({ 
  joinInfo, 
  setJoinInfo, 
  onNext, 
  onBack 
}: {
  joinInfo: JoinInfo;
  setJoinInfo: (info: JoinInfo) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = !!joinInfo.inviteCode.trim();

  return (
    <div>
      <h1>Join Your Team 🎯</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Enter your invitation details to join the organization
      </p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Invitation Code *
          </label>
          <input
            type="text"
            value={joinInfo.inviteCode}
            onChange={(e) => setJoinInfo({ ...joinInfo, inviteCode: e.target.value })}
            placeholder="FRESH-ACME-ABC123"
            style={{ ...inputStyle, textTransform: "uppercase" }}
            required
          />
          <p style={{ fontSize: "0.9em", color: "#64748b", margin: "0.5rem 0 0 0" }}>
            Get this from your team admin or the invitation email
          </p>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Expected Role
          </label>
          <select
            value={joinInfo.expectedRole}
            onChange={(e) => setJoinInfo({ ...joinInfo, expectedRole: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select expected role</option>
            <option value="member">Team Member</option>
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="contributor">Contributor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Who referred you?
          </label>
          <input
            type="text"
            value={joinInfo.referrer}
            onChange={(e) => setJoinInfo({ ...joinInfo, referrer: e.target.value })}
            placeholder="Name of the person who invited you"
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={onBack} style={secondaryButtonStyle}>
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!isValid}
            style={buttonStyle(isValid)}
          >
            Next: Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileCompletionStep({ 
  personalInfo, 
  setPersonalInfo, 
  onNext, 
  onBack 
}: {
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: PersonalInfo) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h1>Complete Your Profile 🌟</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Add additional information to help your team get to know you
      </p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
            Professional Bio
          </label>
          <textarea
            value={personalInfo.bio}
            onChange={(e) => setPersonalInfo({ ...personalInfo, bio: e.target.value })}
            placeholder="Brief professional background, interests, or what you're excited to work on..."
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
          />
        </div>

        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#f8fafc", 
          borderRadius: 6, 
          border: "1px solid #e2e8f0" 
        }}>
          <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>💡 Pro Tip</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9em" }}>
            A good bio helps your new teammates understand your experience and interests. 
            You can always update this later in your profile settings.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button onClick={onBack} style={secondaryButtonStyle}>
            Back
          </button>
          <button onClick={onNext} style={buttonStyle(true)}>
            Review & Join
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ 
  personalInfo,
  orgInfo,
  preferences,
  joinInfo,
  onSubmit,
  onBack,
  busy,
  error,
  type
}: {
  personalInfo: PersonalInfo;
  orgInfo?: OrganizationInfo;
  preferences?: PreferencesInfo;
  joinInfo?: JoinInfo;
  onSubmit: () => void;
  onBack: () => void;
  busy: boolean;
  error: string | null;
  type: "create" | "join";
}) {
  return (
    <div>
      <h1>{type === "create" ? "Review & Create Organization" : "Review & Join Organization"} ✅</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Please review your information before {type === "create" ? "creating your organization" : "joining the team"}
      </p>

      <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Personal Info */}
        <div style={reviewSectionStyle}>
          <h3>👤 Personal Information</h3>
          <div style={reviewItemStyle}>
            <strong>Name:</strong> {personalInfo.displayName}
          </div>
          <div style={reviewItemStyle}>
            <strong>Title:</strong> {personalInfo.title}
          </div>
          {personalInfo.department && (
            <div style={reviewItemStyle}>
              <strong>Department:</strong> {personalInfo.department}
            </div>
          )}
          {personalInfo.phone && (
            <div style={reviewItemStyle}>
              <strong>Phone:</strong> {personalInfo.phone}
            </div>
          )}
          {personalInfo.bio && (
            <div style={reviewItemStyle}>
              <strong>Bio:</strong> {personalInfo.bio}
            </div>
          )}
        </div>

        {/* Organization Info (Create path) */}
        {type === "create" && orgInfo && (
          <div style={reviewSectionStyle}>
            <h3>🏢 Organization</h3>
            <div style={reviewItemStyle}>
              <strong>Name:</strong> {orgInfo.name}
            </div>
            <div style={reviewItemStyle}>
              <strong>Industry:</strong> {orgInfo.industry}
            </div>
            <div style={reviewItemStyle}>
              <strong>Size:</strong> {orgInfo.size}
            </div>
            {orgInfo.website && (
              <div style={reviewItemStyle}>
                <strong>Website:</strong> {orgInfo.website}
              </div>
            )}
            {orgInfo.description && (
              <div style={reviewItemStyle}>
                <strong>Description:</strong> {orgInfo.description}
              </div>
            )}
          </div>
        )}

        {/* Join Info (Join path) */}
        {type === "join" && joinInfo && (
          <div style={reviewSectionStyle}>
            <h3>🎯 Invitation Details</h3>
            <div style={reviewItemStyle}>
              <strong>Invite Code:</strong> {joinInfo.inviteCode}
            </div>
            {joinInfo.expectedRole && (
              <div style={reviewItemStyle}>
                <strong>Expected Role:</strong> {joinInfo.expectedRole}
              </div>
            )}
            {joinInfo.referrer && (
              <div style={reviewItemStyle}>
                <strong>Referred by:</strong> {joinInfo.referrer}
              </div>
            )}
          </div>
        )}

        {/* Preferences (Create path) */}
        {type === "create" && preferences && (
          <div style={reviewSectionStyle}>
            <h3>⚙️ Preferences</h3>
            <div style={reviewItemStyle}>
              <strong>Timezone:</strong> {preferences.timezone}
            </div>
            <div style={reviewItemStyle}>
              <strong>Working Hours:</strong> {preferences.startTime} - {preferences.endTime}
            </div>
            <div style={reviewItemStyle}>
              <strong>Notifications:</strong>{' '}
              {[
                preferences.notifications.email && "Email",
                preferences.notifications.push && "Push", 
                preferences.notifications.mentions && "Mentions"
              ].filter(Boolean).join(", ") || "None"}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#fee2e2", 
          border: "1px solid #fecaca",
          borderRadius: 6, 
          color: "#dc2626",
          marginBottom: "1rem"
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem" }}>
        <button onClick={onBack} style={secondaryButtonStyle} disabled={busy}>
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={busy}
          style={buttonStyle(!busy)}
        >
          {busy 
            ? (type === "create" ? "Creating Organization..." : "Joining Organization...")
            : (type === "create" ? "Create Organization" : "Join Organization")
          }
        </button>
      </div>
    </div>
  );
}

// Styles
const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  border: "2px solid #e2e8f0",
  borderRadius: 6,
  fontSize: "1rem",
  outline: "none",
  transition: "border-color 0.2s",
} as const;

const buttonStyle = (enabled: boolean) => ({
  padding: "0.75rem 1.5rem",
  backgroundColor: enabled ? "#3b82f6" : "#9ca3af",
  color: "white",
  border: "none",
  borderRadius: 6,
  fontSize: "1rem",
  cursor: enabled ? "pointer" : "not-allowed",
  fontWeight: 600,
  flex: 1,
});

const secondaryButtonStyle = {
  padding: "0.75rem 1.5rem",
  backgroundColor: "transparent",
  color: "#6b7280",
  border: "2px solid #e5e7eb",
  borderRadius: 6,
  fontSize: "1rem",
  cursor: "pointer",
  fontWeight: 600,
};

const reviewSectionStyle = {
  padding: "1.5rem",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  backgroundColor: "#f8fafc",
};

const reviewItemStyle = {
  marginBottom: "0.5rem",
  color: "#374151",
};
