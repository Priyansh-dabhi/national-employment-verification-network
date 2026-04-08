import type { Employee, VerificationStatus } from '../types';
import { apiClient } from './apiClient';

const normalizeStatus = (rawStatus?: string): VerificationStatus => {
  const status = rawStatus?.toUpperCase();
  if (status === 'VERIFIED') return 'verified';
  if (status === 'PENDING') return 'pending';
  if (status === 'REJECTED') return 'rejected';
  return 'unverified';
};

const mapEmployeeRecord = (employee: {
  id: number | string;
  full_name?: string;
  name?: string;
  email?: string;
  position?: string | null;
  account_status?: string;
  employee_status?: string;
  joined_at?: string;
  updated_at?: string;
}): Employee => ({
  id: String(employee.id),
  name: employee.full_name || employee.name || 'Unknown Employee',
  position: employee.position || 'Not specified',
  status: normalizeStatus(employee.account_status || employee.employee_status),
  lastCheck: employee.updated_at || employee.joined_at || new Date().toISOString(),
  email: employee.email || '',
});

export const verificationService = {
  searchEmployees: async (query: string): Promise<Employee[]> => {
    const payload = await apiClient.request<{ employees?: Array<Record<string, unknown>> }>('/employer/employees');
    const employees = (payload?.employees || []) as Array<Parameters<typeof mapEmployeeRecord>[0]>;

    if (!query.trim()) {
      return employees.map(mapEmployeeRecord);
    }

    const needle = query.trim().toLowerCase();
    return employees
      .map(mapEmployeeRecord)
      .filter(
        (employee) =>
          employee.name.toLowerCase().includes(needle) ||
          employee.email.toLowerCase().includes(needle) ||
          employee.position.toLowerCase().includes(needle),
      );
  },

  getAllEmployees: async (): Promise<Employee[]> => {
    const payload = await apiClient.request<{ employees?: Array<Record<string, unknown>> }>('/employer/employees');
    const employees = (payload?.employees || []) as Array<Parameters<typeof mapEmployeeRecord>[0]>;
    return employees.map(mapEmployeeRecord);
  },

  requestVerification: async (employeeIdOrEmail: string): Promise<Employee> => {
    const payload = await apiClient.request<{ employee?: Record<string, unknown> }>('/employer/request-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_email: employeeIdOrEmail,
        position: '',
        reason: '',
      }),
    });

    if (!payload?.employee) {
      throw new Error('Failed to request employee verification');
    }

    return mapEmployeeRecord(payload.employee as Parameters<typeof mapEmployeeRecord>[0]);
  },

  applyForVerification: async (): Promise<{ message: string; account_status: string }> => {
    const payload = await apiClient.request<{ message?: string; account_status?: string }>('/verification/apply', {
      method: 'POST',
    });

    return {
      message: payload?.message || 'Verification request submitted successfully.',
      account_status: payload?.account_status || 'PENDING',
    };
  },

  getVerificationStatus: async (userId: string): Promise<{
    status: string;
    score?: number;
    details_json?: string;
  }> => {
    const payload = await apiClient.request<{ status?: string; score?: number; details_json?: string }>(
      `/verification/status/${userId}`,
    );

    return {
      status: payload?.status || 'UNKNOWN',
      score: payload?.score,
      details_json: payload?.details_json,
    };
  },
};
