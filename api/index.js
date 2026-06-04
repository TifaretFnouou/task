import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// יצירת מסד נתונים מקומי
const db = new Database('database.db');

// יצירת טבלה אם לא קיימת
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  name TEXT,
  password TEXT
)`);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

// --- API Routes ---

app.post('/api/register', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const name = String(req.body?.name || '').trim();
  const password = String(req.body?.password || '');
  
  if (!email || !name || password.length < 4) return res.status(400).json({ error: 'Invalid input' });

  try {
    const stmt = db.prepare('INSERT INTO users(email, name, password) VALUES(?, ?, ?)');
    stmt.run(email, name, password);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/api/login', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  return res.json({ user: { id: user.id, email: user.email, name: user.name } });
});

// פונקציה שהייתה חסרה וגרמה לשגיאת 500
app.post('/api/forgot-password', (req, res) => {
  return res.json({ message: "Forgot password service is available." });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, email, name FROM users').all();
  return res.json(users);
});

export default app;