import { apiClient } from './apiClient';

export interface Job {
  id: number;
  employer_id: number;
  title: string;
  description: string;
  location: string;
  salary_range: string;
  created_at: string;
  organization_name?: string;
  applications_count?: string | number;
}

export interface JobApplication {
  id?: number;
  application_id?: number;
  job_id: number;
  employee_id: number;
  status: string;
  applied_at: string;
  title?: string;
  location?: string;
  salary_range?: string;
  organization_name?: string;
}

export interface JobApplicant {
  application_id: number;
  employee_id: number;
  name: string;
  email: string;
  application_status: string;
  account_status: string;
  applied_at: string;
}

export const jobService = {
  createJob: (jobData: { title: string; description: string; location: string; salary_range: string }) =>
    apiClient.request<Job>('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    }),

  getEmployerJobs: () => apiClient.request<Job[]>('/jobs/employer'),

  getJobApplicants: (jobId: number) => apiClient.request<JobApplicant[]>(`/jobs/${jobId}/applicants`),

  getAllJobs: () => apiClient.request<Job[]>('/jobs'),

  applyForJob: (jobId: number) =>
    apiClient.request<{ message: string }>(`/jobs/${jobId}/apply`, {
      method: 'POST',
    }),

  getEmployeeApplications: () => apiClient.request<JobApplication[]>('/jobs/employee'),
};
