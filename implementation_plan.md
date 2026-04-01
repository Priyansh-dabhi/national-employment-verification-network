# Integrate Job Postings into Employer Portal

To fulfill the request of adding the "Jobs" options specifically for verified employers, we need to migrate the existing standalone `/employer/jobs` page into the new sidebar-driven Employer Portal layout. 

## User Review Required

Does the following approach align with your expectations?
Instead of hiding the "Jobs" button completely for unverified employers, the best practice is to show the button but render a clear "Lock" message when they click it (explaining that Verification is required). This educates the user on the platform's features while maintaining security.

## Proposed Changes

### [MODIFY] `client/src/routes.tsx`
- Detach the `{ path: '/employer/jobs' }` and `{ path: '/employer/jobs/:id/applicants' }` routes from the public `<Layout />` (Navbar) wrapper.
- Move them to the secure Employer Portal flat routing section at the bottom of the file.

### [MODIFY] `client/src/pages/employer/EmployerLayout.tsx`
- Import the `Briefcase` icon from `lucide-react`.
- Append `{ to: '/employer/jobs', icon: Briefcase, label: 'Job Postings' }` to the `navItems` array so it appears in the sidebar.

### [MODIFY] `client/src/pages/jobs/EmployerJobs.tsx`
- Wrap the entire page content in `<EmployerLayout>`.
- Refactor the component to use `employerService.getProfile()` instead of the generic `authService`.
- If the employer's status is `UNVERIFIED` or `PENDING`, **do not redirect**. Instead, render a secure visual warning banner stating: *"Your company must be VERIFIED to post jobs and recruit candidates"* (matching the style used on the Employee Management page).

### [MODIFY] `client/src/pages/jobs/ApplicantsList.tsx`
- Wrap the entire applicant tracking page in `<EmployerLayout>`.
- Remove any inline top-padding that was meant for the old public Navbar.

## Verification Plan
1. Login as an unverified employer -> click "Job Postings" in the sidebar -> See the restricted access warning.
2. Login as a verified employer -> click "Job Postings" -> Successfully post a job and view the applicants via the integrated portal layout.
