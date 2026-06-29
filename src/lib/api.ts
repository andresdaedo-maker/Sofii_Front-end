const API_URL = 'http://localhost:1337/api';

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!res.ok) {
    throw new Error(`Error: ${res.status}`);
  }
  
  return res.json();
}