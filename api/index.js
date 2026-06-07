import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

// חיבור ל-Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// פונקציית עזר להרשמה (דוגמה לאיך זה נראה עם Supabase)
app.post('/api/register', async (req, res) => {
  const { email, name, password } = req.body;
  
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, name, password }])
    .select();

  if (error) return res.status(409).json({ error: 'Email already registered or error occurred.' });
  return res.json({ user: data[0] });
});

// פונקציית התחברות (דוגמה)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !data) return res.status(401).json({ error: 'Invalid credentials' });
  return res.json({ user: data });
});

// הגשת קבצים סטטיים (React)
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