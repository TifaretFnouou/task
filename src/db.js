const KEY_USERS = 'taskease_users_v1'

const KEY_SESSIONS = 'taskease_sessions_v1'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function loadObject(key) {
  const raw = localStorage.getItem(key)
  const parsed = raw ? safeJsonParse(raw) : null
  if (!parsed || typeof parsed !== 'object') return {}
  return parsed
}

function saveObject(key, obj) {
  localStorage.setItem(key, JSON.stringify(obj))
}

export function loadUsers() {
  return loadObject(KEY_USERS)
}

export function saveUsers(users) {
  saveObject(KEY_USERS, users)
}

export function upsertUser(email, data) {
  const users = loadUsers()
  users[email] = { ...(users[email] || {}), ...data }
  saveUsers(users)
}

export function getUserByEmail(email) {
  const users = loadUsers()
  return users[email] || null
}

export function updateUserPassword(email, newPassword) {
  const users = loadUsers()
  if (!users[email]) return false
  users[email] = { ...users[email], password: newPassword }
  saveUsers(users)
  return true
}

// demo: store only current user email in localStorage
export function setSessionEmail(email) {
  const sessions = loadObject(KEY_SESSIONS)
  sessions.current = email || null
  saveObject(KEY_SESSIONS, sessions)
}

export function getSessionEmail() {
  const sessions = loadObject(KEY_SESSIONS)
  return sessions.current || null
}

export function clearSession() {
  setSessionEmail(null)
}

