import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_R0CEPg8FVDlX@ep-floral-bird-aiowohzr.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
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

// ה-Endpoints של ה-Tasks וה-Notes (במיקום הנכון!)
app.get('/api/tasks/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_email = $1', [email]);
    res.json({ tasks: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query('SELECT * FROM notes WHERE user_email = $1', [email]);
    res.json({ notes: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Production Frontend Serving ---
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});