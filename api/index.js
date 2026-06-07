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

// וודאי שהמשתנים האלו מוגדרים ב-Environment Variables ב-Render
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- חלק המשתמשים והמשימות (נשאר זהה) ---
// [הקוד שלך כאן תקין, אין צורך לשנות אותו]

// --- הגשת ה-Frontend (התיקון כאן) ---

// נתיב מוחלט לתיקיית ה-dist ב-Root של הפרויקט
const distPath = path.join(__dirname, '../dist');

// הגשת קבצים סטטיים
app.use(express.static(distPath));

// ניתוב לכל בקשה שלא מתחילה ב-/api ל-index.html (זה פותר את ה-404)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

export default app;