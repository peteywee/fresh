#!/usr/bin/env bash
set -euo pipefail

echo "==> Fresh Full Integration (Firebase + Comprehensive Onboarding)"

# --- Workspace map ---
cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
EOF

# --- Root package scripts ---
cat > package.json <<'EOF'
{
  "name": "fresh",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "concurrently \"pnpm dev:api\" \"pnpm dev:web\"",
    "dev:web": "pnpm --filter @apps/web dev",
    "dev:api": "pnpm --filter @services/api dev",
    "dev:restart": "./scripts/restart-dev.sh",
    "dev:kill": "./scripts/kill-dev-processes.sh",
    "dev:status": "./scripts/dev-status.sh",
    "typecheck": "pnpm -r --parallel --if-present typecheck",
    "lint": "pnpm -r --parallel --if-present lint",
    "build": "pnpm --filter @packages/types build && pnpm -r --parallel --if-present build",
    "test": "pnpm -r --parallel --if-present test",
    "docs": "typedoc --out docs/API packages",
    "doctor": "./scripts/doctor.sh"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^8.43.0",
    "@typescript-eslint/parser": "^8.43.0",
    "eslint": "^9.9.0",
    "typedoc": "^0.28.12",
    "concurrently": "^9.0.1"
  }
}
EOF

