import pg from 'pg';
import 'dotenv/config'; // וודא שמותקנת חבילת dotenv

const { Pool } = pg;

const pool = new Pool({
  connectionString: globalThis.process?.env?.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function test() {
  try {
    console.log("מנסה להתחבר לבסיס הנתונים...");
    const res = await pool.query('SELECT NOW()');
    console.log("חיבור הצליח! הזמן בשרת הוא:", res.rows[0].now);
    
    console.log("בודק אם טבלת users_data קיימת...");
    await pool.query('SELECT * FROM users_data LIMIT 1');
    console.log("טבלת users_data נמצאה!");

    console.log("בודק אם טבלת tasks_data קיימת...");
    await pool.query('SELECT * FROM tasks_data LIMIT 1');
    console.log("טבלת tasks_data נמצאה!");
    
    globalThis.process?.exit(0);
  } catch (err) {
    console.error("שגיאה בבדיקה:", err.message);
    globalThis.process?.exit(1);
  }
}

test();