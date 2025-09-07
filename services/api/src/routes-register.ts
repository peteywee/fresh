import { Router } from "express";
import { randomUUID } from "node:crypto";
import { RegistrationRequest, RegistrationResponse, ForgotPasswordRequest, ForgotPasswordResponse } from "../../../packages/types/dist/register.js";

const router = Router();
const orgs = new Map<string, any>();
const users = new Map<string, any>();

router.post("/api/register", (req, res) => {
  const parsed = RegistrationRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid registration", details: parsed.error.flatten() });
  }
  const data = parsed.data;

  let orgId = data.org?.id;
  if (data.orgChoice === "create") {
    orgId = randomUUID();
    orgs.set(orgId, { id: orgId, name: data.org?.name, taxId: data.org?.taxId });
  } else if (data.orgChoice === "join" && orgId && orgs.has(orgId)) {
    // join existing org
  } else {
    return res.status(400).json({ error: "Invalid org choice" });
  }

  const userId = randomUUID();
  users.set(userId, {
    id: userId,
    email: data.email,
    password: data.password,
    displayName: data.displayName,
    role: "user",
    orgId,
    w4: data.w4
  });

  const resp = RegistrationResponse.parse({ userId, orgId });
  return res.status(201).json(resp);
});

router.post("/api/forgot-password", (req, res) => {
  const parsed = ForgotPasswordRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const resp = ForgotPasswordResponse.parse({
    ok: true,
    message: `Password reset link would be sent to ${parsed.data.email}`
  });
  return res.status(200).json(resp);
});

export default router;
