import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';

const { Pool } = pg;

const DATABASE_URL =
  globalThis.process?.env?.DATABASE_URL ||
  "postgresql://neondb_owner:npg_R0CEPg8FVDlX@ep-floral-bird-aiowohzr.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";

const COMMIT_SHA = globalThis.process?.env?.RENDER_GIT_COMMIT || globalThis.process?.env?.COMMIT_SHA || 'local-dev';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


const app = express();
app.use(cors({
  origin: '*', // מאפשר גישה מכל מקור
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));app.use(express.json());

// --- API Endpoints ---

// Login - מתוקן עם שמות העמודות הנכונים
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // נדפיס מה הגיע מהדפדפן
  console.log("DEBUG: Incoming request body:", req.body);

  try {
    // נדפיס מה אנחנו מחפשים במסד הנתונים
    console.log("DEBUG: Querying DB for:", { email, password });
    
    const result = await pool.query(
      'SELECT * FROM users_data WHERE user_email = $1 AND user_password = $2', 
      [email, password]
    );

    console.log("DEBUG: Query result count:", result.rows.length);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (err) {
    // נדפיס את השגיאה המדויקת מה-PostgreSQL לטרמינל
    console.error("DATABASE ERROR DETAILS:", err);
    res.status(500).json({ error: err.message });
  }
});
// Register - מומלץ להוסיף אם עדיין אין
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
   // במקום 'INSERT INTO users...'
const result = await pool.query(
  'INSERT INTO users_data (user_email, user_password) VALUES ($1, $2) RETURNING *',
  [email, password]
);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("שגיאת Register:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'email and newPassword are required' })
  }

  try {
    const result = await pool.query(
      'UPDATE users_data SET user_password = $1 WHERE user_email = $2 RETURNING user_email',
      [newPassword, email],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Forgot password error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/health', async (_req, res) => {
  try {
    const db = await pool.query('SELECT NOW() AS now');
    res.json({
      ok: true,
      service: 'task-4559-api',
      commit: COMMIT_SHA,
      db: 'connected',
      now: db.rows?.[0]?.now || null,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      service: 'task-4559-api',
      commit: COMMIT_SHA,
      db: 'disconnected',
      error: err.message,
    });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT user_email FROM users_data ORDER BY user_email ASC')
    res.json({ users: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/tasks/:email', async (req, res) => {
  const { email } = req.params
  try {
    const result = await pool.query(
      'SELECT id, user_email, task_name, is_completed FROM tasks_data WHERE user_email = $1 ORDER BY id DESC',
      [email],
    )
    res.json({ tasks: result.rows })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/tasks', async (req, res) => {
  const { user_email, task_name } = req.body
  if (!user_email || !task_name) {
    return res.status(400).json({ error: 'user_email and task_name are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks_data (user_email, task_name, is_completed)
       VALUES ($1, $2, false)
       RETURNING id, user_email, task_name, is_completed`,
      [user_email, task_name],
    )
    res.status(201).json({ task: result.rows[0] })
  } catch (err) {
    console.error('Create task error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params
  const { is_completed } = req.body

  if (typeof is_completed !== 'boolean') {
    return res.status(400).json({ error: 'is_completed must be boolean' })
  }

<<<<<<< HEAD
  try {
    const result = await pool.query(
      `UPDATE tasks_data
       SET is_completed = $1
       WHERE id::text = $2
       RETURNING id, user_email, task_name, is_completed`,
      [is_completed, id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json({ task: result.rows[0] })
  } catch (err) {
    console.error('Update task error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/tasks', async (req, res) => {
  const { id } = req.body
  if (!id) {
    return res.status(400).json({ error: 'id is required' })
  }

  try {
    const result = await pool.query(
      'DELETE FROM tasks_data WHERE id::text = $1 RETURNING id',
      [id],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json({ success: true, deleted: result.rows[0] })
  } catch (err) {
    console.error('Delete task error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

=======
  console.log('DEBUG: תוצאת עדכון סופית:', data);
  res.json({ success: true, updated: data });
});// שליפת כל ההערות של משתמש מ-Supabase
app.get('/api/notes/:email', async (req, res) => {
  const { email } = req.params;
  const { data, error } = await supabase.from('notes').select('*').eq('user_email', email);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ notes: data || [] });
});

// יצירת הערה חדשה ב-Supabase
app.post('/api/notes', async (req, res) => {
  const { user_email, text, id } = req.body;
  
  // בדיקה לפני שליחה
  if (!id || !user_email) {
    return res.status(400).json({ error: "Missing required fields: id or user_email" });
  }

  console.log("DEBUG: מנסה לשלוח ל-Supabase:", { id, user_email, text });
  
  const { data, error } = await supabase.from('notes').insert([{ id, user_email, text }]).select();
  
  if (error) {
    console.error("DEBUG: שגיאת Supabase חמורה:", error); // זה יופיע ב-Logs של Render
    return res.status(500).json({ error: error.message });
  }
  res.json({ note: data[0] });
});
// מחיקת הערה מ-Supabase
app.delete('/api/notes/:id', async (req, res) => {
  const { id } = req.params; // שיניתי ל-params כדי שיהיה עקבי עם המשימות
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// בונוס: הוספת עדכון הערה (חשוב מאוד!)
app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const { error } = await supabase.from('notes').update({ text }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
>>>>>>> 34165093750e05146caffb2ae9b523eddce6daf7
// --- Production Frontend Serving ---
const distPath = path.join(globalThis.process?.cwd?.() || '.', 'dist');
app.use(express.static(distPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = globalThis.process?.env?.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port} | commit=${COMMIT_SHA}`);
});
