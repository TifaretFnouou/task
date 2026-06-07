import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

// יצירת החיבור ל-Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. Register - עם לוגים לבדיקת שגיאות
app.post('/api/register', async (req, res) => {
  const { email, name, password } = req.body;
  console.log("Attempting to register:", email);
  
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, name, password }])
    .select();

  if (error) {
    console.error("Registration Error details:", error);
    return res.status(409).json({ error: error.message });
  }
  res.json({ user: data[0] });
});

// 2. Login - עם לוגים לבדיקת שגיאות
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("Attempting to login:", email);
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error) {
    console.error("Login Error details:", error);
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  res.json({ user: data });
});

// 3. Forgot Password
app.post('/api/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  const { data, error } = await supabase
    .from('users')
    .update({ password: newPassword })
    .eq('email', email)
    .select();

  if (error || !data || data.length === 0) {
    console.error("Forgot Password Error:", error);
    return res.status(404).json({ error: 'Email not found.' });
  }
  res.json({ message: 'Password updated successfully.' });
});

// 4. Get Users
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('id, email, name');
  if (error) console.error("Get Users Error:", error);
  res.json({ users: data || [] });
});

// הגשת קבצי ה-Frontend
app.use(express.static(path.join(__dirname, '../dist')));
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    next();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

export default app;