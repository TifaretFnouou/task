import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import crypto from 'crypto';

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

const SECURITY_QUESTIONS = {
  motherMaiden: "What is your mother's maiden name?",
  motherBirthCity: 'In which city was your mother born?',
  favoriteMovie: 'What is your favorite movie?',
  firstTeacher: 'What was the first name of your first teacher?',
  childhoodFriend: 'What is the first name of your childhood best friend?',
  firstPhone: 'What was the last 4 digits of your first phone number?',
  favoriteBook: 'What is your favorite book?',
  firstJobCity: 'In which city did you have your first job?',
};

function normalizeAnswer(value) {
  return String(value || '').trim().toLowerCase();
}

function hashAnswer(value) {
  return crypto.createHash('sha256').update(normalizeAnswer(value)).digest('hex');
}

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
  const { email, password, name, securityQuestionKey, securityAnswer } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedQuestionKey = String(securityQuestionKey || '').trim();
  const normalizedSecurityAnswer = String(securityAnswer || '').trim();

  console.log('[register] body keys:', Object.keys(req.body || {}));
  console.log('[register] securityQuestionKey:', normalizedQuestionKey);
  console.log('[register] securityAnswer length:', normalizedSecurityAnswer.length);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  if (!normalizedQuestionKey || !SECURITY_QUESTIONS[normalizedQuestionKey]) {
    return res.status(400).json({ error: 'Valid security question is required' });
  }

  if (!normalizedSecurityAnswer) {
    return res.status(400).json({ error: 'securityAnswer is required' });
  }

  try {
    const existing = await pool.query(
      'SELECT user_email FROM users_data WHERE user_email::text ILIKE $1 LIMIT 1',
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const insertValues = [normalizedEmail, password, name || null, normalizedQuestionKey, hashAnswer(normalizedSecurityAnswer)];
    console.log('[register] insertValues meta:', {
      email: insertValues[0],
      hasPassword: Boolean(insertValues[1]),
      name: insertValues[2],
      questionKey: insertValues[3],
      answerHashPrefix: String(insertValues[4]).slice(0, 8),
    });

    const result = await pool.query(
      'INSERT INTO users_data (user_email, user_password, user_name, security_question_key, security_answer) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      insertValues
    );

    console.log('[register] inserted security fields:', {
      security_question_key: result.rows?.[0]?.security_question_key,
      security_answer_present: Boolean(result.rows?.[0]?.security_answer),
    });

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forgot-password/question', async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'email is required' });
  }

  try {
    const result = await pool.query(
      'SELECT security_question_key FROM users_data WHERE user_email::text ILIKE $1 LIMIT 1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const questionKey = result.rows[0].security_question_key;
    if (!questionKey || !SECURITY_QUESTIONS[questionKey]) {
      return res.status(400).json({ error: 'Security question is not configured for this user' });
    }

    return res.json({ questionKey, questionText: SECURITY_QUESTIONS[questionKey] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  const { email, newPassword, securityAnswer } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(newPassword || '');
  const normalizedSecurityAnswer = String(securityAnswer || '').trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedSecurityAnswer) {
    return res.status(400).json({ error: 'email, securityAnswer and newPassword are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT user_email, security_answer FROM users_data WHERE user_email::text ILIKE $1 LIMIT 1',
      [normalizedEmail]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const savedAnswer = String(existing.rows[0].security_answer || '');
    const isLegacyPlain = savedAnswer && !/^[a-f0-9]{64}$/i.test(savedAnswer);
    const incomingHash = hashAnswer(normalizedSecurityAnswer);
    const isAnswerValid = isLegacyPlain
      ? normalizeAnswer(savedAnswer) === normalizeAnswer(normalizedSecurityAnswer)
      : savedAnswer === incomingHash;

    if (!isAnswerValid) {
      return res.status(401).json({ error: 'Invalid security answer' });
    }

    await pool.query(
      'UPDATE users_data SET user_password = $1, security_answer = $2 WHERE user_email::text ILIKE $3',
      [normalizedPassword, incomingHash, normalizedEmail]
    );

    res.json({ success: true });
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