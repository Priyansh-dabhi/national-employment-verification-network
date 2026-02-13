import type { User } from '../types';

const API_URL = 'http://localhost:5000/api/auth';

export const authService = {
    login: async (email: string, password: string, role: string): Promise<{ user: User; token: string }> => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const result = await response.json();

        // Store token in localStorage (optional, but good practice for persistence)
        if (result.token) {
            localStorage.setItem('nevn_token', result.token);
        }

        return {
            user: {
                ...result.user,
                role: result.role,
                // Map backend user fields to frontend User type if necessary
                // Backend returns: id, name, email. Frontend User type might expect more.
                // Assuming simple mapping for now.
            },
            token: result.token
        };
    },

    getProfile: async (): Promise<{ user: any; role: string }> => {
        const token = localStorage.getItem('nevn_token');
        if (!token) {
            throw new Error('No token found');
        }

        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token invalid or expired
                localStorage.removeItem('nevn_token');
            }
            throw new Error('Failed to fetch profile');
        }

        return await response.json();
    },

    register: async (data: any): Promise<{ user: User; token: string }> => {
        const endpoint = data.role === 'employee' ? '/register/employee' : '/register/employer';

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }

        const result = await response.json();

        return {
            user: result.user,
            token: 'temp_token_until_login' // Backend currently returns user and role, token logic can be added later
        };
    },

    logout: async (): Promise<void> => {
        // No backend call needed for stateless JWT or local cleanup
        return Promise.resolve();
    }
};
