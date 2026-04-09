# NEVS Hiring Flow Readiness Report

This document outlines the current progress and readiness level of the end-to-end "Hiring Flow" (Employment Proposal and Consent) across the entire stack.

## Executive Summary
**Current Readiness Level: ~70% Complete**

The backend architecture and webhook integrations are largely complete and prepared to handle Phase 5 hiring operations. However, the client-facing React application currently lacks the interfaces required to expose these features to users. Some final backend wiring also remains isolated (commented out).

---

## 1. Backend API Status 🟢 (Mostly Ready)

The primary controller logic for executing the hiring process is robust and successfully connects to the Web3 gateway.

*   **Employer Proposing Hire (`employerController.js`)**: **Ready**. 
    *   `getAvailableEmployees`: Successfully fetches all 'VERIFIED' and 'ACTIVE' employees.
    *   `proposeHire`: Successfully creates a `PROPOSED` entry in `company_employees` and triggers the gateway's `/api/internal/propose-employment` endpoint.
    *   *Routing*: These endpoints are active in `employerRoutes.js`.
*   **Employee Consenting (`jobController.js`)**: **Built but Unlinked**. 
    *   `getPendingOffers`: Correctly fetches any pending proposals.
    *   `consentHire`: Changes local DB status to `CONSENTING` and dispatches action to `/api/internal/consent-employment` on the gateway.
    *   *Routing*: These endpoints are currently **commented out** inside `jobRoutes.js` (marked under "Phase 5 Hiring Routes").

## 2. Web3 & Webhook Integration 🟢 (Ready)

The event-driven ledger integration points successfully anticipate chaincode state changes regarding hiring operations.

*   `handleEmploymentProposed`: Logs the `EmploymentProposed` event locally.
*   `handleEmploymentConsented`: Perfectly updates the local `company_employees` association from `PROPOSED`/`CONSENTING` to **`ACTIVE`** upon successful block confirmation.

## 3. Frontend UI Status 🔴 (Not Started)

The React client application (`client/src/*`) lacks the necessary user interfaces to initiate any of the backend endpoints discussed above.

*   **Employer Portal Issues**: 
    1.  No "Candidate Search" or "Available Employees" interface.
    2.  No forms or action buttons to send (`proposeHire`) salary and compensation offers to verified users.
*   **Employee Portal Issues**:
    1.  No UI component to display `pending-offers`.
    2.  No mechanism or button for an employee to `consentHire` to a pending proposal. 

---

## Action Plan to Launch Hiring Flow

To finalize and launch the hiring flow, the following immediate steps are required:

1.  **Backend Unlinking**: Uncomment the `getPendingOffers` and `consentHire` routes in `backend/routes/jobRoutes.js`.
2.  **Frontend Services**: Add the corresponding API wrapper functions inside `client/src/services/` (e.g., `employerService.proposeHire()`).
3.  **Build React Views**:
    *   *Employers*: Build an "Applicant / Candidate" tab in `EmployerDashboard.tsx` that fetches `available-employees` and allows the creation of a proposal.
    *   *Employees*: Add an "Incoming Proposals" tab to `EmployeeDashboard.tsx` allowing one-click authorization for the consent webhook sequence.
