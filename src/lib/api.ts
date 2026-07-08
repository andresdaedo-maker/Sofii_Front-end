const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';
const API_TOKEN = '5a46c5e7241d9951dd13bb25ee3396b4fdae8f854c6f0d1d80950a2691965e0dfaebfa20629b41850f6219dcb373f449c899af8fdc0d115ff93e463a0745a41abcea653ea0d127dcbcf9942d65e623b32494c9eb97448927e12fe16bc9a998170f93c0d3f3aad08992e394b53ab0aec90243a6c2f20b1ab1a49fe894806338fe';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;
  return headers;
}

export async function fetchAPI(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('Error en fetchAPI:', error);
    return { data: [] };
  }
}

export async function mutateAPI(endpoint: string, method: string = 'POST', body?: any) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    
    if (!res.ok) {
      console.error('Error Strapi:', data);
      throw new Error(data.error?.message || `Error: ${res.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error en mutateAPI:', error);
    throw error;
  }
}