# --- ESLint flat config (root) ---
cat > eslint.config.cjs <<'EOF'
/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  { ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**", "docs/**", "sac.json"] },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    rules: {}
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    plugins: { "@typescript-eslint": require("@typescript-eslint/eslint-plugin") },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "ignoreRestSiblings": true }]
    }
  }
];
EOF

# --- VS Code tasks and settings ---
mkdir -p .vscode
cat > .vscode/tasks.json <<'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🚀 Start Development Environment",
      "type": "shell",
      "command": "./scripts/restart-dev.sh",
      "group": "build",
      "detail": "Start both web and API development servers with health checks",
      "problemMatcher": []
    },
    {
      "label": "⚡ Quick Restart Development",
      "type": "shell", 
      "command": "./scripts/quick-restart.sh",
      "group": "build",
      "detail": "Quickly restart development servers (faster than full restart)",
      "problemMatcher": []
    },
    {
      "label": "🛑 Kill Development Processes",
      "type": "shell",
      "command": "./scripts/kill-dev-processes.sh", 
      "group": "build",
      "detail": "Kill all running development processes and free up ports",
      "problemMatcher": []
    },
    {
      "label": "📊 Development Status",
      "type": "shell",
      "command": "./scripts/dev-status.sh",
      "group": "test", 
      "detail": "Check status of development servers and processes",
      "problemMatcher": []
    },
    {
      "label": "🌐 Start Web Only",
      "type": "shell",
      "command": "pnpm dev:web",
      "group": "build",
      "detail": "Start only the web development server (Next.js)",
      "problemMatcher": []
    },
    {
      "label": "🔧 Start API Only", 
      "type": "shell",
      "command": "PORT=3001 pnpm dev:api",
      "group": "build",
      "detail": "Start only the API development server (Express)",
      "problemMatcher": []
    },
    {
      "label": "🔨 Build All",
      "type": "shell",
      "command": "pnpm build",
      "group": "build", 
      "detail": "Build all packages (types, api, web)",
      "problemMatcher": ["$tsc"]
    },
    {
      "label": "🔍 Type Check",
      "type": "shell",
      "command": "pnpm typecheck", 
      "group": "test",
      "detail": "Run TypeScript type checking on all packages",
      "problemMatcher": ["$tsc"]
    }
  ]
}
EOF

cat > .vscode/settings.json <<'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.workingDirectories": ["apps/web", "services/api", "packages/types"],
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
EOF

# --- TYPES PACKAGE (Enhanced) -----------------------------------------------
mkdir -p packages/types/src

cat > packages/types/package.json <<'EOF'
{
  "name": "@packages/types",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./onboarding": {
      "types": "./dist/onboarding.d.ts", 
      "import": "./dist/onboarding.js"
    },
    "./auth": {
      "types": "./dist/auth.d.ts",
      "import": "./dist/auth.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.5.4"
  }
}
EOF

cat > packages/types/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Enhanced core schemas
cat > packages/types/src/index.ts <<'EOF'
import { z } from "zod";

export const RoleSchema = z.enum(["owner", "admin", "member", "staff", "viewer"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).optional(),
  orgId: z.string().min(1).nullable(),
  role: RoleSchema,
  onboardingComplete: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  lastLoginAt: z.string().datetime().optional()
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  createdAt: z.string().datetime(),
  ownerId: z.string().min(1)
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const InviteSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  invitedBy: z.string().min(1),
  email: z.string().email().optional(),
  role: RoleSchema.default("member"),
  code: z.string().min(6),
  expiresAt: z.string().datetime(),
  usedAt: z.string().datetime().optional(),
  usedBy: z.string().min(1).optional()
});
export type Invite = z.infer<typeof InviteSchema>;

export const ScheduleEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  orgId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  role: z.string().min(1).optional(),
  location: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional()
});
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

// Re-export from other modules
export * from "./auth.js";
export * from "./onboarding.js";
EOF

# Authentication schemas
cat > packages/types/src/auth.ts <<'EOF'
import { z } from "zod";
import { RoleSchema } from "./index.js";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  orgChoice: z.enum(["create", "join"]).default("create"),
  org: z.object({
    name: z.string().min(2),
    id: z.string().optional()
  }).optional()
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const SessionSchema = z.object({
  sub: z.string().min(1), // Firebase user ID
  email: z.string().email(),
  displayName: z.string().optional(),
  role: RoleSchema.optional(),
  orgId: z.string().optional(),
  orgName: z.string().optional(),
  onboardingComplete: z.boolean().default(false),
  iat: z.number().optional(),
  exp: z.number().optional()
});
export type Session = z.infer<typeof SessionSchema>;

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    displayName: z.string().optional(),
    role: RoleSchema.optional(),
    onboardingComplete: z.boolean()
  }).optional(),
  error: z.string().optional(),
  token: z.string().optional()
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
EOF

# Enhanced onboarding schemas
cat > packages/types/src/onboarding.ts <<'EOF'
import { z } from "zod";
import { RoleSchema } from "./index.js";

export const OnboardingStepSchema = z.enum([
  "welcome",
  "personal-info", 
  "organization-choice",
  "create-organization",
  "join-organization",
  "preferences",
  "complete"
]);
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

export const PersonalInfoSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  timezone: z.string().default("UTC"),
  profilePicture: z.string().url().optional()
});
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

export const OrganizationDetailsSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  displayName: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.enum([
    "technology",
    "healthcare",
    "finance", 
    "education",
    "retail",
    "manufacturing",
    "consulting",
    "non-profit",
    "government",
    "other"
  ]).optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional()
});
export type OrganizationDetails = z.infer<typeof OrganizationDetailsSchema>;

export const CreateOrgRequestSchema = z.object({
  user: PersonalInfoSchema,
  org: OrganizationDetailsSchema,
  type: z.literal("create").default("create")
});
export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>;

export const JoinOrgRequestSchema = z.object({
  user: PersonalInfoSchema,
  inviteCode: z.string().min(6, "Invite code must be at least 6 characters"),
  type: z.literal("join").default("join")
});
export type JoinOrgRequest = z.infer<typeof JoinOrgRequestSchema>;

export const OnboardingPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  browserNotifications: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
  workingHours: z.object({
    start: z.string().default("09:00"),
    end: z.string().default("17:00"),
    timezone: z.string().default("UTC"),
    workDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5])
  }).optional()
});
export type OnboardingPreferences = z.infer<typeof OnboardingPreferencesSchema>;

export const OnboardingStateSchema = z.object({
  currentStep: OnboardingStepSchema.default("welcome"),
  completedSteps: z.array(OnboardingStepSchema).default([]),
  personalInfo: PersonalInfoSchema.optional(),
  organizationChoice: z.enum(["create", "join"]).optional(),
  organizationDetails: OrganizationDetailsSchema.optional(),
  inviteCode: z.string().optional(),
  preferences: OnboardingPreferencesSchema.optional(),
  isComplete: z.boolean().default(false)
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;

export const OnboardingResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    displayName: z.string(),
    role: RoleSchema
  }),
  organization: z.object({
    id: z.string().min(1),
    name: z.string().min(2),
    role: RoleSchema
  }),
  nextStep: z.string().optional(),
  error: z.string().optional()
});
export type OnboardingResponse = z.infer<typeof OnboardingResponseSchema>;
EOF

# --- API SERVICE (Enhanced with Firebase Admin) ----------------------------
mkdir -p services/api/src

cat > services/api/package.json <<'EOF'
{
  "name": "@services/api",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint --ext .js,.jsx,.ts,.tsx ."
  },
  "dependencies": {
    "cors": "2.8.5",
    "express": "4.20.0",
    "pino": "9.9.4",
    "zod": "3.23.8",
    "firebase-admin": "^12.1.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.19",
    "@types/express": "4.17.21",
    "@types/node": "20.11.30",
    "tsx": "4.20.5",
    "typescript": "5.5.4"
  }
}
EOF

cat > services/api/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "baseUrl": ".",
    "paths": {
      "@packages/types/*": ["../../packages/types/src/*"]
    },
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
EOF

# Enhanced API with Firebase Admin
cat > services/api/src/index.ts <<'EOF'
import express from "express";
import cors from "cors";
import { pino } from "pino";
import authRouter from "./auth.js";

// Named shared stores exported for route modules to consume
export const orgs: Map<string, any> = new Map();
export const users: Map<string, any> = new Map();

const log = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();

app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({ 
    name: "fresh-api",
    version: "0.1.0",
    description: "Fresh Scheduler API - handles auth, onboarding, and project management"
  });
});

// Health checks
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "fresh-api", timestamp: new Date().toISOString() });
});

app.get("/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development", 
    time: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API probe aliases
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "fresh-api" });
});

app.get("/api/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// Diagnostics
app.get("/__/probe", (req, res) => {
  const runId = req.header("x-run-id") || null;
  res.status(200).json({ ok: true, runId, probedAt: new Date().toISOString() });
});

// Auth API
app.use("/api", authRouter);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  log.error(err, "API Error");
  res.status(500).json({ error: "Internal server error", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path, timestamp: new Date().toISOString() });
});

// Start server
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  log.info({ port: PORT }, "Fresh API listening");
});
EOF

# Enhanced auth router with comprehensive features
cat > services/api/src/auth.ts <<'EOF'
import { Router } from "express";
import { randomUUID } from "node:crypto";

type Role = "owner" | "admin" | "member" | "staff" | "viewer";

type UserRecord = {
  id: string;
  email: string;
  password: string; // dev-only plain text; replace with hash in prod
  displayName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  department?: string;
  phoneNumber?: string;
  timezone?: string;
  role: Role;
  orgId?: string | null;
  onboardingComplete?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
};

type OrganizationRecord = {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  ownerId: string;
  createdAt: string;
};

type InviteRecord = {
  id: string;
  orgId: string;
  invitedBy: string;
  email?: string;
  role: Role;
  code: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
};

const users = new Map<string, UserRecord>(); // key by normalized email
const organizations = new Map<string, OrganizationRecord>(); // key by org id
const invites = new Map<string, InviteRecord>(); // key by invite code
const resetTokens = new Map<string, string>(); // token -> normalized email

const norm = (s: unknown) =>
  typeof s === "string" ? s.trim().toLowerCase() : "";

// Seed data
const seedEmail = norm("admin@fresh.com");
const seedOrgId = randomUUID();
const seedUserId = randomUUID();

if (!users.has(seedEmail)) {
  // Create seed organization
  organizations.set(seedOrgId, {
    id: seedOrgId,
    name: "Fresh Demo Organization",
    displayName: "Fresh Demo Org",
    description: "Demo organization for testing",
    industry: "technology",
    size: "11-50",
    ownerId: seedUserId,
    createdAt: new Date().toISOString()
  });

  // Create seed user
  users.set(seedEmail, {
    id: seedUserId,
    email: seedEmail,
    password: "demo123",
    displayName: "Admin User",
    firstName: "Admin",
    lastName: "User",
    jobTitle: "Administrator",
    role: "owner",
    orgId: seedOrgId,
    onboardingComplete: true,
    createdAt: new Date().toISOString()
  });

  // Create demo invite code
  const demoInviteCode = "DEMO-" + String(Math.random()).slice(2, 8).toUpperCase();
  const inviteExpiry = new Date();
  inviteExpiry.setDate(inviteExpiry.getDate() + 7); // 7 days from now
  
  invites.set(demoInviteCode, {
    id: randomUUID(),
    orgId: seedOrgId,
    invitedBy: seedUserId,
    role: "member",
    code: demoInviteCode,
    expiresAt: inviteExpiry.toISOString()
  });

  console.log(`🎯 Demo setup complete:`);
  console.log(`   Email: ${seedEmail}`);
  console.log(`   Password: demo123`);
  console.log(`   Invite Code: ${demoInviteCode}`);
}

const router = Router();

// User registration
router.post("/register", (req, res) => {
  const email = norm(req.body?.email);
  const password = String(req.body?.password ?? "");
  const displayName = String(req.body?.displayName ?? "");
  const firstName = String(req.body?.firstName ?? "");
  const lastName = String(req.body?.lastName ?? "");

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  if (users.has(email)) {
    return res.status(409).json({ error: "email already registered" });
  }

  const u: UserRecord = {
    id: randomUUID(),
    email,
    password,
    displayName: displayName || `${firstName} ${lastName}`.trim() || email.split("@")[0],
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    role: "member",
    orgId: null,
    onboardingComplete: false,
    createdAt: new Date().toISOString()
  };
  
  users.set(email, u);
  return res.status(201).json({ 
    success: true,
    message: "registered", 
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      onboardingComplete: u.onboardingComplete
    }
  });
});

// User login
router.post("/login", (req, res) => {
  const email = norm(req.body?.email);
  const password = String(req.body?.password ?? "");
  const u = email ? users.get(email) : null;
  
  if (!u || u.password !== password) {
    return res.status(401).json({ error: "invalid credentials" });
  }

  // Update last login
  u.lastLoginAt = new Date().toISOString();
  
  const org = u.orgId ? organizations.get(u.orgId) : null;
  
  return res.status(200).json({
    success: true,
    message: "ok",
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      onboardingComplete: !!u.onboardingComplete,
    },
    organization: org ? {
      id: org.id,
      name: org.name,
      displayName: org.displayName,
      role: u.role
    } : null
  });
});

// Forgot password
router.post("/forgot-password", (req, res) => {
  const email = norm(req.body?.email);
  const u = email ? users.get(email) : null;
  
  // Do not leak existence; always return 200
  if (!u) {
    return res.status(200).json({ 
      success: true,
      message: "if the account exists, a reset token has been sent" 
    });
  }

  const token = randomUUID();
  resetTokens.set(token, email);
  
  // Dev-only: return token to speed up local testing
  return res.status(200).json({ 
    success: true,
    message: "reset token created", 
    token // Remove in production
  });
});

// Reset password
router.post("/reset-password", (req, res) => {
  const token = String(req.body?.token ?? "");
  const newPassword = String(req.body?.newPassword ?? "");
  
  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }
  
  const email = resetTokens.get(token);
  if (!email) {
    return res.status(400).json({ error: "invalid or expired token" });
  }
  
  const u = users.get(email);
  if (!u) {
    return res.status(400).json({ error: "invalid state" });
  }

  u.password = newPassword;
  resetTokens.delete(token);
  
  return res.status(200).json({ 
    success: true,
    message: "password reset successfully" 
  });
});

// Complete onboarding - Create organization
router.post("/onboarding/complete", (req, res) => {
  const { user: userInfo, org: orgInfo, type = "create" } = req.body || {};
  
  if (!userInfo?.displayName || !orgInfo?.name) {
    return res.status(400).json({ error: "user displayName and org name are required" });
  }

  if (type === "create") {
    // Create new organization
    const orgId = randomUUID();
    const userId = randomUUID();
    const now = new Date().toISOString();
    
    const organization: OrganizationRecord = {
      id: orgId,
      name: orgInfo.name,
      displayName: orgInfo.displayName || orgInfo.name,
      description: orgInfo.description,
      website: orgInfo.website,
      industry: orgInfo.industry,
      size: orgInfo.size,
      ownerId: userId,
      createdAt: now
    };
    
    organizations.set(orgId, organization);
    
    // Update or create user
    const email = norm(userInfo.email);
    let user = users.get(email);
    
    if (user) {
      // Update existing user
      user.displayName = userInfo.displayName;
      user.firstName = userInfo.firstName;
      user.lastName = userInfo.lastName;
      user.jobTitle = userInfo.jobTitle;
      user.department = userInfo.department;
      user.phoneNumber = userInfo.phoneNumber;
      user.timezone = userInfo.timezone;
      user.role = "owner";
      user.orgId = orgId;
      user.onboardingComplete = true;
    } else {
      // Create new user
      user = {
        id: userId,
        email: email,
        password: "temp-password", // Should be set during registration
        displayName: userInfo.displayName,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        jobTitle: userInfo.jobTitle,
        department: userInfo.department,
        phoneNumber: userInfo.phoneNumber,
        timezone: userInfo.timezone || "UTC",
        role: "owner",
        orgId: orgId,
        onboardingComplete: true,
        createdAt: now
      };
      users.set(email, user);
    }
    
    return res.status(200).json({
      success: true,
      message: "onboarding completed - organization created",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role
      },
      organization: {
        id: organization.id,
        name: organization.name,
        displayName: organization.displayName,
        role: "owner"
      }
    });
  } else {
    return res.status(400).json({ error: "invalid onboarding type" });
  }
});

// Join organization via invite code
router.post("/onboarding/join", (req, res) => {
  const { user: userInfo, inviteCode } = req.body || {};
  
  if (!userInfo?.displayName || !inviteCode) {
    return res.status(400).json({ error: "user displayName and inviteCode are required" });
  }

  const invite = invites.get(inviteCode);
  if (!invite) {
    return res.status(404).json({ error: "invalid invite code" });
  }
  
  // Check if invite is expired
  if (new Date(invite.expiresAt) < new Date()) {
    return res.status(400).json({ error: "invite code has expired" });
  }
  
  // Check if invite is already used
  if (invite.usedAt) {
    return res.status(400).json({ error: "invite code has already been used" });
  }

  const organization = organizations.get(invite.orgId);
  if (!organization) {
    return res.status(404).json({ error: "organization not found for invite" });
  }

  // Update or create user
  const email = norm(userInfo.email);
  let user = users.get(email);
  const userId = user?.id || randomUUID();
  const now = new Date().toISOString();
  
  if (user) {
    // Update existing user
    user.displayName = userInfo.displayName;
    user.firstName = userInfo.firstName;
    user.lastName = userInfo.lastName;
    user.jobTitle = userInfo.jobTitle;
    user.department = userInfo.department;
    user.phoneNumber = userInfo.phoneNumber;
    user.timezone = userInfo.timezone;
    user.role = invite.role;
    user.orgId = invite.orgId;
    user.onboardingComplete = true;
  } else {
    // Create new user
    user = {
      id: userId,
      email: email,
      password: "temp-password", // Should be set during registration
      displayName: userInfo.displayName,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      jobTitle: userInfo.jobTitle,
      department: userInfo.department,
      phoneNumber: userInfo.phoneNumber,
      timezone: userInfo.timezone || "UTC",
      role: invite.role,
      orgId: invite.orgId,
      onboardingComplete: true,
      createdAt: now
    };
    users.set(email, user);
  }
  
  // Mark invite as used
  invite.usedAt = now;
  invite.usedBy = userId;
  
  return res.status(200).json({
    success: true,
    message: "onboarding completed - joined organization",
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role
    },
    organization: {
      id: organization.id,
      name: organization.name,
      displayName: organization.displayName,
      role: user.role
    }
  });
});

// Get organizations (for admin)
router.get("/organizations", (req, res) => {
  const orgsArray = Array.from(organizations.values()).map(org => ({
    id: org.id,
    name: org.name,
    displayName: org.displayName,
    industry: org.industry,
    size: org.size,
    createdAt: org.createdAt
  }));
  
  return res.status(200).json({ 
    success: true,
    organizations: orgsArray 
  });
});

// Get users (for admin)
router.get("/users", (req, res) => {
  const usersArray = Array.from(users.values()).map(user => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    orgId: user.orgId,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  }));
  
  return res.status(200).json({ 
    success: true,
    users: usersArray 
  });
});

// Get invite codes (for admin)
router.get("/invites", (req, res) => {
  const invitesArray = Array.from(invites.values()).map(invite => ({
    id: invite.id,
    orgId: invite.orgId,
    role: invite.role,
    code: invite.code,
    expiresAt: invite.expiresAt,
    usedAt: invite.usedAt,
    usedBy: invite.usedBy
  }));
  
  return res.status(200).json({ 
    success: true,
    invites: invitesArray 
  });
});

export default router;
EOF

# --- NEXT.JS WEB APP (Full Integration) -------------------------------------
mkdir -p apps/web/{app,lib,components}
mkdir -p apps/web/app/{api,dashboard,onboarding}
mkdir -p apps/web/app/api/{session,onboarding,admin,debug}
mkdir -p apps/web/app/'(public)'/{login,register,forgot-password,reset-password}
mkdir -p apps/web/components/{ui,onboarding}

cat > apps/web/package.json <<'EOF'
{
  "name": "@apps/web",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev -p 3000 --turbo",
    "build": "next build",
    "start": "next start -p 3000",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint --ext .js,.jsx,.ts,.tsx ."
  },
  "dependencies": {
    "next": "15.5.2",
    "react": "19.1.1", 
    "react-dom": "19.1.1",
    "zod": "3.23.8",
    "firebase": "^10.13.2",
    "firebase-admin": "^12.1.0"
  },
  "devDependencies": {
    "@types/node": "20.11.30",
    "@types/react": "19.0.2",
    "@types/react-dom": "19.0.0",
    "typescript": "5.5.4"
  }
}
EOF

cat > apps/web/next.config.js <<'EOF'
/** @type {import('next').NextConfig} */
// Prefer API_BASE_URL, fallback to API_URL, then default to local dev port 3001
const API_URL = process.env.API_BASE_URL || process.env.API_URL || "http://localhost:3001";

const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  eslint: {
    // We run ESLint separately in CI; skip during Next build to avoid plugin detection warnings
    ignoreDuringBuilds: true,
  },
  // Build-time optimizations
  experimental: {
    optimizePackageImports: ['firebase', 'firebase-admin', 'zod'],
  },
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error']
    } : false,
  },
  // Add headers for static assets to improve PWA caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/login", destination: `${API_URL}/api/login` },
      { source: "/api/register", destination: `${API_URL}/api/register` },
      { source: "/api/forgot-password", destination: `${API_URL}/api/forgot-password` },
      { source: "/api/reset-password", destination: `${API_URL}/api/reset-password` },
    ];
  },
};

