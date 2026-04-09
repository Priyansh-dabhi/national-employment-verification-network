# National Employment Verification Network (NEVN) - Backend Analysis Report

This report provides a detailed analysis of the NEVN backend, covering its architecture, routes, business logic, security implementation, and database schema.

---

## 🏗️ Architecture Overview

The backend is built using **Node.js** and **Express**, with **PostgreSQL** as the primary database. It follows a modular structure where routes, controllers, and middleware are separated to maintain clean code and scalability.

- **Primary Entry Point**: `server.js`
- **Database Entry Point**: `config/db.js`
- **Security Logic**: `middleware/` and `utils/`
- **Cloud Storage**: Cloudinary (used for secure document storage)

---

## 🛤️ Route & Business Logic Analysis

All API endpoints are prefixed with `/api`.

### 1. Authentication (`/api/auth`)
Handles user registration, login, and session management using JWT access and refresh tokens.

| Method | Endpoint | Description | Logic Highlight |
| :--- | :--- | :--- | :--- |
| `POST` | `/register/employee` | Registers a new employee. | Hashes password with Bcrypt; checks for duplicate email/mobile. |
| `POST` | `/register/employer` | Registers a new employer. | Similar to employee registration but maps to `employers` table. |
| `POST` | `/login` | Authenticates user & issues tokens. | Issues short-lived Access Token and long-lived rotated Refresh Token. |
| `POST` | `/refresh` | Rotates the JWT refresh token. | Uses HTTP-only cookie to verify; rotates both tokens for security. |
| `POST` | `/logout` | Clears sessions. | Revokes the refresh token from the database. |
| `GET` | `/me` | Returns current user profile. | Decodes the JWT to identify the user. |

### 2. Secure Document Management (`/api/documents`)
Implements a highly secure, client-side encryption-first approach for sensitive documents like PAN, Aadhaar, etc.

| Method | Endpoint | Description | Logic Highlight |
| :--- | :--- | :--- | :--- |
| `POST` | `/upload` | Securely uploads a document. | Generates a random AES-256 key; encrypts file buffer; uploads to Cloudinary; encrypts the file key with a Master Key. |
| `GET` | `/:id/view` | Fetches a decrypted file. | Downloads encrypted file; decrypts File Key with Master Key; decrypts file buffer; returns Base64 Data URL. |
| `GET` | `/` | Lists user's documents. | Returns metadata filtered by the logged-in employee ID. |

### 3. Verification Engine (`/api/verification`)
A multi-layered automated and manual verification system.

- **Layer 1: Format Validation**: Regex checks for ID format (PAN, Aadhaar, DL).
- **Layer 2: OCR Extraction**: Uses `Tesseract.js` to match names/numbers in the document.
- **Layer 3: DB Cross-Check**: Check against `verified_ids` table.
- **Layer 4: Cross-Validation**: History check for the user.
- **Layer 5: Blockchain Integrity**: Hashes the document and records it on a mock blockchain ledger (`blockchain_records`).
- **Status Thresholds**: Verified (>=85), Under Review (>=50), Rejected (<50).

### 4. Job Portal (`/api/jobs`)
Manages job postings and applications. All routes require a `VERIFIED` account status.

- **Employer**: Can `CREATE` jobs and view list of applicants for their jobs.
- **Employee**: Can `VIEW` all jobs and `APPLY` for specific jobs.
- **Enforcement**: Middleware `requireVerified` ensures only trusted users participate in the market.

### 5. Administrative Oversight (`/api/admin`)
Provides a dashboard for human administrators to review automated results.

- **Review Documents**: Fetches both Employer and Employee documents pending verification.
- **Admin Action**: Approves or Rejects documents. This updates the `account_status` globally for that user.
- **Transparency**: Every admin action is logged in `verification_logs`.

### 6. Employer Dashboard (`/api/employer`)
Dedicated logic for organizations to manage their own verification and their employees.

- **Employer Verification**: Similar to employee verification but for company documents (Registration, Tax certificates).
- **Employee Discovery**: Employers can request a verification check on an employee using their email.
- **Employment Tracking**: Employers can mark employees as `ACTIVE` or `LEFT`.

---

## 🔐 Middleware & Security

The system employs several layers of security:

1.  **`authMiddleware.js`**: Validates the Bearer token in the request header.
2.  **`roleMiddleware.js`**: Enforces Role-Based Access Control (RBAC) (e.g., `EMPLOYER` cannot access `ADMIN` routes).
3.  **`verificationMiddleware.js`**: Guards routes that require a `VERIFIED` account status.
4.  **`uploadMiddleware.js`**: Uses `multer` in memory-storage mode to process files before encryption.
5.  **`helmet` & `cors`**: Configured in `server.js` to protect against common web vulnerabilities.
6.  **Environment Variables**: Secrets like `JWT_SECRET` and `MASTER_ENCRYPTION_KEY` are kept strictly out of the codebase.

---

## 🗄️ Database Schema Summary

The relational integrity is managed via 13 primary tables:

- **Identity**: `employees`, `employers`, `admins`.
- **Transactions**: `jobs`, `job_applications`, `company_employees`.
- **Verification**: `documents`, `employer_documents`, `verification_logs`, `verified_ids`, `employer_verification_requests`.
- **Infrastructure**: `refresh_tokens`, `blockchain_records`.

---

> [!NOTE]
> This backend is designed for high trust. The combination of **AES-256 encryption**, **OCR verification**, and **Mock Blockchain recording** makes it a robust solution for national-scale employment verification.
