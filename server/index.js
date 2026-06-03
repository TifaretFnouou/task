import express from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

const isVercel = process.env.VERCEL === '1'
const sqlite3 = isVercel ? require('@libsql/sqlite3') : require('sqlite3');
const dbPath = isVercel ? process.env.TURSO_DATABASE_URL : path.join(__dirname, 'app.db');

const db = new sqlite3.Database(dbPath, isVercel ? { authToken: process.env.TURSO_AUTH_TOKEN } : null, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
  } else {
    console.log(isVercel ? 'Connected to Turso Cloud Database' : 'SQLite connected locally');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
})

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

app.post('/api/register', (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const name = String(req.body?.name || '').trim()
  const password = String(req.body?.password || '')

  if (!email) return res.status(400).json({ error: 'Please enter email.' })
  if (!name) return res.status(400).json({ error: 'Please enter name.' })
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' })
  }

  const sql = 'INSERT INTO users(email, name, password) VALUES(?, ?, ?)'
  db.run(sql, [email, name, password], function (err) {
    if (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ error: 'Email already registered.' })
      }
      return res.status(500).json({ error: 'Failed to register user.' })
    }

    return res.json({
      user: {
        id: this.lastID,
        email,
        name,
      },
    })
  })
})

app.post('/api/login', (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password || '')

  if (!email) return res.status(400).json({ error: 'Please enter email.' })
  if (!password) return res.status(400).json({ error: 'Please enter password.' })

  db.get('SELECT id, email, name, password FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Login query failed:', err.message, { email })
      return res.status(500).json({ error: 'Failed to login.' })
    }
    if (!row || row.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    return res.json({
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
      },
    })
  })
})

app.post('/api/forgot-password', (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const newPassword = String(req.body?.newPassword || '')

  if (!email) return res.status(400).json({ error: 'Please enter email.' })
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' })
  }

  db.run('UPDATE users SET password = ? WHERE email = ?', [newPassword, email], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to update password.' })
    if (this.changes === 0) return res.status(404).json({ error: 'Email not found.' })

    return res.json({ message: 'Password updated successfully. Please login.' })
  })
})

app.get('/api/users', (_req, res) => {
  db.all('SELECT id, email, name, password, created_at FROM users ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load users.' })
    return res.json({ users: rows || [] })
  })
})

const port = 4000
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`)
})
