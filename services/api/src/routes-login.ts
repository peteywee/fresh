import { Router } from "express";
import { LoginRequest, LoginResponse } from "../../../packages/types/dist/login.js";
import { demoUsers } from "./seed.js";

const router = Router();

router.post("/api/login", (req, res) => {
  const parsed = LoginRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = demoUsers.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const resp = LoginResponse.parse({
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    role: user.role
  });

  return res.status(200).json(resp);
});

export default router;
