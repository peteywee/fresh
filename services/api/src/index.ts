import express from "express";
import cors from "cors";
import { pino } from "pino";
import { randomUUID } from "node:crypto";
import { OnboardingRequest, OnboardingResponse, Organization, User } from "@packages/types";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

const log = pino({ level: process.env.LOG_LEVEL || "info" });

// Root status endpoint (helps browsers and curl avoid "Cannot GET /")
app.get("/", (_req, res) => {
  res.json({ ok: true, endpoints: ["/health", "/api/onboarding/complete"] });
});

// In-memory "db" (replace later with Postgres/Firestore)
const orgs = new Map<string, z.infer<typeof Organization>>();
const users = new Map<string, z.infer<typeof User>>();

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/onboarding/complete", (req, res) => {
  const parsed = OnboardingRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }
  const { user: u, org: o } = parsed.data;

  const orgId = randomUUID();
  const userId = randomUUID();
  const now = new Date().toISOString();

  const org = {
    id: orgId,
    name: o.name,
    createdAt: now
  };
  orgs.set(orgId, org);

  const user = {
    id: userId,
    email: u.email,
    displayName: u.displayName,
    orgId,
    role: "owner" as const
  };
  users.set(userId, user);

  const resp: z.infer<typeof OnboardingResponse> = { user, org };
  return res.status(201).json(resp);
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port, () => {
  log.info({ port }, `scheduler-api listening`);
});
