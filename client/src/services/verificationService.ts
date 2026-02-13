import type { Employee, VerificationStatus } from '../types';

const MOCK_EMPLOYEES: Employee[] = [
    { id: '101', name: 'Alice Smith', position: 'Software Engineer', status: 'verified', lastCheck: '2024-02-01', email: 'alice@example.com' },
    { id: '102', name: 'Bob Williams', position: 'Product Manager', status: 'pending', lastCheck: '2024-02-03', email: 'bob@example.com' },
    { id: '103', name: 'Charlie Brown', position: 'Data Analyst', status: 'unverified', lastCheck: '-', email: 'charlie@example.com' },
    { id: '104', name: 'Diana Prince', position: 'UX Designer', status: 'verified', lastCheck: '2023-11-15', email: 'diana@example.com' },
];

export const verificationService = {
    searchEmployees: async (query: string): Promise<Employee[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const lowerQuery = query.toLowerCase();
                const results = MOCK_EMPLOYEES.filter(emp =>
                    emp.name.toLowerCase().includes(lowerQuery) ||
                    emp.position.toLowerCase().includes(lowerQuery) ||
                    emp.email.toLowerCase().includes(lowerQuery)
                );
                resolve(results);
            }, 600);
        });
    },

    getAllEmployees: async (): Promise<Employee[]> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve([...MOCK_EMPLOYEES]), 800);
        });
    },

    requestVerification: async (employeeId: string): Promise<Employee> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Mock finding user or creating a request
                const exists = MOCK_EMPLOYEES.find(e => e.id === employeeId || e.email === employeeId);
                if (exists) {
                    // In a real app, this would create a Request object, but for now we return the Employee
                    resolve(exists);
                } else {
                    // Mock "New Request"
                    const newReq: Employee = {
                        id: Date.now().toString(),
                        name: `Pending User (${employeeId})`,
                        position: 'Verification Requested',
                        status: 'pending' as VerificationStatus,
                        lastCheck: new Date().toISOString().split('T')[0],
                        email: employeeId
                    };
                    MOCK_EMPLOYEES.unshift(newReq);
                    resolve(newReq);
                }
            }, 1200);
        });
    }
};
