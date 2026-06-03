import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const isVercel = process.env.VERCEL === '1';

// חיבור למסד הנתונים
let db;
if (isVercel) {
  // חיבור לענן Turso
  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  console.log('Connected to Turso Cloud Database');
} else {
  // חיבור לקובץ מקומי
  const dbPath = path.join(__dirname, 'app.db');
  db = new sqlite3.Database(dbPath);
  console.log(`SQLite connected locally at ${dbPath}`);
  
  // יצירת טבלאות בחיבור מקומי בלבד
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

app.post('/api/register', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');

  if (!email || !name || password.length < 4) return res.status(400).json({ error: 'Invalid input' });

  try {
    if (isVercel) {
      await db.execute({ sql: 'INSERT INTO users(email, name, password) VALUES(?, ?, ?)', args: [email, name, password] });
    } else {
      db.run('INSERT INTO users(email, name, password) VALUES(?, ?, ?)', [email, name, password]);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  try {
    let row;
    if (isVercel) {
      const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
      row = result.rows[0];
    } else {
      row = await new Promise((resolve) => db.get('SELECT * FROM users WHERE email = ?', [email], (_, r) => resolve(r)));
    }

    if (!row || row.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    return res.json({ user: { id: row.id, email: row.email, name: row.name } });
  } catch (err) {
    return res.status(500).json({ error: 'Login failed' });
  }
});

if (!isVercel) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;
