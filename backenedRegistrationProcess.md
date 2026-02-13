Implement the backend registration system for the Government Verification Portal (NEVN) using Node.js, Express, PostgreSQL (Docker), and bcrypt for password hashing.

Follow the architecture and requirements below strictly.

1️⃣ DATABASE REQUIREMENTS

Use PostgreSQL running inside Docker.

Create two separate tables:

Employees Table

Must contain:

id (Primary Key, Auto Increment)

email (Unique, Required)

mobile (Unique, Required)

password (Hashed, Required)

full_name (Required)

date_of_birth

employment_status

gender

city

state

account_status (Default: 'UNVERIFIED')

created_at (Timestamp default current time)

Employers Table

Must contain:

id (Primary Key, Auto Increment)

email (Unique, Required)

mobile (Unique, Required)

password (Hashed, Required)

organization_name (Required)

org_type

industry_sector

authorized_person_name

designation

city

state

account_status (Default: 'UNVERIFIED')

created_at (Timestamp default current time)

Ensure:

email is UNIQUE

mobile is UNIQUE

passwords are NOT stored in plain text

account_status is initialized as 'UNVERIFIED'

2️⃣ DOCKER REQUIREMENT

Create docker-compose.yml for PostgreSQL with:

POSTGRES_USER

POSTGRES_PASSWORD

POSTGRES_DB

Port mapping 5432

Persistent volume

Ensure backend connects to database using environment variables.

3️⃣ BACKEND STRUCTURE

Use this structure:

backend/
 ├── config/
 │     └── db.js
 ├── controllers/
 │     └── authController.js
 ├── routes/
 │     └── authRoutes.js
 ├── server.js
 └── .env

4️⃣ REGISTRATION APIs

Create these endpoints:

POST /api/auth/register/employee

Validate input

Check duplicate email

Hash password using bcrypt

Insert into employees table

Return success response

POST /api/auth/register/employer

Validate input

Check duplicate email

Hash password using bcrypt

Insert into employers table

Return success response

5️⃣ SECURITY REQUIREMENTS

Use bcrypt for password hashing

Use environment variables for DB credentials

Do not expose database secrets

Validate required fields

Return proper HTTP status codes

Handle duplicate email errors properly

6️⃣ IMPORTANT ARCHITECTURE RULES

This registration process must only store data in PostgreSQL (off-chain).

Do NOT integrate blockchain in this stage.

account_status must remain 'UNVERIFIED' after registration.

Verification and blockchain integration will be handled separately.

7️⃣ OUTPUT EXPECTATION

Implement:

Docker setup

PostgreSQL tables

Express backend

Registration routes

Controllers

Database connection

Ensure the backend is ready to connect with existing React frontend.