module.exports = nextConfig;
EOF

cat > apps/web/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "ES2022",
      "DOM"
    ],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowJs": false,
    "noEmit": true,
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./app/*"],
      "@/lib/*": ["./lib/*"],
      "@/components/*": ["./components/*"]
    },
    "types": [
      "node"
    ],
    "skipLibCheck": true,
    "incremental": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "next-env.d.ts",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
EOF

# Firebase configuration files
cat > apps/web/lib/firebase.client.ts <<'EOF'
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
export const auth = getAuth(app);
export const firebaseApp = app;

// Legacy exports for compatibility
export function getFirebaseApp(): FirebaseApp {
  return app;
}

export function getFirebaseAuth(): Auth {
  return auth;
}
EOF

cat > apps/web/lib/firebase.admin.ts <<'EOF'
import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join } from "path";

let app: App | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

function required(name: string, v: string | undefined): string {
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  
  try {
    // Try to load from service account key file first
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
    if (keyPath) {
      const fullPath = join(process.cwd(), keyPath);
      const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'));
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      return app!;
    }

    // Fallback to individual environment variables
    const projectId = required("FIREBASE_PROJECT_ID", process.env.FIREBASE_PROJECT_ID);
    const clientEmail = required("FIREBASE_CLIENT_EMAIL", process.env.FIREBASE_CLIENT_EMAIL);
    const rawKey = required("FIREBASE_PRIVATE_KEY", process.env.FIREBASE_PRIVATE_KEY);
    const privateKey = rawKey.replace(/\\n/g, "\n");

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    return app!;
  } catch (error) {
    console.error("Firebase Admin initialization failed:", error);
    throw error;
  }
}

export function adminAuth(): Auth {
  if (!auth) auth = getAuth(getAdminApp());
  return auth;
}

export function adminDb(): Firestore {
  if (!db) db = getFirestore(getAdminApp());
  return db;
}
EOF

cat > apps/web/lib/session.ts <<'EOF'
import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "./firebase.admin";

export type ServerSession = {
  sub: string; // Firebase user ID
  email?: string;
  displayName?: string;
  role?: string;
  orgId?: string;
  orgName?: string;
  onboardingComplete?: boolean;
  iat?: number;
  exp?: number;
} | null;

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";

export async function getServerSession(): Promise<ServerSession> {
  try {
    const jar = await cookies();
    const sessionCookie = jar.get(COOKIE)?.value;
    if (!sessionCookie) return null;

    const auth = adminAuth();
    const claims = await auth.verifySessionCookie(sessionCookie);
    
    return {
      sub: claims.uid,
      email: claims.email,
      displayName: claims.name || claims.displayName,
      role: claims.role,
      orgId: claims.orgId,
      orgName: claims.orgName, 
      onboardingComplete: claims.onboardingComplete,
      iat: claims.iat,
      exp: claims.exp,
    };
  } catch (error) {
    console.warn("Session verification failed:", error);
    return null;
  }
}
EOF

cat > apps/web/lib/roles.ts <<'EOF'
import { type ServerSession } from "./session";

export type Role = "owner" | "admin" | "member" | "staff" | "viewer";

const RANK: Record<Role, number> = {
  owner: 5,
  admin: 4,
  member: 3,
  staff: 2,
  viewer: 1,
};

export function getRole(session: ServerSession): Role | null {
  const r = (session?.role as string | undefined)?.toLowerCase();
  if (r === "owner" || r === "admin" || r === "member" || r === "staff" || r === "viewer") return r;
  return null;
}

export function hasRoleAtLeast(session: ServerSession, required: Role): boolean {
  const r = getRole(session);
  if (!r) return false;
  return RANK[r] >= RANK[required];
}

/**
 * Convenience helper for API route handlers.
 * Returns an error object if unauthorized, else undefined to continue.
 */
