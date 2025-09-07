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

// Root probes
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "scheduler-api" });
});
app.get("/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// API probe aliases (so /api/health and /api/status are valid)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "scheduler-api" });
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
app.get("/hierarchy/echo", (req, res) => {
  const hierarchy = {
    runId: req.header("x-run-id") || "run-unknown",
    user: req.header("x-user") || "anonymous",
    object: req.header("x-obj") || "unspecified",
    task: req.header("x-task") || "unspecified",
    step: req.header("x-step") || "unspecified",
  };
  res.status(200).json({ ok: true, hierarchy, headers: req.headers });
});

// Auth API
app.use("/api", authRouter);

// Start
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => {
  log.info({ port: PORT }, "scheduler-api listening");
});
