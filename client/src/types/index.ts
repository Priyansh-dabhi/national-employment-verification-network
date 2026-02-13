export type UserRole = 'employee' | 'employer' | 'admin';
export type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'unverified';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    organization?: string; // For employers
    employeeId?: string; // For employees
}

export interface Document {
    id: string;
    name: string;
    type: string;
    date: string;
    status: VerificationStatus;
    user_id: string;
}

export interface Employee {
    id: string;
    name: string;
    position: string;
    status: VerificationStatus;
    lastCheck: string;
    email: string;
}

export type EmploymentStatus = 'employed' | 'unemployed' | 'student' | 'retired';
export type OrganizationType = 'private' | 'government' | 'psu';

export interface EmployeeInfo {
    fullName: string;
    dob: string;
    gender?: string;
    employmentStatus: EmploymentStatus;
    city: string;
    state: string;
}

export interface EmployerInfo {
    organizationName: string;
    organizationType: OrganizationType;
    industrySector: string;
    authorizedPersonName: string;
    authorizedPersonDesignation: string;
    city: string;
    state: string;
}

export type RegistrationData = {
    email: string;
    mobile: string;
    password: string;
    role: UserRole;
    details: EmployeeInfo | EmployerInfo;
};
