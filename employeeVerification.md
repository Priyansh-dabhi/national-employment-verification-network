Implement a Hybrid Verification System for the NEVN project.

The system must simulate a government-grade verification process using:

Automated verification engine (risk scoring)
Centralized admin authority (NEVN Central Authority - NCA)
Re-application workflow
Full audit trail support

This system must work for BOTH employees and employers.

Follow all requirements strictly.

🧱 1️⃣ DATABASE REQUIREMENTS
🟢 Update Users (Employees & Employers)

Add fields:

ALTER TABLE employees
ADD COLUMN verification_level VARCHAR(20),
ADD COLUMN verification_score INTEGER;

ALTER TABLE employers
ADD COLUMN verification_level VARCHAR(20),
ADD COLUMN verification_score INTEGER;
🟢 verification_requests table
CREATE TABLE verification_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  role VARCHAR(20) NOT NULL, -- EMPLOYEE or EMPLOYER
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED
  verification_level VARCHAR(20), -- AUTO / ADMIN_APPROVED
  score INTEGER,
  attempt_number INTEGER DEFAULT 1,
  remarks TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by INTEGER
);
🟢 activity_logs table (Audit)
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(255),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
🧠 2️⃣ AUTOMATED VERIFICATION ENGINE
Logic (Simulated)

Generate a risk score:

const score = Math.floor(Math.random() * 100);
Decision Rules
if (score >= 85) {
  status = "APPROVED";
  verification_level = "AUTO";
}

if (score >= 50 && score < 85) {
  status = "PENDING"; // requires admin review
}

if (score < 50) {
  status = "REJECTED";
}
🟢 3️⃣ APPLY FOR VERIFICATION API
Endpoint
POST /api/verification/apply
Logic
Validate JWT
Extract userId and role
Check documents exist
Check no active PENDING request
Generate score
Insert verification_requests
Update user table:
if (status === "APPROVED") {
  account_status = "VERIFIED";
  verification_level = "AUTO";
}

if (status === "PENDING") {
  account_status = "PENDING";
}

if (status === "REJECTED") {
  account_status = "REJECTED";
}
Response
{
  "status": "PENDING",
  "score": 72
}
🔁 4️⃣ RE-APPLICATION LOGIC

Allow re-apply only if:

previous_status === "REJECTED"

When re-applying:

Increment attempt_number
Create new verification_request
Do NOT delete old records
🟢 5️⃣ ADMIN (NEVN CENTRAL AUTHORITY - NCA)
Get All Pending Requests
GET /api/admin/verifications
Approve Request
POST /api/admin/verification/:id/approve

Update:

verification_requests.status = "APPROVED";
verification_requests.verification_level = "ADMIN_APPROVED";

users.account_status = "VERIFIED";
users.verification_level = "ADMIN_APPROVED";
Reject Request
POST /api/admin/verification/:id/reject

Update:

verification_requests.status = "REJECTED";
users.account_status = "REJECTED";
Request Re-upload (Optional)
POST /api/admin/verification/:id/reupload
Keep status as PENDING
Add remarks
🔐 6️⃣ ROLE-BASED RULES
EMPLOYEE → Apply verification
EMPLOYER → Apply verification
ADMIN → Review & decide
Only ADMIN can approve/reject
Do NOT trust frontend role
🎨 7️⃣ FRONTEND BEHAVIOR
Employee & Employer Dashboard
UNVERIFIED
Show "Apply for Verification" button
PENDING
Show "Verification under review"
VERIFIED
Show "Verified ✔"
Unlock job portal access
REJECTED
Show reason from remarks
Show "Re-Apply" button
📊 8️⃣ AUDIT LOGGING

Log all actions:

Verification applied
Auto approved
Auto rejected
Admin approved
Admin rejected

Example:

INSERT INTO activity_logs (user_id, action, details)
VALUES ($1, 'VERIFICATION_APPLIED', 'Attempt 2');
🔗 9️⃣ BLOCKCHAIN (DO NOT IMPLEMENT NOW)

After approval:

Generate document hash
Store hash in Hyperledger Fabric
Save transaction ID in DB
🛡️ 10️⃣ SECURITY RULES
JWT required
Role validation required
Do not allow multiple active requests
Keep full history (no deletion)
Validate ownership
Prevent unauthorized admin actions
🎯 EXPECTED RESULT
Users apply for verification
System auto-evaluates
Some auto-approved
Some require admin review
Admin makes final decision
Users can re-apply if rejected
Full audit trail maintained
🔥 FINAL GOAL

A hybrid verification system combining automation and centralized authority, simulating a real government verification process.