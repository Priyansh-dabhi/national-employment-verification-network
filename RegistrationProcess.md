Replace the existing registration process with a new government-portal-style registration flow based on role selection.

The new registration process must follow these rules:

There must be a single common registration entry page with role selection:

Register as Employee

Register as Employer

After role selection, show a common registration form that collects only basic account details required for login:

Email address

Mobile number

Password

Confirm password

City and State

After common fields, display role-specific fields:

For Employee registration, collect:

Full name

Date of birth

Gender (optional)

Employment status (dropdown)

For Employer registration, collect:

Organization name

Organization type (Private / Government / PSU)

Industry sector

Authorized person name

Authorized person designation

Registration must not collect detailed identity documents or government ID proofs.

After successful registration:

Create a user account with status UNVERIFIED

Redirect the user to their respective dashboard (Employee or Employer)

The dashboard should be limited, allowing only:

Profile viewing

Applying for verification

Uploading documents for verification

The verification process must be separate from registration and handled later through the dashboard.

Do not integrate blockchain or Hyperledger Fabric during registration.
Blockchain must only be used during the verification phase to store verification metadata and document hashes.

Ensure the registration flow is:

Clean

Minimal

Government-portal style

Role-based

Secure and user-friendly

Replace any existing registration UI, logic, or flow with this new structure.