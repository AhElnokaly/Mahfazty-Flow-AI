import { AppState } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const cloudService = {
  async signup(username: string, password: string): Promise<{ token: string; user: { id: number; username: string } }> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  },

  async login(username: string, password: string): Promise<{ token: string; user: { id: number; username: string } }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async pushData(token: string, data: Partial<AppState>): Promise<{ success: boolean; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error('Sync push failed');
    }

    return response.json();
  },

  async pullData(token: string): Promise<{ data: Partial<AppState> | null; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/sync/pull`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Sync pull failed');
    }

    return response.json();
  },
};
