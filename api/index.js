import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'

const app = express()
app.use(cors())
app.use(express.json())

const db = new Database('database.db')

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL
)`)

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

  try {
    const stmt = db.prepare('INSERT INTO users(email, name, password) VALUES(?, ?, ?)')
    const result = stmt.run(email, name, password)
    return res.json({
      user: {
        id: result.lastInsertRowid,
        email,
        name,
      },
    })
  } catch (err) {
    if (String(err.message || '').toLowerCase().includes('unique')) {
      return res.status(409).json({ error: 'Email already registered.' })
    }
    return res.status(500).json({ error: 'Failed to register user.' })
  }
})

app.post('/api/login', (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = String(req.body?.password || '')

  if (!email) return res.status(400).json({ error: 'Please enter email.' })
  if (!password) return res.status(400).json({ error: 'Please enter password.' })

  const user = db.prepare('SELECT id, email, name, password FROM users WHERE email = ?').get(email)

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  })
})

app.post('/api/forgot-password', (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const newPassword = String(req.body?.newPassword || '')

  if (!email) return res.status(400).json({ error: 'Please enter email.' })
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' })
  }

  const update = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(newPassword, email)

  if (update.changes === 0) {
    return res.status(404).json({ error: 'Email not found.' })
  }

  return res.json({ message: 'Password updated successfully. Please login.' })
})

app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT id, email, name FROM users ORDER BY id DESC').all()
  return res.json({ users: users || [] })
})

if (!process.env.VERCEL) {
  const port = 3000
  app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`)
  })
}

export default app
