const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';
const API_TOKEN = '55f614bbd78d3cc386df4597c1d0c75c73a8cfcbe465b62fab742b6812b3f55a68d4663816aac79a2dccf38c65d874d7ed111e26dd7f3700d72b73f77e80e27dd45d7475a11fdcf428dc8986030140429f0d7f5c16fa8107418da9d9a24583bc972a85037ba12dc380ed8990de9244c01defea38883613c6e2a28d32541e0f4d';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  
  return headers;
}

export async function fetchAPI(endpoint: string) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
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
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error en mutateAPI:', error);
    throw error;
  }
}