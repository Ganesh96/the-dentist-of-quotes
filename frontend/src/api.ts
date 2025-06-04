// In frontend/src/api.ts
// Assuming 'supabase' client is accessible here, or you pass it in, or get it from context.
// For this example, let's assume you can import the supabase client directly
import { supabase } from './supabaseClient'; // Adjust path as necessary

const API_URL = 'http://localhost:8000';

export async function getProfile() {
  // If getProfile needs to be authenticated, apply similar token logic here
  const res = await fetch(`${API_URL}/me`);
  return res.json();
}

export async function updateProfile(interests: string[]) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Error getting session or no session found:', sessionError);
    throw new Error('User not authenticated or session expired.');
  }

  const token = session.access_token;

  const res = await fetch(`${API_URL}/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Send the token
    },
    body: JSON.stringify({ interests })
  });
  if (!res.ok) {
    // Handle HTTP errors from your API
    const errorData = await res.json().catch(() => ({ message: "Failed to update profile and parse error" }));
    throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
  }
  return res.json();
}