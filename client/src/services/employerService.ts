const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('nevn_token')}`,
    'Content-Type': 'application/json',
});

export const employerService = {
    // Profile
    getProfile: async () => {
        const res = await fetch(`${API_URL}/employer/profile`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch employer profile');
        return res.json();
    },

    // Company Documents
    uploadDocument: async (file: File, documentType: string) => {
        const token = localStorage.getItem('nevn_token');
        const formData = new FormData();
        formData.append('document', file);
        formData.append('document_type', documentType);
        const res = await fetch(`${API_URL}/employer/documents/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Upload failed');
        }
        return res.json();
    },

    getDocuments: async () => {
        const res = await fetch(`${API_URL}/employer/documents`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch documents');
        return res.json();
    },

    // Verification
    applyForVerification: async () => {
        const res = await fetch(`${API_URL}/employer/verification/apply`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to apply for verification');
        }
        return res.json();
    },

    getVerificationStatus: async () => {
        const res = await fetch(`${API_URL}/employer/verification/status`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch verification status');
        return res.json();
    },

    // Employee Verification Requests
    requestEmployeeVerification: async (employee_email: string, position: string, reason: string) => {
        const res = await fetch(`${API_URL}/employer/request-verification`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ employee_email, position, reason }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to request verification');
        }
        return res.json();
    },

    getVerificationRequests: async () => {
        const res = await fetch(`${API_URL}/employer/verification-requests`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch verification requests');
        return res.json();
    },

    // Employees
    getVerifiedEmployees: async () => {
        const res = await fetch(`${API_URL}/employer/verified-employees`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch verified employees');
        return res.json();
    },

    getCompanyEmployees: async () => {
        const res = await fetch(`${API_URL}/employer/employees`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch employees');
        return res.json();
    },

    markEmployeeLeft: async (employeeId: number) => {
        const res = await fetch(`${API_URL}/employer/employees/${employeeId}/leave`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to update status');
        }
        return res.json();
    },
};
