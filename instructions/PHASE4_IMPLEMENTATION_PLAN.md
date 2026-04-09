# NEVS PHASE 4 — IMPLEMENTATION PLAN

## Event-Driven Architecture + Cryptographic Identity Layer

---

## 1. Architecture Summary

### Current System (Phases 1–3)

- Multi-org Fabric: `CentralGovtMSP` (peer0 :7051, peer1 :8051) + `CompanyOrgMSP` (peer0 :9051)
- Orderer: `orderer.nevs.gov` :7050
- Fabric CA: `ca.central.govt` :7054, `ca.company.org` :9054
- Dual endorsement, CCaaS deployment, PDC for salary data
- Gateway on port 3000, God Mode UI with SSE

### Phase 4 Target

```
┌──────────────┐  x-api-key    ┌────────────────────────────┐
│  NEVN (Web2) │◄─────────────►│  NEVS GATEWAY (Web3)       │
│  JWT, KYC    │  POST /mint   │  Fabric CA, Wallet, Events │
│  PostgreSQL  │  ◄──webhook── │  Contract Execution        │
└──────────────┘               └─────────┬──────────────────┘
                                         │
                              ┌──────────▼──────────────────┐
                              │   HYPERLEDGER FABRIC         │
                              │   SetEvent → Listener        │
                              │   CID-based ABAC, PDC        │
                              └─────────────────────────────┘
```

**CQRS Split**:
- Web2 (NEVN) = Fast reads, JWT auth, KYC, PostgreSQL
- Web3 (Gateway) = Trust, immutability, X.509 certs, Fabric CA

---

## 2. Phase Breakdown

| Phase | Scope | Branch | Order |
|-------|-------|--------|-------|
| 4.1 | NEVS Gateway — CA, events, webhooks, security | `ledger` | FIRST |
| 4.2 | NEVN Web2 — DB, webhooks, KYC trigger, state machine | `NewNevn` | SECOND |
| 4.3 | Chaincode — SetEvent, CID identity, consent | `ledger` | THIRD |

---

## 3. Step-by-Step Tasks

### PHASE 4.1 — Gateway Tasks

1. Install dependencies: `fabric-ca-client@^2.2.20`, `uuid@^9.0.0`, `axios@^1.6.0`
2. Add env vars: `FABRIC_CA_URL`, `FABRIC_CA_NAME`, `FABRIC_CA_ADMIN`, `FABRIC_CA_ADMIN_PW`, `INTERNAL_API_KEY`, `WEBHOOK_BASE_URL`, `WEBHOOK_SECRET`, `EVENT_LISTENER_ENABLED`, `EVENT_RETRY_MAX`
3. Create `src/services/fabricCAService.js` — CA registration + enrollment
4. Create `src/services/eventListenerService.js` — contract event listener
5. Create `src/services/webhookDispatcher.js` — secure webhook delivery
6. Create `src/middleware/internalAuth.js` — API key validation
7. Create `src/controllers/identityController.js` — mint endpoints
8. Create `src/routes/internalRoutes.js` — internal routing
9. Modify `src/app.js` — mount internal routes
10. Modify `src/server.js` — start event listener after Fabric init, add shutdown
11. Modify `docker-compose.yaml` — add new env vars

### PHASE 4.2 — Web2 Tasks

1. Create migration: add `web3_employee_id`, `web3_status`, `web3_enrollment_id`, `web3_minted_at`, `web3_confirmed_at` to employees table
2. Create migration: add `web3_event_log` table for idempotency
3. Create `services/web3IdentityService.js` — triggers mint after KYC
4. Create `controllers/webhookController.js` — handles fabric webhooks
5. Create `middleware/webhookAuth.js` — HMAC verification
6. Create `routes/webhookRoutes.js` — webhook routing
7. Modify KYC controller — generate UUID, call mint after verification

### PHASE 4.3 — Chaincode Tasks

