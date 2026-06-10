import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// חיבור ל-Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- API Endpoints ---
app.post('/api/register', async (req, res) => {
  const { email, name, password } = req.body;
  const { data, error } = await supabase.from('users').insert([{ email, name, password }]).select();
  if (error) return res.status(409).json({ error: error.message });
  res.json({ user: data[0] });
});
app.delete('/api/tasks', async (req, res) => {
  const { id } = req.body; // מקבלים את ה-ID מהגוף ולא מהנתיב
  console.log(`--- מנסה למחוק משימה עם ID: ${id} ---`);

  const { error } = await supabase
    .from('tasks')
    .delete()
    .or(`id.eq.${id},id_text.eq.${id}`);

  if (error) {
    console.error('שגיאת מחיקה:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json({ success: true });
});
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
  if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user: data });
});

app.get('/api/tasks/:email', async (req, res) => {
  const { email } = req.params;
  const { data, error } = await supabase.from('tasks').select('*').eq('user_email', email);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ tasks: data || [] });
});

app.post('/api/tasks', async (req, res) => {
  // תוספת: הוספתי את due_at לקבלת הנתונים מה-Body
  const { user_email, task_name, due_at } = req.body;
  // תוספת: הוספתי את due_at לאובייקט ה-insert
  const { data, error } = await supabase.from('tasks').insert([{ user_email, task_name, is_completed: false, due_at }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ task: data[0] });
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { is_completed } = req.body;

  // 1. המרה בטוחה לבוליאני כדי למנוע טעויות מול Supabase
  const status = is_completed === true || is_completed === 'true';

  console.log(`--- DEBUG: מנסה לעדכן משימה ID: ${id} לסטטוס: ${status} ---`);

  // 2. חיפוש כפול: גם לפי ה-id (מספרי) וגם לפי ה-id_text (UUID)
  const { data, error } = await supabase
    .from('tasks')
    .update({ is_completed: status })
    .or(`id_text.eq.${id},id.eq.${id}`)
    .select();

  // 3. טיפול בשגיאות והדפסה ללוגים
  if (error) {
    console.error('--- שגיאת Supabase מפורטת: ---');
    console.error(JSON.stringify(error, null, 2));
    return res.status(500).json({ error: error.message });
  }

  // 4. בדיקה אם בכלל נמצאה שורה לעדכון
  if (!data || data.length === 0) {
    console.log('--- אזהרה: לא נמצאה שורה לעדכון עם ה-ID הזה ---');
    return res.status(404).json({ error: 'Task not found' });
  }

  console.log('--- תוצאת עדכון (מה חזר מה-DB): ---');
  console.log(data);
  
  res.json({ success: true, updated: data });
});
// --- Production Frontend Serving ---
const distPath = path.join(process.cwd(), 'dist');

// הגשת קבצים סטטיים מהתיקייה שנוצרה ב-build
app.use(express.static(distPath));

// ניתוב מותאם אישית (Middleware) במקום app.get('*')
app.use((req, res, next) => {
  // אם הבקשה מיועדת ל-API, דלג על הטיפול הזה
  if (req.path.startsWith('/api')) {
    return next();
  }
  // לכל בקשה אחרת, הגש את ה-index.html של ה-React
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

export default app;