export function ensureRole(session: ServerSession, required: Role): { status: number; error: string } | undefined {
  if (!session?.sub) return { status: 401, error: "Unauthorized" };
  if (!hasRoleAtLeast(session, required)) return { status: 403, error: "Forbidden" };
}

/**
 * Convenience: management is owner or admin.
 */
export function isManagement(session: ServerSession): boolean {
  return hasRoleAtLeast(session, "admin");
}

/**
 * Write access is limited to management by default.
 */
export function canWrite(session: ServerSession): boolean {
  return isManagement(session);
}

/**
 * Strict guard that returns a standardized error tuple for write endpoints.
 */
export function ensureWrite(session: ServerSession): { status: number; error: string } | undefined {
  return ensureRole(session, "admin");
}
EOF

# Main layout with PWA support
cat > apps/web/app/layout.tsx <<'EOF'
export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Fresh",
  description: "Authentication + Onboarding + Scheduling Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#111827" />
      </head>
      <body style={{ fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell", margin: 0 }}>
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>{children}</div>
        </div>
        <script dangerouslySetInnerHTML={{__html: 'if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));}'}} />
      </body>
    </html>
  );
}
EOF

# Root page with proper redirects
cat > apps/web/app/page.tsx <<'EOF'
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function Home() {
  const session = await getServerSession();
  
  if (!session?.sub) {
    return redirect("/login");
  }
  
  if (!session.onboardingComplete) {
    return redirect("/onboarding");
  }
  
  return redirect("/dashboard");
}
EOF

