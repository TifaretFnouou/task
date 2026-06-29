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

// Serve public assets in production (manifest/icons)
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

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
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const result = await pool.query(
      'INSERT INTO users_data (user_email, user_password, user_name) VALUES ($1, $2, $3) RETURNING *',
      [email, password, name || null]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/name', async (req, res) => {
  const { email, name } = req.body;
  const trimmedName = String(name || '').trim();
  if (!email || !trimmedName) {
    return res.status(400).json({ error: 'email and name are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users_data SET user_name = $1 WHERE user_email = $2 RETURNING *',
      [trimmedName, email]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users', async (req, res) => {
  const { email, name } = req.body;
  const trimmedName = String(name || '').trim();
  if (!email || !trimmedName) {
    return res.status(400).json({ error: 'email and name are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users_data SET user_name = $1 WHERE user_email = $2 RETURNING *',
      [trimmedName, email]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ה-Endpoints של ה-Tasks וה-Notes (במיקום הנכון!)
app.get('/api/tasks/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, user_email, task_name, is_completed FROM tasks_data WHERE user_email = $1 ORDER BY id DESC',
      [email]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { user_email, task_name } = req.body;
  if (!user_email || !task_name) {
    return res.status(400).json({ error: 'user_email and task_name are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO tasks_data (user_email, task_name, is_completed) VALUES ($1, $2, false) RETURNING id, user_email, task_name, is_completed',
      [user_email, task_name]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { is_completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks_data SET is_completed = $1 WHERE id = $2 RETURNING id, user_email, task_name, is_completed',
      [Boolean(is_completed), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks', async (req, res) => {
  const { id, is_completed } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  try {
    const result = await pool.query(
      'UPDATE tasks_data SET is_completed = $1 WHERE id = $2 RETURNING id, user_email, task_name, is_completed',
      [Boolean(is_completed), id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  try {
    const result = await pool.query('DELETE FROM tasks_data WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await pool.query(
      'SELECT id, user_email, text, created_at FROM notes_data WHERE user_email = $1 ORDER BY created_at DESC',
      [email]
    );
    res.json({ notes: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  const { id, user_email, text } = req.body;
  if (!user_email) return res.status(400).json({ error: 'user_email is required' });
  try {
    const result = await pool.query(
      'INSERT INTO notes_data (id, user_email, text) VALUES ($1, $2, $3) RETURNING id, user_email, text, created_at',
      [id || null, user_email, text || '']
    );
    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  try {
    const result = await pool.query(
      'UPDATE notes_data SET text = $1 WHERE id = $2 RETURNING id, user_email, text, created_at',
      [text || '', id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json({ note: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes', async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'id is required' });
  try {
    const result = await pool.query('DELETE FROM notes_data WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Note not found' });
    res.json({ success: true, id });
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