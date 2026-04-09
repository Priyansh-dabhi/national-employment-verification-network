# Phase 4.2: Web2 (NEVN) Implementation Spec

This document details the exact modifications applied to the `NewNevn` branch to integrate the Web2 PostgreSQL backend with the Web3 event-driven architecture.

## 1. Database Migrations
**File:** `backend/config/db.js`
*   **Action:** Extended existing table schemas on boot.
*   **Changes:**
    *   Added `web3_employee_id`, `web3_status`, `web3_enrollment_id`, `web3_minted_at`, `web3_confirmed_at` to `employees` and `employers` tables.
    *   Created `web3_event_log` table for idempotency, effectively logging any event webhook hit from the Gateway.

## 2. Webhook Implementation
*   **Middleware:** `backend/src/middleware/webhookAuth.js` created to enforce HMAC-SHA256 signature verification matching `process.env.WEBHOOK_SECRET` avoiding unauthorized external event spoofing.
*   **Controller:** `backend/src/controllers/webhookController.js` created to ingest Fabric Webhooks.
    *   **Idempotency Check:** Checks `tx_id` against `web3_event_log`.
    *   **Updates:** Syncs the blockchain status string (e.g. `MINTED`, `CONSENTED`) onto the PostgreSQL rows.
*   **Routes:** Mounted under `POST /api/webhooks/fabric/*` inside `server.js`.

## 3. Web3 Identity Service (REST Trigger)
**File:** `backend/src/services/web3IdentityService.js`
*   **Action:** Centralized the out-bound communications to the Fabric Gateway.
*   **Flow:** Exposes `mintEmployeeIdentity` and `mintCompanyIdentity`. Generates a UUID locally, locks the local DB row state to `MINTING`, and dispatches an authenticated POST array to the Gateway Server.

## 4. KYC Intercept
*   **File:** `backend/controllers/verificationEngineController.js` and `backend/controllers/adminReviewController.js`
*   **Action:** Injected the `mintEmployeeIdentity/mintCompanyIdentity` calls exactly where a user's local `account_status` updates to `VERIFIED`. 

## 5. Environment Config
**File:** `backend/.env`
*   **Action:** `NEVS_GATEWAY_URL`, `INTERNAL_API_KEY`, and `WEBHOOK_SECRET` populated to facilitate the God Mode <-> Web2 Handshake securely.