# Enhanced login page with Firebase
cat > 'apps/web/app/(public)/login/page.tsx' <<'EOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    
    try {
      // Dynamic import to reduce initial bundle size and improve performance
      const [{ auth }, { signInWithEmailAndPassword }] = await Promise.all([
        import("@/lib/firebase.client"),
        import("firebase/auth"),
      ]);

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken(true);
      
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        throw new Error("Session exchange failed");
      }
      
      // Check current session status to determine redirect
      const statusResponse = await fetch("/api/session/current");
      const status = await statusResponse.json();
      
      if (status.user?.onboardingComplete) {
        // Use window.location to ensure middleware processes the new cookies
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/onboarding";
      }
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Welcome Back
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Sign in to your Fresh account
        </p>
      </div>
      
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Email Address
          </label>
          <input 
            placeholder="Enter your email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Password
          </label>
          <input 
            placeholder="Enter your password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <button 
          disabled={busy || !email || !password} 
          type="submit"
          style={{
            width: "100%",
            padding: "12px 24px",
            backgroundColor: busy || !email || !password ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: busy || !email || !password ? "not-allowed" : "pointer",
            transition: "background-color 0.2s"
          }}
        >
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>
      
      <div style={{ textAlign: "center", marginTop: 24, display: "flex", gap: 16, justifyContent: "center" }}>
        <a href="/register" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
          Create Account
        </a>
        <span style={{ color: "#d1d5db" }}>•</span>
        <a href="/forgot-password" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
          Forgot Password
        </a>
      </div>
      
      {error && (
        <div style={{ 
          color: "#dc2626", 
          backgroundColor: "#fef2f2", 
          padding: "12px 16px", 
          borderRadius: "8px", 
          marginTop: "16px",
          border: "1px solid #fecaca",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
    </main>
  );
}
EOF

# Continue with more components...
echo "Creating comprehensive onboarding flow..."

# Enhanced register page with Firebase
cat > 'apps/web/app/(public)/register/page.tsx' <<'EOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setBusy(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setBusy(false);
      return;
    }

    try {
      // Dynamic import to reduce initial bundle size
      const [{ auth }, { createUserWithEmailAndPassword, updateProfile }] = await Promise.all([
        import("@/lib/firebase.client"),
        import("firebase/auth"),
      ]);

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) await updateProfile(user, { displayName });
      
      // Get ID token and exchange for session cookie
      const idToken = await user.getIdToken(true);
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      
      if (!response.ok) {
        throw new Error("Session exchange failed");
      }
      
      // Always go to onboarding for new users
      window.location.href = "/onboarding";
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (e.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (e.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(e?.message || "Registration failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Create Your Account
        </h1>
        <p style={{ color: "#6b7280", fontSize: 16 }}>
          Join Fresh to get started with your team workspace
        </p>
      </div>
      
      <form onSubmit={handleRegister} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Full Name
          </label>
          <input 
            placeholder="Enter your full name" 
            type="text" 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            required 
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Email Address
          </label>
          <input 
            placeholder="Enter your email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Password
          </label>
          <input 
            placeholder="Enter password (min 6 characters)" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
            Confirm Password
          </label>
          <input 
            placeholder="Confirm your password" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            minLength={6}
            disabled={busy}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "16px",
              backgroundColor: busy ? "#f9fafb" : "white",
              boxSizing: "border-box"
            }}
          />
        </div>
        
        <button 
          disabled={busy || !email || !password || !displayName || password !== confirmPassword} 
          type="submit"
          style={{
            width: "100%",
            padding: "12px 24px",
            backgroundColor: busy || !email || !password || !displayName || password !== confirmPassword ? "#9ca3af" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: busy || !email || !password || !displayName || password !== confirmPassword ? "not-allowed" : "pointer",
            transition: "background-color 0.2s"
          }}
        >
          {busy ? "Creating Account..." : "Create Account"}
        </button>
      </form>
      
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <span style={{ color: "#6b7280", fontSize: 14 }}>Already have an account? </span>
        <a href="/login" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
          Sign in here
        </a>
      </div>
      
      {error && (
        <div style={{ 
          color: "#dc2626", 
          backgroundColor: "#fef2f2", 
          padding: "12px 16px", 
          borderRadius: "8px", 
          marginTop: "16px",
          border: "1px solid #fecaca",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
    </main>
  );
}
EOF

# Comprehensive multi-step onboarding
cat > apps/web/app/onboarding/page.tsx <<'EOF'
"use client";

import { useState } from "react";

type OnboardingStep = "welcome" | "choice" | "personal" | "organization" | "join" | "complete";
type OrgChoice = "create" | "join";

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
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [choice, setChoice] = useState<OrgChoice>("create");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    displayName: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    department: "",
    phoneNumber: "",
    timezone: "UTC"
  });
  
  const [orgInfo, setOrgInfo] = useState<OrgInfo>({
    name: "",
    displayName: "",
    description: "",
    website: "",
    industry: "technology",
    size: "11-50"
  });
  
  const [inviteCode, setInviteCode] = useState("");

  async function handleComplete() {
    setBusy(true);
    setError(null);

    try {
      const endpoint = choice === "create" ? "/api/onboarding/complete" : "/api/onboarding/join";
      const payload = choice === "create" 
        ? { 
            type: "create",
            user: personalInfo, 
            org: orgInfo 
          }
        : { 
            type: "join",
            user: personalInfo, 
            inviteCode 
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || response.statusText);
      }

      setStep("complete");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
      
    } catch (e: any) {
      setError(e?.message || "Onboarding failed");
    } finally {
      setBusy(false);
    }
  }

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: 40, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
              Welcome to Fresh! 👋
            </h1>
            <p style={{ fontSize: 18, color: "#6b7280", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
              Let's get you set up in just a few steps. This will only take a couple of minutes.
            </p>
            <button 
              onClick={() => setStep("choice")}
              style={{
                padding: "16px 32px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
            >
              Get Started
            </button>
          </div>
        );

      case "choice":
        return (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8, textAlign: "center" }}>
              How would you like to get started?
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 32, textAlign: "center" }}>
              Choose the option that best describes your situation
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
              <div 
                onClick={() => setChoice("create")}
                style={{
                  padding: 24,
                  border: choice === "create" ? "2px solid #2563eb" : "2px solid #e5e7eb",
                  borderRadius: 16,
                  cursor: "pointer",
                  backgroundColor: choice === "create" ? "#eff6ff" : "white",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16, textAlign: "center" }}>🏢</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 8, textAlign: "center" }}>
                  Create Organization
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
                  Start fresh with your own organization and invite team members
                </p>
              </div>
              
              <div 
                onClick={() => setChoice("join")}
                style={{
                  padding: 24,
                  border: choice === "join" ? "2px solid #2563eb" : "2px solid #e5e7eb",
                  borderRadius: 16,
                  cursor: "pointer",
                  backgroundColor: choice === "join" ? "#eff6ff" : "white",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16, textAlign: "center" }}>👥</div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 8, textAlign: "center" }}>
                  Join Organization
                </h3>
                <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center" }}>
                  Join an existing team using an invite code
                </p>
              </div>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <button 
                onClick={() => setStep("personal")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "personal":
        return (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8, textAlign: "center" }}>
              Tell us about yourself
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 32, textAlign: "center" }}>
              This information helps us personalize your experience
            </p>
            
            <div style={{ display: "grid", gap: 16, maxWidth: 500, margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                    First Name
                  </label>
                  <input
                    value={personalInfo.firstName}
                    onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                    placeholder="John"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                    Last Name
                  </label>
                  <input
                    value={personalInfo.lastName}
                    onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                    placeholder="Doe"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Display Name
                </label>
                <input
                  value={personalInfo.displayName}
                  onChange={(e) => setPersonalInfo({...personalInfo, displayName: e.target.value})}
                  placeholder="How you'd like to be called"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Job Title
                </label>
                <input
                  value={personalInfo.jobTitle}
                  onChange={(e) => setPersonalInfo({...personalInfo, jobTitle: e.target.value})}
                  placeholder="Software Engineer, Product Manager, etc."
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Department (Optional)
                </label>
                <input
                  value={personalInfo.department}
                  onChange={(e) => setPersonalInfo({...personalInfo, department: e.target.value})}
                  placeholder="Engineering, Sales, Marketing, etc."
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
            
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button 
                onClick={() => setStep(choice === "create" ? "organization" : "join")}
                disabled={!personalInfo.displayName || !personalInfo.firstName || !personalInfo.lastName}
                style={{
                  padding: "12px 24px",
                  backgroundColor: !personalInfo.displayName || !personalInfo.firstName || !personalInfo.lastName ? "#9ca3af" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: !personalInfo.displayName || !personalInfo.firstName || !personalInfo.lastName ? "not-allowed" : "pointer"
                }}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case "organization":
        return (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8, textAlign: "center" }}>
              Create your organization
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 32, textAlign: "center" }}>
              Set up your team's workspace
            </p>
            
            <div style={{ display: "grid", gap: 16, maxWidth: 500, margin: "0 auto" }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Organization Name *
                </label>
                <input
                  value={orgInfo.name}
                  onChange={(e) => setOrgInfo({...orgInfo, name: e.target.value})}
                  placeholder="Acme Inc, ACME Corp, etc."
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Display Name (Optional)
                </label>
                <input
                  value={orgInfo.displayName}
                  onChange={(e) => setOrgInfo({...orgInfo, displayName: e.target.value})}
                  placeholder="A friendly name for your organization"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Industry
                </label>
                <select
                  value={orgInfo.industry}
                  onChange={(e) => setOrgInfo({...orgInfo, industry: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    boxSizing: "border-box"
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
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Organization Size
                </label>
                <select
                  value={orgInfo.size}
                  onChange={(e) => setOrgInfo({...orgInfo, size: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    backgroundColor: "white",
                    boxSizing: "border-box"
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
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Description (Optional)
                </label>
                <textarea
                  value={orgInfo.description}
                  onChange={(e) => setOrgInfo({...orgInfo, description: e.target.value})}
                  placeholder="Brief description of your organization..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "16px",
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
            
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button 
                onClick={handleComplete}
                disabled={!orgInfo.name || busy}
                style={{
                  padding: "12px 24px",
                  backgroundColor: !orgInfo.name || busy ? "#9ca3af" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: !orgInfo.name || busy ? "not-allowed" : "pointer"
                }}
              >
                {busy ? "Creating Organization..." : "Create Organization"}
              </button>
            </div>
          </div>
        );

      case "join":
        return (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 8, textAlign: "center" }}>
              Join an organization
            </h2>
            <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 32, textAlign: "center" }}>
              Enter your invite code to join an existing team
            </p>
            
            <div style={{ maxWidth: 400, margin: "0 auto" }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 4 }}>
                  Invite Code *
                </label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="DEMO-123456"
                  required
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    fontSize: "18px",
                    textAlign: "center",
                    letterSpacing: "2px",
                    fontFamily: "monospace",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div style={{ marginTop: 16, padding: 16, backgroundColor: "#f3f4f6", borderRadius: 8, fontSize: 14, color: "#6b7280" }}>
                <strong>Demo Invite Code:</strong> DEMO-123456<br />
                Use this code to join the demo organization and see how Fresh works.
              </div>
            </div>
            
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button 
                onClick={handleComplete}
                disabled={!inviteCode || busy}
                style={{
                  padding: "12px 24px",
                  backgroundColor: !inviteCode || busy ? "#9ca3af" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: !inviteCode || busy ? "not-allowed" : "pointer"
                }}
              >
                {busy ? "Joining Organization..." : "Join Organization"}
              </button>
            </div>
          </div>
        );

      case "complete":
        return (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
              Welcome to Fresh!
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280", marginBottom: 32 }}>
              Your account has been set up successfully. <br />
              Redirecting you to the dashboard...
            </p>
            <div style={{
              display: "inline-block",
              width: 32,
              height: 32,
              border: "3px solid #e5e7eb",
              borderTop: "3px solid #2563eb",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 24, minHeight: "80vh", display: "flex", alignItems: "center" }}>
      <div style={{ width: "100%" }}>
        {/* Progress indicator */}
        {step !== "welcome" && step !== "complete" && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              {["choice", "personal", choice === "create" ? "organization" : "join"].map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: (step === s || 
                      (step === "organization" && s === "organization") || 
                      (step === "join" && s === "join")) ? "#2563eb" : "#e5e7eb",
                    color: (step === s || 
                      (step === "organization" && s === "organization") || 
                      (step === "join" && s === "join")) ? "white" : "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600
                  }}>
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div style={{
                      width: 48,
                      height: 2,
                      backgroundColor: "#e5e7eb",
                      margin: "0 8px"
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {renderStep()}
        
        {error && (
          <div style={{ 
            marginTop: 24,
            color: "#dc2626", 
            backgroundColor: "#fef2f2", 
            padding: "16px", 
            borderRadius: "8px", 
            border: "1px solid #fecaca",
            fontSize: "14px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
EOF

# Dashboard with comprehensive features
cat > apps/web/app/dashboard/page.tsx <<'EOF'
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function Dashboard() {
  const session = await getServerSession();
  
  if (!session?.sub) {
    return redirect("/login");
  }
  
  if (!session.onboardingComplete) {
    return redirect("/onboarding");
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 32,
        paddingBottom: 16,
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
            Welcome back, {session.displayName || "User"}! 👋
          </h1>
          <p style={{ color: "#6b7280", fontSize: 16 }}>
            {session.orgName && (
              <span>
                <strong>{session.orgName}</strong> • {session.role || "member"}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a 
            href="/api/session/logout" 
            style={{
              padding: "8px 16px",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              textDecoration: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500
            }}
          >
            Sign Out
          </a>
        </div>
      </header>

      {/* Quick Stats */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
        gap: 24, 
        marginBottom: 32 
      }}>
        <div style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
            🗓️ Today's Schedule
          </h3>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>No meetings scheduled</p>
          <a href="/calendar" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
            View Calendar →
          </a>
        </div>
        
        <div style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
            👥 Team Members
          </h3>
          <p style={{ color: "#6b7280", marginBottom: 16 }}>
            {session.role === "owner" ? "You're the organization owner" : "Member of the team"}
          </p>
          <a href="/team" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
            Manage Team →
          </a>
        </div>
        
        <div style={{
          backgroundColor: "white",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 }}>
            📊 Quick Actions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="/schedule/new" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
              + Schedule Meeting
            </a>
            <a href="/projects/new" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
              + Create Project
            </a>
            <a href="/settings" style={{ color: "#2563eb", textDecoration: "none", fontSize: 14 }}>
              ⚙️ Settings
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        backgroundColor: "white",
        padding: 24,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
          Recent Activity
        </h2>
        <div style={{ color: "#6b7280", textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <p>No recent activity yet.</p>
          <p style={{ fontSize: 14 }}>
            Start by scheduling a meeting or creating a project to see activity here.
          </p>
        </div>
      </div>
    </main>
  );
}
EOF

# API Routes for session management
cat > apps/web/app/api/session/login/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase.admin";

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";
const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || "fresh_flags";
const DAYS = Number(process.env.SESSION_COOKIE_DAYS || 5);
const EXPIRES_MS = DAYS * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

  try {
    const auth = adminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: EXPIRES_MS });

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(EXPIRES_MS / 1000),
    });

    // Set lightweight flags cookie for middleware routing
    res.cookies.set(FLAGS_COOKIE, JSON.stringify({ li: true }), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(EXPIRES_MS / 1000),
    });
    
    return res;
  } catch (error) {
    console.error("Session creation failed:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}
EOF

cat > apps/web/app/api/session/current/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";

const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || "fresh_flags";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const res = session
    ? NextResponse.json({ 
        success: true,
        loggedIn: true, 
        user: {
          id: session.sub,
          email: session.email,
          displayName: session.displayName,
          role: session.role,
          orgId: session.orgId,
          orgName: session.orgName,
          onboardingComplete: session.onboardingComplete
        }
      }, { status: 200 })
    : NextResponse.json({ success: false, loggedIn: false }, { status: 200 });

  // Update flags cookie with current session state
  const flags = session ? { 
    li: true, 
    ob: !!session.onboardingComplete 
  } : { 
    li: false 
  };
  
  res.cookies.set(FLAGS_COOKIE, JSON.stringify(flags), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
  });
  
  return res;
}
EOF

cat > apps/web/app/api/session/logout/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

const COOKIE = process.env.SESSION_COOKIE_NAME || "__session";
const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || "fresh_flags";

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  
  // Clear session cookies
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  
  response.cookies.set(FLAGS_COOKIE, JSON.stringify({ li: false }), {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  
  return response;
}
EOF

# Enhanced onboarding API routes
cat > apps/web/app/api/onboarding/complete/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { adminAuth } from "@/lib/firebase.admin";

const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || "fresh_flags";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  try {
    // For demo: bypass Express API and handle locally with Firebase
    const auth = adminAuth();
    
    // Update user's custom claims to mark onboarding as complete
    await auth.setCustomUserClaims(session.sub, {
      onboardingComplete: true,
      role: body.type === "create" ? "owner" : "member",
      displayName: body.user?.displayName,
      orgName: body.type === "create" ? body.org?.name : "Demo Organization",
      orgId: body.type === "create" ? `org_${Date.now()}` : "demo-org-id",
    });

    const res = NextResponse.json({
      success: true,
      message: "Onboarding completed",
      user: {
        id: session.sub,
        email: session.email,
        displayName: body.user?.displayName || session.displayName,
        role: body.type === "create" ? "owner" : "member"
      },
      organization: {
        id: body.type === "create" ? `org_${Date.now()}` : "demo-org-id",
        name: body.type === "create" ? body.org?.name : "Demo Organization",
        role: body.type === "create" ? "owner" : "member"
      }
    });

    // Update flags cookie to reflect onboarding completion
    res.cookies.set(FLAGS_COOKIE, JSON.stringify({ li: true, ob: true }), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ 
      error: "Onboarding failed - make sure Firebase Authentication is enabled in console" 
    }, { status: 500 });
  }
}
EOF

cat > apps/web/app/api/onboarding/join/route.ts <<'EOF'
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { adminAuth } from "@/lib/firebase.admin";

const FLAGS_COOKIE = process.env.FLAGS_COOKIE_NAME || "fresh_flags";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });

  if (!body.inviteCode) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  try {
    // Validate invite code (demo validation)
    const validCodes = ["DEMO-123456", "JOIN-123456"];
    if (!validCodes.some(code => code.toLowerCase() === body.inviteCode.toLowerCase())) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 400 });
    }

    const auth = adminAuth();
    
    // Update user's custom claims to mark onboarding as complete
    await auth.setCustomUserClaims(session.sub, {
      onboardingComplete: true,
      role: "member",
      displayName: body.user?.displayName,
      orgName: "Demo Organization",
      orgId: "demo-org-id",
    });

    const res = NextResponse.json({
      success: true,
      message: "Joined organization successfully",
      user: {
        id: session.sub,
        email: session.email,
        displayName: body.user?.displayName || session.displayName,
        role: "member"
      },
      organization: {
        id: "demo-org-id",
        name: "Demo Organization",
        role: "member"
      }
    });

    // Update flags cookie to reflect onboarding completion
    res.cookies.set(FLAGS_COOKIE, JSON.stringify({ li: true, ob: true }), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Join organization error:", error);
    return NextResponse.json({ 
      error: "Failed to join organization" 
    }, { status: 500 });
  }
}
EOF

