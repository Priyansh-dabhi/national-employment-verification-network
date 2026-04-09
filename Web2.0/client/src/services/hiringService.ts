import { apiClient } from './apiClient';

export interface EmploymentRecord {
  id: string;
  employee_id: number;
  employer_id: number;
  position: string;
  department: string;
  salary: string;
  compensation: string;
  status: 'PROPOSED' | 'CONSENTED' | 'CONFIRMED' | 'TERMINATED';
  verification_hash: string;
  proposed_by: string;
  proposed_at: string;
  consented_at: string | null;
  confirmed_at: string | null;
  terminated_at: string | null;
  end_date: string | null;
  organization_name?: string;
  tier?: string;
  industry_sector?: string;
  full_name?: string;
  email?: string;
  employee_account_status?: string;
  city?: string;
  state?: string;
}

export const hiringService = {
  // Employee endpoints
  consentToHire: (recordId: string) =>
    apiClient.request<{ message: string; mockLedger: { txId: string; blockNumber: number } }>('/hiring/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId }),
    }),

  getMyEmploymentRecords: () =>
    apiClient.request<{ records: EmploymentRecord[] }>('/hiring/my-records'),

  // Employer endpoints
  proposeHire: (employeeId: number, position: string, salary: string, compensation?: string) =>
    apiClient.request<{ message: string; record: any; mockLedger: { txId: string; blockNumber: number }; warning?: string }>('/hiring/propose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, position, salary, compensation }),
    }),

  getCompanyHires: () =>
    apiClient.request<{ records: EmploymentRecord[] }>('/hiring/company-records'),

  terminateEmployee: (recordId: string) =>
    apiClient.request<{ message: string; mockLedger: { txId: string; blockNumber: number } }>(`/hiring/terminate/${recordId}`, {
      method: 'POST',
    }),
};
