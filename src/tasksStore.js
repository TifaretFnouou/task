const KEY = 'taskease_v1'

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function loadState() {
  const raw = localStorage.getItem(KEY)
  const parsed = raw ? safeJsonParse(raw) : null

  if (!parsed || typeof parsed !== 'object') {
    return { user: null, tasks: [] }
  }

  return {
    user: parsed.user ?? null,
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function loadUser() {
  return loadState().user
}

export function saveUser(user) {
  const state = loadState()
  state.user = user
  saveState(state)
}

export function loadTasks() {
  return loadState().tasks
}

export function saveTasks(tasks) {
  const state = loadState()
  state.tasks = tasks
  saveState(state)
}

