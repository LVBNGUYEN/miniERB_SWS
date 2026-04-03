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
    if (!res.ok) {
      if (res.status === 401) {
        document.cookie = 'access_token=; Max-Age=0; path=/;';
        window.location.href = '/uiux/login';
      }
      const txt = await res.text();
      let data: any = { message: txt };
      try { data = JSON.parse(txt); } catch {}
      const err: any = new Error(Object.keys(data).length ? data.message : `API Error: ${res.status}`);
      err.response = { data };
      throw err;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
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
    if (!res.ok) {
      if (res.status === 401) {
        document.cookie = 'access_token=; Max-Age=0; path=/;';
        window.location.href = '/uiux/login';
      }
      const txt = await res.text();
      let data: any = { message: txt };
      try { data = JSON.parse(txt); } catch {}
      const err: any = new Error(Object.keys(data).length ? data.message : `API Error: ${res.status}`);
      err.response = { data };
      throw err;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  async get(url: string) {
    const token = getCookie('access_token');
    const res = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        document.cookie = 'access_token=; Max-Age=0; path=/;';
        window.location.href = '/uiux/login';
      }
      const txt = await res.text();
      let data: any = { message: txt };
      try { data = JSON.parse(txt); } catch {}
      const err: any = new Error(Object.keys(data).length ? data.message : `API Error: ${res.status}`);
      err.response = { data };
      throw err;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },
  async put(url: string, body: any) {
    const token = getCookie('access_token');
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if (res.status === 401) {
        document.cookie = 'access_token=; Max-Age=0; path=/;';
        window.location.href = '/uiux/login';
      }
      const txt = await res.text();
      let data: any = { message: txt };
      try { data = JSON.parse(txt); } catch {}
      const err: any = new Error(Object.keys(data).length ? data.message : `API Error: ${res.status}`);
      err.response = { data };
      throw err;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  },

  async delete(url: string) {
    const token = getCookie('access_token');
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      if (res.status === 401) {
        document.cookie = 'access_token=; Max-Age=0; path=/;';
        window.location.href = '/uiux/login';
      }
      const txt = await res.text();
      let data: any = { message: txt };
      try { data = JSON.parse(txt); } catch {}
      const err: any = new Error(Object.keys(data).length ? data.message : `API Error: ${res.status}`);
      err.response = { data };
      throw err;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
};

