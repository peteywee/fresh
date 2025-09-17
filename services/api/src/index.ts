import express from 'express';

import { createAuthRouter, seedData } from './auth.js';

// Named shared stores exported for route modules to consume
export const orgs: Map<string, any> = new Map();
export const users: Map<string, any> = new Map();

// Initialize seed data after stores are created
seedData(users, orgs);

const log = console;
const app = express();

// Trust reverse proxy (e.g., when behind Nginx / Cloud Run)
app.set('trust proxy', true);

// Basic CORS - simple setup for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// JSON body parsing with sane limits
app.use(express.json({ limit: '256kb' }));

// Root endpoint
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'fresh-api',
    version: '0.1.0',
    description: 'Fresh Scheduler API - handles auth, onboarding, and project management',
  });
});

// Health checks
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'fresh-api', timestamp: new Date().toISOString() });
});

app.get('/status', (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// API probe aliases
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'fresh-api' });
});

app.get('/api/status', (_req, res) => {
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Diagnostics
app.get('/__/probe', (req, res) => {
  const runId = req.header('x-run-id') || null;
  res.status(200).json({ ok: true, runId, probedAt: new Date().toISOString() });
});

// Auth API
app.use('/api', createAuthRouter(users, orgs));

// Error handling
app.use((err: any, req: any, res: any, _next: any) => {
  const path = req?.path;
  const msg = err?.message || 'error';
  console.error('[api-error]', { path, msg });
  res.status(500).json({ error: 'Internal server error', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path, timestamp: new Date().toISOString() });
});

// Start server
// Default development port standardized to 3333 (docs & tests rely on this)
const PORT = Number(process.env.PORT || 3333);
app.listen(PORT, () => {
  console.log(`Fresh API listening on port ${PORT}`);
});
