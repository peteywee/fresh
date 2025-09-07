#!/usr/bin/env bash
set -euo pipefail

echo "==> [WT-001b] Expanding login + onboarding with seeded org and users..."

# --- Types ---
mkdir -p packages/types/src

cat > packages/types/src/onboarding.ts <<'EOF'
import { z } from "zod";

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const Organization = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  taxId: z.string().regex(/^\d{2}-\d{7}$/, "Must match format: 12-3456789")
});
export type Organization = z.infer<typeof Organization>;

export const I9Info = z.object({
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN format: 123-45-6789"),
  citizenshipStatus: z.enum(["citizen", "permanent_resident", "authorized_worker"])
});
export type I9Info = z.infer<typeof I9Info>;

export const UserProfile = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
  orgId: z.string().uuid().optional(),
  i9: I9Info.optional()
});
export type UserProfile = z.infer<typeof UserProfile>;

export const OnboardingRequest = z.object({
  user: UserProfile.omit({ id: true, orgId: true }),
  org: Organization.omit({ id: true })
});
export type OnboardingRequest = z.infer<typeof OnboardingRequest>;
EOF

# --- Seed data ---
mkdir -p services/api/src

cat > services/api/src/seed.ts <<'EOF'
import { randomUUID } from "node:crypto";
import { Organization, UserProfile } from "@packages/types/src/onboarding";

export const orgs = new Map<string, Organization>();
export const users = new Map<string, UserProfile>();

// Demo org
const orgId = randomUUID();
const acme: Organization = {
  id: orgId,
  name: "Acme, Inc.",
  taxId: "12-3456789"
};
orgs.set(orgId, acme);

// Owner user
const janeId = randomUUID();
const jane: UserProfile = {
  id: janeId,
  displayName: "Jane Doe",
  email: "jane@acme.com",
  role: "owner",
  orgId,
  i9: {
    ssn: "123-45-6789",
    citizenshipStatus: "citizen"
  }
};
users.set(janeId, jane);

// Member user
const johnId = randomUUID();
const john: UserProfile = {
  id: johnId,
  displayName: "John Smith",
  email: "john@acme.com",
  role: "member",
  orgId,
  i9: {
    ssn: "987-65-4321",
    citizenshipStatus: "authorized_worker"
  }
};
users.set(johnId, john);

console.log("[seed] Loaded demo org + users:", { org: acme, users: [jane, john] });
EOF

# --- API with seed integration ---
cat > services/api/src/index.ts <<'EOF'
import express from "express";
import cors from "cors";
import { orgs, users } from "./seed";

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Seed status (debug endpoint)
app.get("/seed-status", (_req, res) => {
  res.json({
    orgs: Array.from(orgs.values()),
    users: Array.from(users.values())
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
EOF

echo "==> Done. Run pnpm install, then restart API service."