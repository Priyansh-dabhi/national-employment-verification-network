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

const API_URL = 'http://localhost:5000/api/jobs';

const getHeaders = () => {
    const token = localStorage.getItem('nevn_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const jobService = {
    createJob: async (jobData: { title: string; description: string; location: string; salary_range: string }) => {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(jobData),
        });
        if (!response.ok) throw new Error('Failed to create job');
        return response.json();
    },
    getEmployerJobs: async () => {
        const response = await fetch(`${API_URL}/employer`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch jobs');
        return response.json();
    },
    getJobApplicants: async (jobId: number) => {
        const response = await fetch(`${API_URL}/${jobId}/applicants`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch applicants');
        return response.json();
    },
    getAllJobs: async () => {
        const response = await fetch(`${API_URL}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch jobs');
        return response.json();
    },
    applyForJob: async (jobId: number) => {
        const response = await fetch(`${API_URL}/${jobId}/apply`, {
            method: 'POST',
            headers: getHeaders(),
        });
        if (!response.ok) {
            if (response.status === 400) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Already applied');
            }
            throw new Error('Failed to apply for job');
        }
        return response.json();
    },
    getEmployeeApplications: async () => {
        const response = await fetch(`${API_URL}/employee`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error('Failed to fetch applications');
        return response.json();
    }
};
