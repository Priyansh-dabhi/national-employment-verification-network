Implement a complete Employer Dashboard module for the NEVN (National Employment Verification Network) system.

This dashboard must support company verification, employee management, and verification workflows.

The system must integrate with existing authentication (JWT), PostgreSQL database, and role-based access control.

Only EMPLOYER role users should access this module.

Follow all requirements strictly.
1️⃣ BACKEND REQUIREMENTS
🔐 ACCESS CONTROL

All employer APIs must:

Require JWT authentication
Validate role = EMPLOYER
Fetch employer from database
Restrict access if account_status !== "VERIFIED" (for sensitive actions)
🟢 2️⃣ DATABASE TABLES
A. Employer Documents (Company Verification)
CREATE TABLE employer_documents (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER REFERENCES employers(id) ON DELETE CASCADE,
  document_type VARCHAR(100),
  public_id VARCHAR(255),
  verification_status VARCHAR(20) DEFAULT 'PENDING',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
B. Employer Verification Requests
CREATE TABLE employer_verification_requests (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER,
  status VARCHAR(20) DEFAULT 'PENDING',
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  remarks TEXT
);
C. Company Employees (Employee Records)
CREATE TABLE company_employees (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER REFERENCES employers(id),
  employee_id INTEGER REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE / LEFT
  joined_at TIMESTAMP,
  left_at TIMESTAMP
);
🟢 3️⃣ APIs TO IMPLEMENT
🔹 1. Get Employer Profile
GET /api/employer/profile

Return:

organization_name
email
industry
authorized_person_name
account_status
🔹 2. Upload Company Documents
POST /api/employer/documents/upload
Use existing Cloudinary setup (private upload)
Store public_id
Restrict file types (PDF, JPG, PNG)
🔹 3. Apply for Company Verification
POST /api/employer/verification/apply

Logic:

Ensure documents exist
Create verification request
Update employer.account_status = 'PENDING'
🔹 4. Get Verification Status
GET /api/employer/verification/status
🔹 5. Request Employee Verification
POST /api/employer/request-verification

Body:

{
  "employee_email": "test@example.com",
  "position": "Software Engineer",
  "reason": "Background check"
}
🔹 6. Get Verification Requests
GET /api/employer/verification-requests
🔹 7. Get Verified Employees
GET /api/employer/verified-employees

Return only:

employee.account_status === "VERIFIED"
🔹 8. Get All Company Employees
GET /api/employer/employees

Return:

employee details
status (ACTIVE / LEFT)
joined_at
left_at
🔹 9. Update Employee Status (Mark Left)
POST /api/employer/employees/:id/leave

Update:

status = 'LEFT',
left_at = NOW()
🎨 4️⃣ FRONTEND REQUIREMENTS (React + Tailwind)
🔹 ROUTES
/employer/dashboard
/employer/profile
/employer/company-verification
/employer/employees
/employer/verified-employees
/employer/verification-requests
🔹 SIDEBAR MENU
Dashboard
Profile
Company Verification
Employee Management
Verification Requests
Verified Employees
👨‍💼 5️⃣ UI COMPONENTS
1. Employer Profile Page

Show:

Organization Name
Email
Industry
Authorized Person
Account Status Badge
2. Company Verification Page
Upload document section
Show uploaded documents
Apply for verification button
Status indicator (UNVERIFIED / PENDING / VERIFIED / REJECTED)
3. Employee Management Page

Tabs:

Active Employees
List employees with status ACTIVE
Past Employees
List employees with status LEFT
4. Verified Employees Page
Show only verified employees
Include basic details
5. Verification Requests Page

Table:

Employee Name
Status
Date
Action
🔐 FRONTEND LOGIC
Access Control
if (user.role !== "EMPLOYER") {
  redirect("/");
}
Restrict Features

If account_status !== VERIFIED:

Disable:
Request verification
Employee management actions
🛡️ SECURITY REQUIREMENTS
JWT required for all routes
Role validation required
Employer can only access their own data
Prevent unauthorized access
Do not expose sensitive data
🎯 EXPECTED RESULT
Employers can upload company documents
Apply for verification
Manage employees (active + past)
Request employee verification
View verification status
See verified employees
🔥 FINAL GOAL

A fully functional Employer Dashboard that supports company validation, workforce management, and verification workflows in a secure and role-based system.