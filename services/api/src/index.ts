import express from "express";
import cors from "cors";
import { orgs, users } from "./seed.js";

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