# Enhanced middleware
cat > apps/web/middleware.ts <<'EOF'
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Public or static resources - include all auth-related pages
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    /\.[\w]+$/.test(pathname); // static files

  // NEVER intercept API
  const isAPI = pathname.startsWith("/api");
  if (isPublic || isAPI) return NextResponse.next();

  // Session cookie - use the flags cookie for routing decisions
  const flagsCookie = process.env.FLAGS_COOKIE_NAME || "fresh_flags";
  const raw = req.cookies.get(flagsCookie)?.value;
  let flags: any = null;
  try { flags = raw ? JSON.parse(raw) : null; } catch {}

  const loggedIn = !!flags?.li;
  const onboarded = !!flags?.ob;

  if (!loggedIn)
    return NextResponse.redirect(new URL("/login", req.url));

  if (loggedIn && !onboarded && !pathname.startsWith("/onboarding"))
    return NextResponse.redirect(new URL("/onboarding", req.url));

  if (loggedIn && onboarded && (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/onboarding"))
    return NextResponse.redirect(new URL("/dashboard", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|.*\\..*).*)"]
};
EOF

# PWA assets
cat > apps/web/public/manifest.webmanifest <<'EOF'
{
  "name": "Fresh - Team Scheduler",
  "short_name": "Fresh",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#111827",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
EOF

cat > apps/web/public/sw.js <<'EOF'
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('fresh-v1');
    await cache.addAll([
      '/',
      '/login',
      '/register', 
      '/onboarding',
      '/dashboard',
      '/favicon.ico',
      '/manifest.webmanifest'
    ]);
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch {
      const cache = await caches.open('fresh-v1');
      const match = await cache.match(event.request, { ignoreSearch: true });
      if (match) return match;
      return caches.match('/');
    }
  })());
});
EOF

