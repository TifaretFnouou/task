import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1. Register
app.post('/api/register', async (req, res) => {
  const { email, name, password } = req.body;
  const { data, error } = await supabase.from('users').insert([{ email, name, password }]).select();
  if (error) return res.status(409).json({ error: 'Email already registered.' });
  res.json({ user: data[0] });
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
  if (error || !data) return res.status(401).json({ error: 'Invalid email or password.' });
  res.json({ user: data });
});

// 3. Forgot Password
app.post('/api/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  const { data, error } = await supabase.from('users').update({ password: newPassword }).eq('email', email).select();
  if (error || !data || data.length === 0) return res.status(404).json({ error: 'Email not found.' });
  res.json({ message: 'Password updated successfully.' });
});

// 4. Get Users
app.get('/api/users', async (req, res) => {
  const { data, error } = await supabase.from('users').select('id, email, name');
  res.json({ users: data || [] });
});

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