import { randomUUID } from "node:crypto";

type Org = { id: string; name: string; taxId: string };
type User = {
  id: string;
  email: string;
  displayName: string;
  password: string;
  role: "owner" | "member";
  orgId: string;
  ssn?: string;
  address?: string;
  withholdingAllowances?: number;
};

export const orgs = new Map<string, Org>();
export const users = new Map<string, User>();

// Demo register (create or join org)
export function registerUser(data: any): { user: User; org: Org } {
  let org: Org;
  if (data.orgChoice === "create") {
    org = { id: randomUUID(), name: data.org.name, taxId: data.org.taxId };
    orgs.set(org.id, org);
  } else {
    const existing = orgs.get(data.org.id);
    if (!existing) throw new Error("Org not found");
    org = existing;
  }

  const user: User = {
    id: randomUUID(),
    email: data.email,
    displayName: data.displayName,
    password: data.password,
    role: data.orgChoice === "create" ? "owner" : "member",
    orgId: org.id,
    ssn: data.w4?.ssn,
    address: data.w4?.address,
    withholdingAllowances: data.w4?.withholdingAllowances
  };
  users.set(user.id, user);

  return { user, org };
}

// Demo forgot-password
export function forgotPassword(email: string): string {
  const user = Array.from(users.values()).find(u => u.email === email);
  if (!user) throw new Error("User not found");
  return `Password reset link sent to ${email} (demo only).`;
}
