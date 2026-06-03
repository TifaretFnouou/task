const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const isVercel = process.env.VERCEL === '1';

// ייבוא הספריה הנכונה
const sqlite3 = isVercel ? require('@libsql/sqlite3') : require('sqlite3');

// הגדרת נתיב מסד הנתונים
const dbPath = isVercel ? process.env.TURSO_DATABASE_URL : path.join(__dirname, 'app.db');

// יצירת החיבור
const db = new sqlite3.Database(dbPath, isVercel ? { authToken: process.env.TURSO_AUTH_TOKEN } : null, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    console.log(isVercel ? 'Connected to Turso Cloud Database' : `SQLite connected locally at ${dbPath}`);
  }
});

// פה יבוא כל שאר הקוד שלך (db.serialize, app.post, וכו')...
// וודאי שהקוד המקורי שלך מתחיל ישר אחרי השורה הזו.