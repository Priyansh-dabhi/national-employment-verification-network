Build a secure Admin Authentication System for a National Employment Verification Network (NEVN).

The system must support admin login and manual admin account creation, without allowing public admin registration.

---

### 🎯 Core Requirements

* Admin users must NOT be able to register publicly
* Admin accounts should be created manually (via script or database)
* Only users with role = "ADMIN" can access admin routes
* Add admin Login to the Navbar

---

### 🗄 Database Schema (User Model)

Each user document should include:

{
fullName: String,
email: String,
password: String (hashed using bcrypt),
role: "EMPLOYEE" | "EMPLOYER" | "ADMIN",
createdAt: Date
}

---

### 🔹 Step 1: Create Admin Account (Manual Script)

Implement a script to create an admin user.

Requirements:

* Hash password using bcrypt
* Assign role = "ADMIN"
* Prevent duplicate admin emails

Example:

* Name: System Admin
* Email: [admin@nevn.com](mailto:admin@nevn.com)
* Password: securely hashed

---

### 🔹 Step 2: Admin Login API

Create endpoint:

POST /api/admin/login

Request Body:

{
"email": "[admin@nevn.com](mailto:admin@nevn.com)",
"password": "password"
}

Logic:

* Find user by email
* Check if role === "ADMIN"
* Compare password using bcrypt
* If valid → generate JWT token
* Return token + role

Response:

{
"token": "jwt_token_here",
"role": "ADMIN"
}

---

### 🔹 Step 3: JWT Authentication

* Use JWT for session management
* Include userId and role in token payload
* Set token expiration (e.g., 1 hour)

---

### 🔹 Step 4: Admin Middleware

Create middleware to protect admin routes.

Logic:

* Verify JWT token
* Check if role === "ADMIN"
* If not → return 403 (Access Denied)

---

### 🔹 Step 5: Protect Admin Routes

Apply middleware to:

* /api/admin/*
* /admin dashboard routes

Only ADMIN users should access these endpoints.

---

### 🔹 Step 6: Frontend Admin Login Page

Create a separate route:

/admin-login

Features:

* Email + Password input
* Submit to /api/admin/login
* Store JWT token (localStorage or cookies)
* Redirect to /admin dashboard after login

---

### 🔐 Security Requirements

* Use bcrypt for password hashing
* Do NOT allow admin registration endpoint
* Validate email uniqueness
* Handle invalid login attempts securely
* Hide admin routes from non-admin users

---

### 🎯 Tech Stack

* Backend: Node.js + Express
* Database: MongoDB
* Auth: JWT + bcrypt
* Frontend: React

---

### 🚀 Goal

Create a secure, production-like admin authentication system where admin accounts are tightly controlled and only accessible through a dedicated login mechanism.






Build an "Admin Review Portal" for a National Employment Verification Network (NEVN) system.

The portal is used by administrators to review employee and employer verification requests that are marked as "UNDER REVIEW" by the automated verification engine.

---

### 🎯 Core Objective

Create a secure admin interface that allows manual review, decision-making, and audit logging for verification requests.

---

### 🏗 Key Features

#### 1. Admin Authentication

* Only users with role = "ADMIN" can access the portal
* Implement JWT-based authentication
* Protect all admin routes

---

#### 2. Dashboard Overview

Display summary:

* Total Documents
* Verified
* Under Review
* Rejected

---

#### 3. Under Review List (Main Table)

Display all documents with status = "UNDER_REVIEW"

Columns:

* User Name
* User Role (Employee / Employer)
* Document Type
* Submitted ID Number (masked)
* Verification Score
* Issue Flags (e.g., "Name Mismatch", "ID Not Found")
* Uploaded Date
* Actions (View / Approve / Reject / Request Re-upload)

---

#### 4. Document Review Panel (Detailed View)

When admin clicks "View":

Show:

* Document preview (via signed URL)
* OCR Extracted Data:

  * Name
  * ID Number
  * DOB
* Submitted Data:

  * Name
  * ID Number
* Comparison result (match / mismatch)
* Verification score breakdown:

  * Format Check
  * OCR Match
  * Database Match
  * Blockchain Status

---

#### 5. Admin Actions

Admin can:

✔ Approve
✔ Reject
✔ Request Re-upload

Each action must:

* Update document status
* Store decision in database
* Add reason (optional but recommended)
* Record admin ID

---

#### 6. Status Update Logic

* APPROVE → status = "VERIFIED", verificationLevel = "ADMIN"
* REJECT → status = "REJECTED"
* REUPLOAD → status = "REUPLOAD_REQUIRED"

---

#### 7. Blockchain Logging

After admin action:

* Create a blockchain log entry (or simulated ledger entry)
* Store:

  * documentId
  * action (APPROVED / REJECTED)
  * adminId
  * timestamp

---

#### 8. Audit Trail Panel

Display timeline:

* Uploaded
* Auto Verified (or score generated)
* Sent to Admin Review
* Admin Decision

---

#### 9. Filters & Search

Allow admin to:

* Filter by status
* Filter by document type
* Search by user name or ID number
* Sort by score (low to high)

---

#### 10. API Endpoints

Backend APIs:

* GET /api/admin/review-documents
* GET /api/admin/document/:id
* POST /api/admin/action

Example request:

{
"documentId": "123",
"action": "APPROVE",
"reason": "All details match"
}

---

#### 11. Security Requirements

* Role-based access control
* Use signed URLs for document viewing
* Mask sensitive ID numbers
* Log all admin actions

---

#### 12. Tech Stack

* Frontend: React + Tailwind CSS
* Backend: Node.js + Express
* Database: MongoDB
* Storage: Cloudinary (private)
* OCR: Tesseract.js
* Blockchain: Hyperledger Fabric (or simulated)

---

### 🎨 UI Requirements

* Clean admin dashboard layout
* Table with pagination
* Modal or side panel for document review
* Color-coded statuses:

  * Green → Verified
  * Yellow → Under Review
  * Red → Rejected

---

### 🚀 Goal

The system should simulate a real-world government or KYC admin verification portal with secure, auditable, and efficient manual review capabilities.
