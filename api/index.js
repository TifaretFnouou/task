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
// בתוך ה-DELETE בשרת:
app.delete('/api/tasks', async (req, res) => {
  const { id } = req.body;
  const isUuid = String(id).includes('-');
  
  const { error } = isUuid 
    ? await supabase.from('tasks').delete().eq('id_text', id)
    : await supabase.from('tasks').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
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
  const status = is_completed === true || is_completed === 'true';

  console.log(`DEBUG: מנסה לעדכן את ID: ${id} לסטטוס: ${status}`);

  // ננסה לעדכן קודם לפי id_text (כי זה מה שאנחנו משתמשים בו)
  let { data, error } = await supabase
    .from('tasks')
    .update({ is_completed: status })
    .eq('id_text', id)
    .select();

  // אם לא מצאנו, ננסה לפי id מספרי (למקרה שזה משימה ישנה)
  // ... אחרי הניסיון הראשון עם id_text ...

// אם לא מצאנו וגם לא קיבלנו שגיאה, ננסה לפי id מספרי רק אם ה-ID הוא מספר
if (!error && (!data || data.length === 0)) {
  const numericId = parseInt(id); // ננסה להפוך למספר
  
  if (!isNaN(numericId)) { // נבדוק אם זה באמת מספר תקין
      console.log("DEBUG: מנסה לפי id מספרי:", numericId);
      ({ data, error } = await supabase
          .from('tasks')
          .update({ is_completed: status })
          .eq('id', numericId) // נשתמש במספר ולא ב-UUID
          .select());
  } else {
      console.log("DEBUG: ה-ID אינו מספר, לא ניתן לעדכן לפי id מספרי.");
  }
}

  if (error) {
    console.error('DEBUG: שגיאת DB:', error);
    return res.status(500).json({ error: error.message });
  }

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