1. Add `GetCallerEmployeeID()` to `utils/identity.go`
2. Add `SetEvent("EmployeeRegistered", ...)` to `RegisterEmployee`
3. Add `SetEvent("EmploymentProposed", ...)` to `ProposeEmployment`
4. Add `SetEvent("EmploymentConsented", ...)` to `EmployeeConsent`
5. Add `SetEvent("EmploymentConfirmed", ...)` to `ConfirmEmployment`
6. Add `SetEvent("EmploymentTerminated", ...)` to `TerminateEmployment`
7. Add CID-based consent validation in `EmployeeConsent`
8. Rebuild and redeploy chaincode container

---

## 4. File-Level Changes

### Gateway (`nevs-gateway/`)

| Action | Path | Description |
|--------|------|-------------|
| NEW | `src/services/fabricCAService.js` | Fabric CA register + enroll with attrs |
| NEW | `src/services/eventListenerService.js` | Contract event listener + reconnect |
| NEW | `src/services/webhookDispatcher.js` | HMAC-signed webhook dispatch |
| NEW | `src/middleware/internalAuth.js` | x-api-key validation middleware |
| NEW | `src/controllers/identityController.js` | POST mint-identity, GET status |
| NEW | `src/routes/internalRoutes.js` | /api/internal/* routes |
| MODIFY | `src/app.js` | Mount internalRoutes |
| MODIFY | `src/server.js` | Start eventListener, add shutdown |
| MODIFY | `package.json` | Add 3 dependencies |
| MODIFY | `.env` | Add 9 env vars |
| MODIFY | `docker-compose.yaml` | Add env vars to container |

### Web2 (`backend/` or NewNevn branch)

| Action | Path | Description |
|--------|------|-------------|
| NEW | `migrations/add_web3_identity_fields.sql` | employees table columns |
| NEW | `migrations/add_web3_event_log.sql` | Event log table |
| NEW | `services/web3IdentityService.js` | Mint trigger service |
| NEW | `controllers/webhookController.js` | 5 webhook handlers |
| NEW | `middleware/webhookAuth.js` | HMAC signature auth |
| NEW | `routes/webhookRoutes.js` | POST /api/webhooks/fabric/* |
| MODIFY | KYC controller/service | UUID generation + mint call |

### Chaincode (`nevs-ledger/chaincode/nevs/`)

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | `utils/identity.go` | Add GetCallerEmployeeID() |
| MODIFY | `contracts/employee_registry.go` | Add SetEvent after RegisterEmployee |
| MODIFY | `contracts/employment_lifecycle.go` | Add 4x SetEvent + CID consent |

---

## 5. API Contracts

### 5.1 POST /api/internal/mint-identity

```
Headers:  x-api-key: <INTERNAL_API_KEY>
Body:     { "employeeID": "uuid-v4", "fullName": "...", "dateOfBirth": "YYYY-MM-DD", "idHash": "sha256-hex" }
Success:  202 { "success": true, "data": { "status": "MINTING", "employeeID": "...", "enrollmentID": "employee_<uuid>" } }
Errors:   401 (bad key), 409 (already exists), 500 (CA failure)
```

### 5.2 POST /api/internal/mint-company-identity

```
Headers:  x-api-key: <INTERNAL_API_KEY>
Body:     { "companyID": "COMP-001" }
Success:  202 { "success": true, "data": { "status": "MINTING", "companyID": "...", "enrollmentID": "company_COMP-001" } }
```

### 5.3 GET /api/internal/identity/:employeeID/status

```
Headers:  x-api-key: <INTERNAL_API_KEY>
Success:  200 { "success": true, "data": { "exists": true, "enrollmentID": "employee_<uuid>" } }
```

### 5.4 Webhook Format (Gateway → Web2)

```
POST WEBHOOK_BASE_URL/api/webhooks/fabric/<event-slug>

Headers:
  x-nevs-signature: HMAC-SHA256(body, WEBHOOK_SECRET)
  x-nevs-event: <EventName>
  x-nevs-txid: <FabricTxID>

Body:
{
  "eventName": "<EventName>",
  "txId": "<FabricTxID>",
  "blockNumber": 42,
  "timestamp": "ISO8601",
  "payload": { ...event-specific-fields }
}
```

**Event payloads:**

| Event | Slug | Payload fields |
|-------|------|---------------|
| EmployeeRegistered | employee-registered | employeeId, fullName, status, registeredBy |
| EmploymentProposed | employment-proposed | employmentId, employeeId, companyId, status |
| EmploymentConsented | employment-consented | employmentId, employeeId, status |
| EmploymentConfirmed | employment-confirmed | employmentId, employeeId, companyId, status |
| EmploymentTerminated | employment-terminated | employmentId, employeeId, companyId, endDate, status |

---

## 6. Security Implementation

### 6.1 Internal API Protection

```javascript
// src/middleware/internalAuth.js
module.exports = (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (!key || key !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API key' });
    }
    next();
};
```

### 6.2 Webhook HMAC Signing

```javascript
// Gateway signs:
const sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(JSON.stringify(body)).digest('hex');

// Web2 verifies:
const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
const valid = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
```

### 6.3 Custodial Isolation

Private keys stored ONLY in `nevs-gateway/wallet/`. Never transmitted to Web2. All chaincode interactions go through Gateway internal API.

### 6.4 Certificate ABAC

Employee identity attributes embedded in X.509 ecert during Fabric CA enrollment:
- `employeeID=<UUIDv4>:ecert`
- `role=employee:ecert`

Extracted in chaincode via `ctx.GetClientIdentity().GetAttributeValue("employeeID")`.

### 6.5 Idempotency

`web3_event_log.tx_id` has UNIQUE constraint. Duplicate webhooks with same `tx_id` are rejected at the DB level.

---

## 7. Event Flow Design

### 7.1 Identity Minting Flow

```
Step  Actor           Action                                    Result
1     User            Completes KYC on mobile                   KYC verified
2     NEVN (Web2)     Generates UUIDv4 employeeID               UUID created
3     NEVN (Web2)     DB: web3_status = 'MINTING'               State saved
4     NEVN (Web2)     POST /api/internal/mint-identity           → Gateway
5     Gateway         Registers user with Fabric CA              CA identity created
6     Gateway         Enrolls user, stores X.509 in wallet       Cert in wallet/
7     Gateway         submitTransaction('RegisterEmployee')      → Blockchain
8     Gateway         Returns 202 Accepted                       → NEVN
9     Chaincode       Commits + SetEvent('EmployeeRegistered')   Block committed
10    EventListener   Catches EmployeeRegistered event           Event parsed
11    Dispatcher      POST /webhooks/fabric/employee-registered  → NEVN
12    NEVN (Web2)     Validates HMAC, updates DB                 web3_status = 'ACTIVE'
```

### 7.2 Employment Lifecycle (Event-Driven)

```
Company proposes  → SetEvent(EmploymentProposed)  → webhook → Web2 shows 'pending'
Employee consents → SetEvent(EmploymentConsented)  → webhook → Web2 shows 'consented'
Govt confirms     → SetEvent(EmploymentConfirmed)  → webhook → Web2 shows 'confirmed'
Company terminates→ SetEvent(EmploymentTerminated) → webhook → Web2 shows 'terminated'
```

### 7.3 State Machine (Web2 DB)

```
NONE ──(KYC pass)──► MINTING ──(webhook: EmployeeRegistered)──► ACTIVE
                        │
                   (error/timeout)
                        ▼
                      FAILED ──(retry cron)──► MINTING
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

| Component | What to test |
|-----------|-------------|
| fabricCAService | Register success, duplicate rejection, enrollment, wallet storage |
| eventListenerService | Event parsing, reconnect after disconnect, stop/cleanup |
| webhookDispatcher | HMAC generation, retry on failure, URL mapping |
| internalAuth middleware | Accept valid key, reject invalid, reject missing |
| webhookAuth middleware | Accept valid HMAC, reject tampered, reject missing |

### 8.2 Integration Tests

```bash
# Test 1: Mint identity (happy path)
curl -X POST http://localhost:3000/api/internal/mint-identity \
  -H "x-api-key: $API_KEY" -H "Content-Type: application/json" \
  -d '{"employeeID":"test-uuid","fullName":"Test User","dateOfBirth":"2000-01-01","idHash":"abc123"}'
# Expect: 202

# Test 2: Verify identity exists
curl http://localhost:3000/api/internal/identity/test-uuid/status -H "x-api-key: $API_KEY"
# Expect: { exists: true }

# Test 3: Unauthorized access
curl -X POST http://localhost:3000/api/internal/mint-identity -H "x-api-key: wrong-key"
# Expect: 401

# Test 4: Check Web2 DB after webhook
# SELECT web3_status FROM employees WHERE web3_employee_id = 'test-uuid';
# Expect: ACTIVE
```

### 8.3 Chaos Testing (God Mode)

1. Stop `peer0.central.govt` during mint → verify Gateway returns error, Web2 marks FAILED
2. Kill Gateway during event processing → verify event replay on restart
3. Send webhook with tampered body → verify Web2 rejects with 403
4. Send duplicate webhook (same tx_id) → verify idempotent rejection

---

## 9. Failure Handling & Retry Logic

### 9.1 Gateway Failures

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| CA registration fails | try/catch in fabricCAService | Return 500 to Web2 | Web2 marks FAILED, retries via cron |
| CA enrollment fails | try/catch after register | Attempt deregister + return 500 | Manual cleanup if needed |
| Transaction endorsement fails | try/catch in submitTransaction | Return 500 | Web2 retries |
| Event listener disconnect | Error event on listener | Log + trigger reconnect | Auto-reconnect with backoff |
| Webhook delivery fails | axios error | Retry 3x with backoff | Log failure, event not lost (can replay) |

### 9.2 Web2 Retry Cron

```
Every 5 minutes:
  SELECT * FROM employees
  WHERE web3_status = 'MINTING'
  AND web3_minted_at < NOW() - INTERVAL '10 minutes';

  For each stale record:
    1. GET /api/internal/identity/:id/status
    2. If identity exists on chain → update web3_status = 'ACTIVE'
    3. If not found → retry POST /mint-identity (max 3 attempts)
    4. If max retries exceeded → web3_status = 'FAILED', alert admin
```

### 9.3 Event Listener Reconnect

```javascript
async _reconnect() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        const delay = Math.min(3000 * Math.pow(2, attempt - 1), 48000);
        console.log(`Event listener reconnect attempt ${attempt}, waiting ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        try {
            await this.start(this.network);
            console.log('Event listener reconnected successfully');
            return;
        } catch (err) {
            console.error(`Reconnect attempt ${attempt} failed:`, err.message);
        }
    }
    console.error('Event listener: max reconnect attempts reached');
}
```

### 9.4 Webhook Retry

```javascript
async _retry(fn, maxRetries = 3, baseDelay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (attempt === maxRetries) throw err;
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
```

---

## 10. Deployment Notes (Raspberry Pi Ready)

### 10.1 Resource Requirements

| Service | Memory | Notes |
|---------|--------|-------|
| Gateway + Event Listener | ~180MB | Single Node.js process |
| Fabric CA (already running) | ~100MB | No changes needed |
| NEVN Web2 | ~150MB | PostgreSQL separate |

### 10.2 Startup Order

```
1. Fabric CA containers        (already running)
2. Orderer + Peers              (already running)
3. Chaincode containers         (already running — rebuild if Phase 4.3 applied)
4. nevs-gateway                 (starts event listener automatically)
5. nevn-backend (Web2)          (receives webhooks)
```

### 10.3 Docker Compose Updates

Add to `nevs-gateway/docker-compose.yaml` environment:

```yaml
- FABRIC_CA_URL=https://ca.central.govt:7054
- FABRIC_CA_NAME=ca-central-govt
- FABRIC_CA_ADMIN=admin
- FABRIC_CA_ADMIN_PW=adminpw
- INTERNAL_API_KEY=${INTERNAL_API_KEY}
- WEBHOOK_BASE_URL=http://nevn-backend:4000
- WEBHOOK_SECRET=${WEBHOOK_SECRET}
- EVENT_LISTENER_ENABLED=true
- EVENT_RETRY_MAX=5
```

### 10.4 Network DNS

Gateway container must resolve `ca.central.govt` — either via Docker DNS (same `nevs_network`) or explicit links.

### 10.5 Constraints Preserved

- ✅ Fabric network NOT modified
- ✅ MSP structure NOT changed
- ✅ Dual endorsement NOT removed
- ✅ CCaaS model NOT broken
- ✅ Private keys ONLY in Gateway wallet

---

> **Next**: Begin implementation starting with Phase 4.1 (Gateway).
