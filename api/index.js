import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import path from 'path' // הוספה
import { fileURLToPath } from 'url' // הוספה

const __dirname = path.dirname(fileURLToPath(import.meta.url)) // הוספה
const app = express()
app.use(cors())
app.use(express.json())

const db = new Database('database.db')

// ... (כאן כל ה-db.exec וכל ה-app.post שלך נשארים אותו דבר) ...

// --- כאן השינוי הקריטי ---
// הגשת הקבצים הסטטיים מהתיקייה של ה-Build (dist)
app.use(express.static(path.join(__dirname, '../dist')))

// לכל בקשה אחרת (שלא מתחילה ב-/api), נחזיר את index.html של ה-React
app.get('/*', (req, res) => { // הוספתי / לפני הכוכבית
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});
// --------------------------

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

export default app;