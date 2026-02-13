Implement a secure Login and JWT-based authentication system for the Government Verification Portal (NEVN).

The system already has separate employees and employers tables in PostgreSQL.

Follow the architecture and security requirements strictly.

1️⃣ LOGIN REQUIREMENTS

Create role-based login logic.

Users can log in as:

Employee

Employer

Login must:

Validate email + password

Identify which table the user belongs to

Verify password using bcrypt

Return JWT token

Return user role

Return account_status

2️⃣ LOGIN API ENDPOINT

Create:

POST /api/auth/login


Request Body:

{
  "email": "user@example.com",
  "password": "password123"
}

3️⃣ LOGIN LOGIC

The login process must:

Check if user exists in employees table.

If not found, check employers table.

If still not found → return 404.

Compare hashed password using bcrypt.

If password incorrect → return 401.

If correct:

Generate JWT token.

Include in payload:

userId

role (EMPLOYEE or EMPLOYER)

account_status

Token expiry: 1 hour.

Return response:

{
  "token": "JWT_TOKEN",
  "role": "EMPLOYEE",
  "account_status": "UNVERIFIED"
}

4️⃣ JWT IMPLEMENTATION REQUIREMENTS

Use jsonwebtoken package

Store JWT_SECRET in .env

Use strong secret key

Token expiry: 1h

Example payload:

{
  userId: user.id,
  role: "EMPLOYEE",
  account_status: user.account_status
}

5️⃣ AUTH MIDDLEWARE

Create middleware:

middleware/authMiddleware.js


It must:

Extract token from Authorization header

Verify JWT

Attach decoded user to req.user

Handle invalid token

Return 401 if unauthorized

Header format:

Authorization: Bearer TOKEN

6️⃣ PROTECTED ROUTE EXAMPLE

Create test route:

GET /api/auth/me


This route must:

Require JWT

Return:

userId

role

account_status

7️⃣ SECURITY REQUIREMENTS

Never return password in response

Handle invalid login attempts properly

Return proper HTTP status codes

Use try/catch for error handling

Validate input

Do not expose database errors directly

8️⃣ ARCHITECTURE RULES

Login is OFF-CHAIN only

Do NOT integrate blockchain here

JWT is only for authentication

account_status will control frontend dashboard logic

9️⃣ EXPECTED BACKEND STRUCTURE
backend/
 ├── config/db.js
 ├── controllers/authController.js
 ├── routes/authRoutes.js
 ├── middleware/authMiddleware.js
 ├── server.js
 └── .env

🔟 RESPONSE STANDARDS

Use consistent responses:

Success:

{
  "message": "Login successful",
  "token": "...",
  "role": "...",
  "account_status": "..."
}


Error examples:

{
  "error": "Invalid credentials"
}