# Development scripts
mkdir -p scripts

cat > scripts/restart-dev.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Restarting Fresh development environment..."

# Step 1: Kill existing processes
echo "Step 1: Cleaning up existing processes..."
./scripts/kill-dev-processes.sh

sleep 2

# Step 2: Start development servers
echo "Step 2: Starting development servers..."

# Start API server
echo "🟢 Starting API Server on port 3001..."
PORT=3001 pnpm --filter @services/api dev > logs/api.log 2>&1 &
API_PID=$!
echo "   PID: $API_PID, Logs: logs/api.log"

# Wait for API to be ready
echo "⏳ Waiting for API server to be ready..."
sleep 3
if curl -s http://localhost:3001/health >/dev/null; then
  echo "✅ API server is ready"
else
  echo "❌ API server failed to start"
  exit 1
fi

# Start Web server
echo "🟢 Starting Web Server on port 3000..."
pnpm --filter @apps/web dev > logs/web.log 2>&1 &
WEB_PID=$!
echo "   PID: $WEB_PID, Logs: logs/web.log"

# Wait for Web server to be ready
echo "⏳ Waiting for Web server to be ready..."
sleep 5
if curl -s http://localhost:3000 >/dev/null; then
  echo "✅ Web server is ready"
else
  echo "❌ Web server failed to start"
  exit 1
