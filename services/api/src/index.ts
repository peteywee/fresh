import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  User,
  Organization,
  OnboardingResponse
} from "../../../packages/types/src/index.js";

// === In-memory persistence ===
const orgs = new Map<string, z.infer<typeof Organization>>();
const users = new Map<string, z.infer<typeof User>>();
const resetTokens = new Map<string, string>();

// --- Register ---
app.post("/api/register", (req, res) => {
  const body = req.body as any;

  // Basic schema: create new org + owner user
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().min(1),
    orgChoice: z.enum(["create", "join"]),
    org: z
      .object({
        name: z.string().min(2),
        taxId: z.string().regex(/^\d{2}-\d{7}$/)
      })
      .optional(),
    orgId: z.string().uuid().optional(),
    w4: z
      .object({
        ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/),
        address: z.string(),
        withholdingAllowances: z.number().min(0)
      })
      .optional()
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const data = parsed.data;
  let orgId: string;

  if (data.orgChoice === "create" && data.org) {
    orgId = randomUUID();
    const org = {
      id: orgId,
      name: data.org.name,
      taxId: data.org.taxId,
      createdAt: new Date().toISOString()
    };
    orgs.set(orgId, org);
  } else if (data.orgChoice === "join" && data.orgId && orgs.has(data.orgId)) {
    orgId = data.orgId;
  } else {
    return res.status(400).json({ error: "Invalid org choice" });
  }

  const userId = randomUUID();
  const user = {
    id: userId,
    email: data.email,
    displayName: data.displayName,
    orgId,
    role: "owner" as const,
    i9: data.w4
  };
  users.set(userId, user);

  const resp: z.infer<typeof OnboardingResponse> = {
    user,
    org: orgs.get(orgId)!
  };
  return res.status(201).json(resp);
});

// --- Forgot Password ---
app.post("/api/forgot-password", (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email" });
  }

  const { email } = parsed.data;
  const user = Array.from(users.values()).find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const token = randomUUID();
  resetTokens.set(token, user.id);
  return res.json({
    message: "Password reset requested. (Demo only — not emailed)",
    resetToken: token
  });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
