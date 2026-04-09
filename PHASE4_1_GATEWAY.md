# NEVS PHASE 4.1 — GATEWAY IMPLEMENTATION SPEC

## Overview
This specification details the work required to upgrade the `nevs-gateway` (Web3 administrative backend) to support Phase 4: Event-Driven Architecture and Cryptographic Identity.

**Branch**: `ledger`
**Target Subdirectory**: `nevs-gateway/`

## 1. Setup & Configuration

### 1.1 Dependencies (`package.json`)
Add the following to `nevs-gateway/package.json` dependencies:
- `fabric-ca-client` (^2.2.20)
- `uuid` (^9.0.0)
- `axios` (^1.6.0)

*(Run `npm install` inside the `nevs-gateway` directory)*

### 1.2 Environment Variables (`.env` and `docker-compose.yaml`)
Ensure these variables are exposed in `.env` and passed through to the container in `docker-compose.yaml`:
```env
FABRIC_CA_URL=https://127.0.0.1:7054
FABRIC_CA_NAME=ca-central-govt
FABRIC_CA_ADMIN=admin
FABRIC_CA_ADMIN_PW=adminpw
INTERNAL_API_KEY=nevs-internal-secret-key
WEBHOOK_BASE_URL=http://host.docker.internal:4000
WEBHOOK_SECRET=nevs-webhook-hmac-secret
EVENT_LISTENER_ENABLED=true
EVENT_RETRY_MAX=5
```
*(Note for `WEBHOOK_BASE_URL`: adapt for Docker networking as needed. `host.docker.internal` is useful for local dev if web2 is on the host.)*

---

## 2. Core Service Implementations

### 2.1 Fabric CA Service (`src/services/fabricCAService.js`)
**Purpose**: Interact with the Fabric CA to register and enroll new users with embedded attributes.

**Requirements**:
1. Needs to construct a `FabricCAServices` client using `FABRIC_CA_URL` and `FABRIC_CA_NAME`.
2. Must connect to the CA and ensure the admin identity (`FABRIC_CA_ADMIN`) is enrolled.
3. Implements `registerEmployee(employeeID)`:
   - Must extract the admin identity from the gateway's wallet to authorize the registration.
   - Registers a new user with `enrollmentID = employee_${employeeID}`.
   - Importantly, sets attributes: `[{ name: "employeeID", value: employeeID, ecert: true }, { name: "role", value: "employee", ecert: true }]`.
   - Enrolls the user and places the resulting X.509 certificate and private key back in the Gateway's wallet.
4. Implements `registerCompanyIdentity(companyID)`:
   - Registers a user with `enrollmentID = company_${companyID}`.
   - Sets attributes: `[{ name: "companyId", value: companyID, ecert: true }, { name: "role", value: "company", ecert: true }]`.
   - Enrolls and stores in the wallet.

### 2.2 Event Listener Service (`src/services/eventListenerService.js`)
**Purpose**: Listen to `nevs` chaincode events and forward them via webhook dispatcher.

**Requirements**:
1. Implements a `start(network)` method.
2. Uses `network.getContract('nevs')` and `contract.addContractListener(...)` to listen for block events.
3. Listens for these events: `EmployeeRegistered`, `EmploymentProposed`, `EmploymentConsented`, `EmploymentConfirmed`, `EmploymentTerminated`.
4. Parses the event payload (which comes as bytes, needs JSON.parse).
5. Passes the parsed payload to `webhookDispatcher.dispatch(...)`.
6. Handles disconnects: implements an exponential backoff reconnect loop (e.g. 3s, 6s, 12s...) up to `EVENT_RETRY_MAX` times.

### 2.3 Webhook Dispatcher (`src/services/webhookDispatcher.js`)
**Purpose**: Securely transmit events to the Web2 backend.

**Requirements**:
1. Exposes `dispatch(eventName, payload, txId)`.
2. Generates an HMAC-SHA256 signature of the strict JSON stringified payload using `WEBHOOK_SECRET`.
3. Dispatches POST request via `axios` to `WEBHOOK_BASE_URL` + `/api/webhooks/fabric/<slugified-event-name>`.
4. Sends headers:
   - `x-nevs-signature`: `<generated-signature>`
   - `x-nevs-event`: `<eventName>`
   - `x-nevs-txid`: `<txId>`
5. Should wrap the `axios` call in a retry loop using exponential backoff to handle transient Web2 downtime.

---

## 3. Controllers & Routes

### 3.1 Internal Auth Middleware (`src/middleware/internalAuth.js`)
**Requirements**:
1. Checks the `x-api-key` header on incoming requests.
2. If absent or does not match `process.env.INTERNAL_API_KEY`, immediately return `401 Unauthorized` using `responseHandler.errorResponse`.

### 3.2 Identity Controller (`src/controllers/identityController.js`)
**Requirements**:
1. `mintIdentity(req, res)`:
   - Extracts `employeeID`, `fullName`, `dateOfBirth`, `idHash` from `req.body`.
   - Calls `fabricCAService.registerEmployee(employeeID)`.
   - On success, submits a transaction to `nevs` chaincode: `RegisterEmployee(employeeID, fullName, "MINTING", "GOVT")`. *Note: The status might be set by the chaincode based on the attributes.*
   - Returns immediately with HTTP 202 using `responseHandler.successResponse(res, { status: "MINTING", employeeID, enrollmentID }, ...)` without waiting for event/block confirmation.
2. `mintCompanyIdentity(req, res)`: Similar logic for company.
3. `getIdentityStatus(req, res)`: Checks the gateway wallet for the existence of `employee_${req.params.employeeID}` and returns `{ exists: true/false }`.

### 3.3 Internal Routes (`src/routes/internalRoutes.js`)
**Requirements**:
1. Create `Express.Router()`.
2. Apply `internalAuth` middleware to the router.
3. Hook up `POST /mint-identity`, `POST /mint-company-identity`, and `GET /identity/:employeeID/status` to the `identityController`.

---

## 4. Gateway Integration (Bootstrapping)

### 4.1 Update App.js (`src/app.js`)
1. Import `internalRoutes`.
2. Mount the routes on the express application: `app.use('/api/internal', internalRoutes)`.

### 4.2 Update Server.js (`src/server.js`)
1. Once `fabricService.initConnection()` resolves successfully in the boot sequence, start the event listener:
   `await eventListenerService.start(fabricService.network);`
2. Ensure graceful shutdown logic calls `eventListenerService.stop()` to remove the listener cleanly.

---

## 5. Security Summary
- **No Private Keys Leave Gateway**: The newly minted identities are dumped securely into the Gateway's `wallet` directory. Web2 never has access to these keys.
- **Payload Verification**: All state-change events dispatched to Web2 are signed via HMAC.
- **REST Isolation**: The `/api/internal` namespace is gated. No external UI should be able to trigger identity minting.

*End of Phase 4.1 Spec.*
