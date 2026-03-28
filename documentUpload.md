Secure Document Upload (Private + Signed URL + Encryption)

Prompt:

Implement a secure document upload system for the NEVN Government Verification Portal.

The system must:

Upload documents to Cloudinary

Store documents as PRIVATE

Encrypt files before uploading

Store only metadata in PostgreSQL

Generate signed URLs for access

Restrict document access to owner only

Use JWT authentication

Follow all requirements strictly.

1️⃣ DATABASE REQUIREMENTS

Create a documents table:

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  public_id VARCHAR(255) NOT NULL,
  encrypted_key TEXT NOT NULL,
  file_size INTEGER,
  verification_status VARCHAR(20) DEFAULT 'PENDING',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Notes:

Do NOT store raw file URL.

Store only Cloudinary public_id.

Store encryption metadata (encrypted_key).

2️⃣ CLOUDINARY CONFIGURATION

Use:

type: "private"

access_mode: "authenticated"

Store inside folder: nevn_documents

Ensure credentials are stored in .env:

CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=

Do not expose credentials.

3️⃣ ENCRYPTION REQUIREMENT (Before Upload)

Before uploading file to Cloudinary:

Encrypt file using AES-256

Use Node.js crypto module

Generate random encryption key per file

Encrypt file buffer before upload

Store encrypted_key securely in database

Encryption design:

Generate random 32-byte key

Encrypt file buffer

Upload encrypted buffer

Save encryption key (encrypted with master key)

Store master encryption key in .env:

MASTER_ENCRYPTION_KEY=

Never commit this to GitHub.

4️⃣ UPLOAD FLOW

POST /api/documents/upload

Flow:

Validate JWT

Ensure role = EMPLOYEE

Accept file via multer memory storage

Encrypt file buffer

Upload encrypted file to Cloudinary (private)

Save metadata in PostgreSQL

Return success response

Return:

{
  "message": "Document uploaded securely",
  "documentId": 12,
  "status": "PENDING"
}
5️⃣ DOCUMENT ACCESS (SIGNED URL)

Create endpoint:

GET /api/documents/:id/view

Flow:

Validate JWT

Fetch document from DB

Ensure:

If EMPLOYEE → document.employee_id === userId

If ADMIN → allow access

Generate signed URL using:

type: "private"

sign_url: true

expires_at: 5 minutes

Return:

{
  "signedUrl": "https://..."
}

Signed URL must expire in 300 seconds.

6️⃣ SECURITY RULES

Must enforce:

Only employees upload

Only owner can access document

Documents are private in Cloudinary

Signed URLs expire

No public URL stored

File size limit: 5MB

Allowed formats: PDF, JPG, PNG

Use multer memory storage (not disk)

Do not log encryption keys

Do not expose public_id directly in frontend

7️⃣ FILE ENCRYPTION DESIGN DETAILS

Use:

const crypto = require("crypto");

Process:

Generate random 32-byte key

Generate random IV

Encrypt using AES-256-CBC

Store IV + encrypted data

Store encrypted encryption key in DB

Encryption key itself must be encrypted using master key before storing.

8️⃣ ROLE-BASED ACCESS CONTROL

EMPLOYEE → Access own documents only

EMPLOYER → No access to raw document

ADMIN → Can access all documents

9️⃣ ARCHITECTURE RULES

This module is OFF-CHAIN.

Blockchain integration will happen only during verification stage.

Do NOT integrate Hyperledger in this module.

Verification status must default to "PENDING".

🔟 EXPECTED SYSTEM BEHAVIOR

After upload:

File encrypted

Stored privately in Cloudinary

Metadata stored in PostgreSQL

No public link exists

Only backend can generate temporary signed URL

URL expires automatically

Proper role-based access enforced

🛡️ SECURITY LEVEL

This implementation must follow:

Zero public access

JWT authentication required

Role validation required

Ownership validation required

Encrypted storage

Expiring access links

🎯 End Goal

A production-grade secure document handling system suitable for a government verification platform.

