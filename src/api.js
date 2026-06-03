const API_BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
