import { randomUUID } from "node:crypto";
import { Organization, UserProfile } from "@packages/types/onboarding";

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
