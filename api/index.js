import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';

const app = express();
app.use(cors());
app.use(express.json());

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

app.post('/api/register', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');
  if (!email || !name || password.length < 4) return res.status(400).json({ error: 'Invalid input' });
  try {
    await db.execute({ sql: 'INSERT INTO users(email, name, password) VALUES(?, ?, ?)', args: [email, name, password] });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  try {
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
    const row = result.rows[0];
    if (!row || row.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ user: { id: row.id, email: row.email, name: row.name } });
  } catch (err) {
    console.error("DEBUG_ERROR:", err.message);
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

export default app;
