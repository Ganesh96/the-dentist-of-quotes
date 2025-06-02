const API_URL = 'http://localhost:8000'

export async function getProfile() {
  const res = await fetch(`${API_URL}/me`)
  return res.json()
}

export async function updateProfile(interests: string[]) {
  const res = await fetch(`${API_URL}/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests })
  })
  return res.json()
}
