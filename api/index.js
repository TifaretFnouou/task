import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_R0CEPg8FVDlX@ep-floral-bird-aiowohzr.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const COMMIT_SHA = process.env.RENDER_GIT_COMMIT || 'local-dev';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(cors());
app.use(express.json());

// --- API Endpoints (PostgreSQL) ---

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users_data WHERE user_email = $1 AND user_password = $2', [email, password]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('INSERT INTO users_data (user_email, user_password) VALUES ($1, $2) RETURNING *', [email, password]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ... (כאן תמשיך עם שאר ה-Endpoints של ה-Tasks שלך) ...

// --- Production Frontend Serving ---
// --- Production Frontend Serving ---
// --- Production Frontend Serving ---
// --- Production Frontend Serving ---
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// נשתמש בנתיב שתופס הכל בלי סימנים מיוחדים שמרגיזים את הספריה
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next(); // תמשיך לטיפול של ה-API
  }
  res.sendFile(path.join(distPath, 'index.html'));
});