import { getCookie } from '../utils/cookie';

const BASE_URL = ''; // Relative path because they share origin in NestJS statically served

export const api = {
  async post(url: string, body: any) {
    const token = getCookie('access_token');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async patch(url: string, body?: any) {
    const token = getCookie('access_token');
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async get(url: string) {
    const token = getCookie('access_token');
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  }
};

