Government Verification Portal - Frontend Implementation Plan
This plan outlines the steps to build the frontend for the National Employment Verification Network (NEVN). We will use React + Vite + TypeScript, sticking to Vanilla CSS for styling as requested, with framer-motion for dynamic animations.

User Review Required
IMPORTANT

Styling: We are using Vanilla CSS with CSS Variables for theming. No TailwindCSS.
Dependencies: We will install react-router-dom for navigation, framer-motion for animations, and lucide-react for icons.
Proposed Changes
1. Dependencies [Top Level]
Run command to install:

react-router-dom
framer-motion
lucide-react
2. Design System (
src/index.css
)
[MODIFY] 
index.css
Define CSS variables for colors (Deep Royal Blue, Gold/Silver accents for government feel), spacing, and glassmorphism effects.
Add global resets and typography (Inter/Roboto).
3. Routing & Structure
[NEW] 
routes.tsx
Define routes for /, /login, /register, /dashboard/employee, /dashboard/employer.
[MODIFY] 
App.tsx
Setup RouterProvider.
4. Components & Pages
[NEW] Components
src/components/ui/StatusBadge.tsx
: Visual indicator for verification status.
src/components/ui/FileUpload.tsx
: Drag and drop file upload component.
src/components/ui/Modal.tsx
: Reusable accessible modal dialog.
src/components/forms/DocumentSubmissionForm.tsx
: Employee document metadata form.
src/components/forms/VerificationRequestForm.tsx
: Employer verification request form.
src/components/ui/Button.tsx
: Reusable styled button.
src/components/ui/Input.tsx
: Reusable input field.
src/components/ui/Card.tsx
: Glassmorphism card container.
[NEW] Pages
src/pages/Home.tsx
: Landing page with hero section and animations.
src/pages/auth/Login.tsx
: Login form.
src/pages/auth/Register.tsx
: Registration for Employer/Employee.
src/pages/dashboard/EmployeeDashboard.tsx
: Document upload and status view.
src/pages/dashboard/EmployerDashboard.tsx
: Employee lookup and verification status table.
Integration Stub (Completed)
[NEW] Services
src/types/index.ts
: Centralized type definitions.
src/services/authService.ts
: Mock authentication.
src/services/documentService.ts
: Mock document storage using simple arrays.
src/services/verificationService.ts
: Mock employer search and request logic.
[MODIFY] Dashboards
Refactored 
EmployeeDashboard.tsx
 and 
EmployerDashboard.tsx
 to use useEffect and service calls instead of hardcoded data.
Verification Plan
Automated Tests
Run npm run dev to start the server.
Verify the build with npm run build (Passed).
Manual Verification
Home Page: Check animations and responsiveness.
Auth: Navigate to Register/Login.
Dashboards:
Access /dashboard/employee: Check Document Upload and Status Badges.
Access /dashboard/employer: Check Employee Table/Search.