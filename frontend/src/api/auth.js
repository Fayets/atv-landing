const API_BASE = import.meta.env.VITE_API_URL || '/acceso/api'
const ECOSYSTEM_URL = import.meta.env.VITE_ECOSYSTEM_URL || 'https://ecosystem.atvos.io'

export async function getSession() {
  try {
    const res = await fetch(`${API_BASE}/auth/session`, {
      credentials: 'include',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function logoutRequest() {
  window.location.href = ECOSYSTEM_URL
}
