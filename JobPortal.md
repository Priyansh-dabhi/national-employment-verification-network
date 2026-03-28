Implement a new module called "Trusted Job Portal" inside the existing NEVN project.

This portal allows ONLY VERIFIED users (employees and employers) to access a job marketplace.

Employers can post jobs.
Employees can apply for jobs.

The system must be fully role-based, secure, and integrated with existing authentication (JWT).

Follow all requirements strictly.

1️⃣ BACKEND REQUIREMENTS
✅ Access Control (VERY IMPORTANT)

All job portal APIs must:

Require JWT authentication
Extract userId and role from token
Fetch account_status from database

Reject access if:

account_status !== "VERIFIED"

Return:

{
  "error": "Access denied. User not verified."
}
🟢 Database Tables
jobs table
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER REFERENCES employers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(100),
  salary_range VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
job_applications table
CREATE TABLE job_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'APPLIED',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
🟢 APIs TO IMPLEMENT
1️⃣ Create Job (Employer Only)
POST /api/jobs

Requirements:

role must be EMPLOYER
account_status must be VERIFIED

Body:

{
  "title": "Software Engineer",
  "description": "Job details...",
  "location": "Remote",
  "salary_range": "5-10 LPA"
}
2️⃣ Get All Jobs (Employee)
GET /api/jobs
Return all jobs
Include employer basic info (organization_name)
3️⃣ Apply for Job (Employee Only)
POST /api/jobs/:jobId/apply

Rules:

role must be EMPLOYEE
prevent duplicate applications
4️⃣ Get Employer Jobs
GET /api/employer/jobs
Return jobs posted by logged-in employer
5️⃣ Get Applicants for Job (Employer)
GET /api/jobs/:jobId/applicants

Return:

Employee name
Email
Verification status
Apply date
6️⃣ Get Employee Applications
GET /api/employee/applications

Return:

Job title
Company name
Status
🧠 Backend Rules
Use role-based middleware
Do NOT trust role from frontend
Use database to validate account_status
Prevent duplicate applications using unique constraint
🎨 2️⃣ FRONTEND REQUIREMENTS (React + Tailwind)
🟢 New Routes
/jobs
/jobs/:id
/employer/jobs
/employer/jobs/:id/applicants
/my-applications
🟢 Access Restriction

Before rendering any job portal page:

Check:

if (user.account_status !== "VERIFIED") {
  redirect("/dashboard");
}
👨‍💼 Employer UI
Employer Dashboard Add:
"Post Job" button
"My Jobs" section
Post Job Form

Fields:

Title
Description
Location
Salary Range
My Jobs Page
List of jobs
"View Applicants" button
Applicants Page
List of employees
Show:
Name
Email
Status
👨‍🎓 Employee UI
Job Feed Page
List all jobs
Show:
Title
Company name
Location
Salary
Button: Apply
Job Details Page
Full description
Apply button
My Applications Page
Show:
Job title
Company
Status
🔐 FRONTEND API INTEGRATION

Use:

Authorization: Bearer <token>

Use axios for API calls.

Handle:

Loading states
Error messages
Success feedback
🧠 UX BEHAVIOR
Employee
Click Apply → status becomes APPLIED
Cannot apply twice
Employer
View applicants per job
See verified candidates only
🛡️ SECURITY REQUIREMENTS
JWT required for all routes
Role-based access enforced
Verified users only
No access if UNVERIFIED or PENDING
Prevent duplicate job applications
🚀 EXPECTED RESULT

After implementation:

Verified employers can post jobs
Verified employees can apply
Employers see only verified candidates
Employees see only verified jobs
System builds trust through verification
🔥 BONUS (Optional if time)
Add job status (OPEN / CLOSED)
Add search & filters
Add pagination
🎯 FINAL GOAL

A fully functional Trusted Job Marketplace where:

Only verified users participate
Hiring is secure and trustworthy
Integrated with NEVN verification system
