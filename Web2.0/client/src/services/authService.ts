import type { RegistrationData, User } from '../types';
import { apiClient, authStorage } from './apiClient';

export interface AuthResponse {
  token: string;
  role: string;
  account_status?: string;
  user: User;
}

export interface ProfileResponse {
  user: Record<string, unknown>;
  role: string;
}

export interface LoginResult {
  user: User;
  token: string;
  account_status?: string;
}

export const authService = {
  login: async (email: string, password: string, role: string): Promise<LoginResult> => {
    const result = await apiClient.request<AuthResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
      auth: false,
    });

    authStorage.setUserSession({
      token: result.token,
      role: result.role,
      accountStatus: result.account_status,
    });

    return {
      user: {
        ...result.user,
        role: (result.role || role) as User['role'],
      },
      token: result.token,
      account_status: result.account_status,
    };
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const data = await apiClient.request<ProfileResponse>('/auth/me');

    const accountStatus = data.user?.account_status;
    if (typeof accountStatus === 'string') {
      localStorage.setItem('nevn_account_status', accountStatus);
    }

    if (data.role) {
      localStorage.setItem('nevn_role', data.role);
    }

    return data;
  },

  register: async (data: RegistrationData): Promise<{ user: User; token: string }> => {
    const endpoint = data.role === 'employee' ? '/auth/register/employee' : '/auth/register/employer';
    const result = await apiClient.request<{ user: User; token?: string }>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      auth: false,
    });

    return {
      user: result.user as User,
      token: result.token || 'temp_token_until_login',
    };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.request<{ message: string }>('/auth/logout', {
        method: 'POST',
        auth: false,
      });
    } finally {
      authStorage.clearUserSession();
    }
  },
};
