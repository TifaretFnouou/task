const KEY = 'taskease_user_tasks_v1'
const NOTES_KEY = 'taskease_user_notes_v1'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function loadAll() {
  const raw = localStorage.getItem(KEY)
  const parsed = raw ? safeJsonParse(raw) : null
  if (!parsed || typeof parsed !== 'object') return {}
  return parsed
}

function saveAll(all) {
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function loadUserTasks(email) {
  const all = loadAll()
  const tasks = all[email]
  return Array.isArray(tasks) ? tasks : []
}

export function saveUserTasks(email, tasks) {
  const all = loadAll()
  all[email] = Array.isArray(tasks) ? tasks : []
  saveAll(all)
}

function loadAllNotes() {
  const raw = localStorage.getItem(NOTES_KEY)
  const parsed = raw ? safeJsonParse(raw) : null
  if (!parsed || typeof parsed !== 'object') return {}
  return parsed
}

function saveAllNotes(all) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(all))
}

export function loadUserNotes(email) {
  const all = loadAllNotes()
  const value = all[email]

  if (Array.isArray(value)) {
    return value
      .filter((n) => n && typeof n === 'object')
      .map((n) => ({
        id: String(n.id || crypto.randomUUID()),
        text: String(n.text || ''),
      }))
  }

  if (typeof value === 'string') {
    return [{ id: crypto.randomUUID(), text: value }]
  }

  return []
}

export function saveUserNotes(email, notes) {
  const all = loadAllNotes()
  const normalized = Array.isArray(notes)
    ? notes.map((n) => ({
        id: String(n?.id || crypto.randomUUID()),
        text: String(n?.text || ''),
      }))
    : []
  all[email] = normalized
  saveAllNotes(all)
}

