const API_BASE = '/api'

async function request(path, options = {}) {
  const API_BASE = 'https://task-4559.onrender.com';
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Request failed')
  }
  return data
}

export function apiRegister(payload) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function apiLogin(payload) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function apiForgotPassword(payload) {
  return request('/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function apiGetUsers() {
  return request('/users')
}

export function apiGetTasks(email) {
  return request(`/tasks/${encodeURIComponent(email)}`)
}

export function apiCreateTask(payload) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function apiUpdateTask(id, payload) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function apiDeleteTask(id) {
  return request('/tasks', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  })
}
