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

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({ 
    name: "fresh-api",
    version: "0.1.0",
    description: "Fresh Scheduler API - handles auth, onboarding, and project management"
  });
});

// Health checks
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "fresh-api", timestamp: new Date().toISOString() });
});

app.get("/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development", 
    time: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API probe aliases
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "fresh-api" });
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

// Auth API
app.use("/api", authRouter);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  log.error(err, "API Error");
  res.status(500).json({ error: "Internal server error", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path, timestamp: new Date().toISOString() });
});

// Start server
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  log.info({ port: PORT }, "Fresh API listening");
});
