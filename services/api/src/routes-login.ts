import { Router } from "express";
import {
  LoginRequest,
  LoginResponse,
} from "../../../packages/types/dist/login.js";
import { demoUsers } from "./seed.js";
import { users as registeredUsers } from "./index.js";

const router = Router();

router.post("/api/login", (req, res) => {
  const parsed = LoginRequest.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  // check registered users map first (users created via /api/register)
  let user = null as any;
  for (const [, u] of registeredUsers) {
    const uu = u as any;
    if (uu.email === email && uu.password === password) {
      user = uu;
      break;
    }
  }
  // fall back to demo users
  if (!user) {
    user =
      demoUsers.find((u) => u.email === email && u.password === password) ??
      null;
  }
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const resp = LoginResponse.parse({
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
  });

  return res.status(200).json(resp);
});

export default router;
