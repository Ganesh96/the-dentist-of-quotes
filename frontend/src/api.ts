// In frontend/src/api.ts
import { supabase } from './supabaseClient'; // Adjust path as necessary

export async function getProfile() {
  const res = await fetch(`/api/me`); // Use relative path
  return res.json();
}

export async function updateProfile(interests: string[]) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Error getting session or no session found:', sessionError);
    throw new Error('User not authenticated or session expired.');
  }

  const token = session.access_token;

  const res = await fetch(`/api/me`, { // Use relative path
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ interests })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Failed to update profile and parse error" }));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}