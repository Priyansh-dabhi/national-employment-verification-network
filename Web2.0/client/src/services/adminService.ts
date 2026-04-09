const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/admin';

export const adminService = {
    login: async (email: string, password: string): Promise<{ token: string; role: string; user: any }> => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Admin login failed');
        }

        const result = await response.json();

        if (result.token) {
            localStorage.setItem('nevn_admin_token', result.token);
        }

        return result;
    },

    logout: () => {
        localStorage.removeItem('nevn_admin_token');
    },

    getReviewDocuments: async (): Promise<{ summary: any; employeeDocuments: any[]; employerDocuments: any[] }> => {
        const token = localStorage.getItem('nevn_admin_token');
        const response = await fetch(`${API_URL}/review-documents`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch review documents');
        }

        return await response.json();
    },

    getDocumentById: async (id: string, role: string): Promise<{ document: any; verificationLog: any }> => {
        const token = localStorage.getItem('nevn_admin_token');
        const response = await fetch(`${API_URL}/document/${id}?role=${role}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch document details');
        }

        return await response.json();
    },

    adminAction: async (documentId: string, action: 'APPROVE' | 'REJECT' | 'REUPLOAD', reason: string | undefined, role: string): Promise<any> => {
        const token = localStorage.getItem('nevn_admin_token');
        const response = await fetch(`${API_URL}/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ documentId, action, reason, role })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to submit admin action');
        }

        return await response.json();
    }
};