fi

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📋 Services:"
echo "   • Web:    http://localhost:3000"
echo "   • API:    http://localhost:3001"
echo "   • Health: http://localhost:3001/health"
echo ""
echo "📝 Log files:"
echo "   • API:    logs/api.log"
echo "   • Web:    logs/web.log"
echo ""
echo "🛑 To stop all servers, run: ./scripts/kill-dev-processes.sh"
EOF

cat > scripts/kill-dev-processes.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Finding development processes to kill..."

# Function to kill processes by pattern
kill_processes() {
  local pattern="$1"
  local description="$2"
  local pids
  pids=$(pgrep -f "$pattern" || true)
  if [ -n "$pids" ]; then
    echo "🔴 Killing $description processes: $pids"
    kill -TERM $pids 2>/dev/null || true
    sleep 2
    # Force kill if still running
    pids=$(pgrep -f "$pattern" || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
    fi
    echo "✅ Killed $description processes"
  else
    echo "✅ No $description processes found"
  fi
}

# Kill Next.js development processes
kill_processes "next dev" "Next.js development server"

# Kill package manager dev processes
kill_processes "pnpm.*dev" "Package manager dev scripts"

# Kill processes by port
for port in 3000 3001 3333; do
  echo "🔍 Checking for processes on port $port..."
  pids=$(lsof -ti tcp:$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "🔴 Killing process on port $port: $pids"
    kill -9 $pids 2>/dev/null || true
    echo "✅ Killed process on port $port"
  else
    echo "✅ No processes found on port $port"
  fi
done

# Kill TypeScript/Node watchers
kill_processes "tsx watch" "TypeScript/Node.js watchers"

echo ""
echo "🧹 All development processes have been cleaned up!"
echo "💡 You can now restart your development servers."
EOF

cat > scripts/dev-status.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "📊 Fresh Development Environment Status"
echo "======================================="

# Check API server
echo -n "🔧 API Server (port 3001): "
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
  echo "✅ Running"
else
  echo "❌ Not running"
fi

# Check Web server
echo -n "🌐 Web Server (port 3000): "
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo "✅ Running"
else
  echo "❌ Not running"
fi

# Check processes
echo ""
echo "🔍 Active Processes:"
echo "-------------------"
pgrep -fl "next dev|tsx watch|pnpm.*dev" || echo "No development processes found"

# Check ports
echo ""
echo "🔌 Port Usage:"
echo "-------------"
for port in 3000 3001 3333; do
  if lsof -ti tcp:$port >/dev/null 2>&1; then
    echo "Port $port: ✅ In use"
  else
    echo "Port $port: ⭕ Available"
  fi
done

# Check log files
echo ""
echo "📝 Log Files:"
echo "------------"
if [ -f logs/api.log ]; then
  echo "API log: ✅ Available ($(wc -l < logs/api.log) lines)"
else
  echo "API log: ❌ Not found"
fi

if [ -f logs/web.log ]; then
  echo "Web log: ✅ Available ($(wc -l < logs/web.log) lines)" 
else
  echo "Web log: ❌ Not found"
fi
EOF

# Make scripts executable
chmod +x scripts/*.sh

# Environment setup
cat > .env.example <<'EOF'
# Firebase Configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Admin SDK (required)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./sac.json
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# API Configuration
API_BASE_URL=http://localhost:3001

# Session Configuration (optional)
SESSION_COOKIE_NAME=__session
FLAGS_COOKIE_NAME=fresh_flags
SESSION_COOKIE_DAYS=5

# App Configuration (optional)
NEXT_PUBLIC_APP_NAME=Fresh
NODE_ENV=development
EOF

echo "==> Installing dependencies..."
pnpm install

echo "==> Approving native builds if prompted..."
pnpm approve-builds || true

echo "==> Building shared types first..."
pnpm --filter @packages/types build

echo "==> Running typecheck..."
pnpm typecheck || echo "⚠️ Some type errors found - continuing anyway"

# Create log directory
mkdir -p logs

echo ""
echo "🎉 Fresh Full Integration Setup Complete!"
echo "========================================"
echo ""
echo "📋 What's included:"
echo "  ✅ Firebase Authentication (client + admin)"
echo "  ✅ Multi-step onboarding wizard"
echo "  ✅ Role-based access control"
echo "  ✅ Comprehensive dashboard"
echo "  ✅ PWA support with service worker"
echo "  ✅ TypeScript throughout"
echo "  ✅ Development scripts and VS Code integration"
echo ""
echo "🚀 Next steps:"
echo "  1. Copy .env.example to .env.local"
echo "  2. Add your Firebase configuration to .env.local"
echo "  3. Place Firebase service account JSON as 'sac.json' in root"
echo "  4. Enable Email/Password auth in Firebase Console"
echo "  5. Run: ./scripts/restart-dev.sh"
echo ""
echo "🔗 Quick commands:"
echo "  • Start development: ./scripts/restart-dev.sh"
echo "  • Check status: ./scripts/dev-status.sh"
echo "  • Kill processes: ./scripts/kill-dev-processes.sh"
echo "  • Type check: pnpm typecheck"
echo "  • Lint: pnpm lint"
echo "  • Build: pnpm build"
echo ""
echo "🌍 Access points:"
echo "  • Web app: http://localhost:3000"
echo "  • API: http://localhost:3001"
echo "  • API health: http://localhost:3001/health"
