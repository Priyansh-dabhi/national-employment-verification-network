import { apiClient } from './apiClient';

export const employerService = {
  getProfile: () => apiClient.request<{ profile: Record<string, unknown> }>('/employer/profile'),

  uploadDocument: async (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('document_type', documentType);

    return apiClient.request<{ message: string; document: Record<string, unknown> }>('/employer/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  getDocuments: () => apiClient.request<{ documents: Record<string, unknown>[] }>('/employer/documents'),

  applyForVerification: () =>
    apiClient.request<{ message: string; request: Record<string, unknown> }>('/employer/verification/apply', {
      method: 'POST',
    }),

  getVerificationStatus: () =>
    apiClient.request<{ account_status: string; latest_request: Record<string, unknown> | null }>(
      '/employer/verification/status',
    ),

  requestEmployeeVerification: (employee_email: string, position: string, reason: string) =>
    apiClient.request<{ message: string; employee: Record<string, unknown> }>('/employer/request-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_email, position, reason }),
    }),

  getVerificationRequests: () =>
    apiClient.request<{ requests: Record<string, unknown>[] }>('/employer/verification-requests'),

  getVerifiedEmployees: () => apiClient.request<{ employees: Record<string, unknown>[] }>('/employer/verified-employees'),

  getCompanyEmployees: () => apiClient.request<{ employees: Record<string, unknown>[] }>('/employer/employees'),

  markEmployeeLeft: (employeeId: number) =>
    apiClient.request<{ message: string; record: Record<string, unknown> }>(`/employer/employees/${employeeId}/leave`, {
      method: 'POST',
    }),
};
