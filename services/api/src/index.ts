import express from "express";
import cors from "cors";
import pino from "pino";

const log = pino({ level: process.env.LOG_LEVEL || "info" });
const app = express();
app.use(cors());
app.use(express.json());

// Liveness
app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "scheduler-api" });
});

// Extended status
app.get("/status", (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});

// Probe must be TRUE and show a runId (from header)
app.get("/__/probe", (req, res) => {
  const runId = req.header("x-run-id") || null;
  res.status(200).json({ ok: true, runId, probedAt: new Date().toISOString() });
});

// Echo must include a hierarchy object (driven by headers)
app.get("/hierarchy/echo", (req, res) => {
  const hierarchy = {
    runId: req.header("x-run-id") || "run-unknown",
    user: req.header("x-user") || "anonymous",
    object: req.header("x-obj") || "unspecified",
    task: req.header("x-task") || "unspecified",
    step: req.header("x-step") || "unspecified"
  };
  res.status(200).json({
    ok: true,
    hierarchy,
    headers: req.headers
  });
});

// Start server
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => {
  log.info({ port: PORT }, "scheduler-api listening");
});
