import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(3001, () => console.log('API listening on :3001'));
