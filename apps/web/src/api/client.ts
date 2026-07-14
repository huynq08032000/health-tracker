const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();

function fullUrl(path: string): string {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('health-tracker:token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(fullUrl(url), { headers: { ...getAuthHeaders() } });
    return handle<T>(res);
  },
  async post<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(fullUrl(url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handle<T>(res);
  },
  async put<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(fullUrl(url), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(body),
    });
    return handle<T>(res);
  },
  async delete(url: string): Promise<void> {
    const res = await fetch(fullUrl(url), { method: 'DELETE', headers: { ...getAuthHeaders() } });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Request failed');
  },
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
