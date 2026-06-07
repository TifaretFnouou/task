import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// הגדרת משתני נתיב לעבודה תקינה ב-Render
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// יצירת החיבור ל-Supabase (וודאי שהמשתנים מוגדרים ב-Environment Variables ב-Render)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- חלק המשתמשים ---

app.post('/api/register', async (req, res) => {
  const { email, name, password } = req.body;
  const { data, error } = await supabase.from('users').insert([{ email, name, password }]).select();
  if (error) return res.status(409).json({ error: error.message });
  res.json({ user: data[0] });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
  if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user: data });
});

// --- חלק המשימות (Tasks) ---

// קבלת כל המשימות של משתמש לפי אימייל
app.get('/api/tasks/:email', async (req, res) => {
  const { email } = req.params;
  const { data, error } = await supabase.from('tasks').select('*').eq('user_email', email);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tasks: data || [] });
});

// הוספת משימה חדשה
app.post('/api/tasks', async (req, res) => {
  const { user_email, task_name } = req.body;
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ user_email, task_name, is_completed: false }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data[0] });
});

// עדכון מצב משימה (סיום משימה)
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { is_completed } = req.body;
  const { error } = await supabase.from('tasks').update({ is_completed }).eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// --- הגשת ה-Frontend ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// ניתוב לכל בקשה שלא מתחילה ב-/api ל-index.html
app.get('/*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

export default app;