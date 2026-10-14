import {
  User,
  Developer,
  Repo,
  PinItem,
  CompareResponse,
  SavedComparison,
  RateLimitStatus,
} from '../types/index.js';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('stackpulse_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}: ${response.statusText}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  async register(email: string, password: string): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  // Developers
  async getDeveloper(username: string, refresh = false): Promise<{ developer: Developer; repos: Repo[]; from_cache: boolean }> {
    const query = refresh ? '?refresh=true' : '';
    return request<{ developer: Developer; repos: Repo[]; from_cache: boolean }>(`/developers/${encodeURIComponent(username)}${query}`);
  },

  async refreshDeveloper(username: string): Promise<{ developer: Developer; repos: Repo[] }> {
    return request<{ developer: Developer; repos: Repo[] }>(`/developers/${encodeURIComponent(username)}/refresh`, {
      method: 'POST',
    });
  },

  async getRecentDevelopers(): Promise<Developer[]> {
    return request<Developer[]>('/developers/recent');
  },

  // Compare
  async compareDevelopers(usernames: string[]): Promise<CompareResponse> {
    return request<CompareResponse>('/compare', {
      method: 'POST',
      body: JSON.stringify({ usernames }),
    });
  },

  async getSavedComparisons(): Promise<SavedComparison[]> {
    return request<SavedComparison[]>('/comparisons');
  },

  async saveComparison(name: string, usernames: string[]): Promise<SavedComparison> {
    return request<SavedComparison>('/comparisons/save', {
      method: 'POST',
      body: JSON.stringify({ name, usernames }),
    });
  },

  async deleteComparison(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/comparisons/${id}`, {
      method: 'DELETE',
    });
  },

  // Pins & Notes
  async getPins(): Promise<PinItem[]> {
    return request<PinItem[]>('/pins');
  },

  async pinRepo(repoId: number, note?: string | null, tags?: string[]): Promise<{ message: string; pin: any }> {
    return request<{ message: string; pin: any }>('/pins', {
      method: 'POST',
      body: JSON.stringify({ repoId, note, tags }),
    });
  },

  async updatePin(id: number, repoId: number, note?: string | null, tags?: string[]): Promise<{ message: string; pin: any }> {
    return request<{ message: string; pin: any }>(`/pins/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ repoId, note, tags }),
    });
  },

  async unpin(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/pins/${id}`, {
      method: 'DELETE',
    });
  },

  async unpinByRepo(repoId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/pins/repo/${repoId}`, {
      method: 'DELETE',
    });
  },

  // System
  async getRateLimit(): Promise<RateLimitStatus> {
    return request<RateLimitStatus>('/system/rate-limit');
  },

  async getTokenStatus(): Promise<{ configured: boolean; maskedToken?: string }> {
    return request<{ configured: boolean; maskedToken?: string }>('/system/token');
  },

  async saveGithubToken(token: string): Promise<{ message: string; quota: any; configured: boolean }> {
    return request<{ message: string; quota: any; configured: boolean }>('/system/token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async deleteGithubToken(): Promise<{ message: string; configured: boolean }> {
    return request<{ message: string; configured: boolean }>('/system/token', {
      method: 'DELETE',
    });
  },
};
