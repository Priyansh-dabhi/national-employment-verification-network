# NEVS — Phase 2 Implementation Plan

> **A step-by-step guide for any AI agent or developer to implement the National Employment Verification System Phase 2.**

---

## Table of Contents

1. [Current State Summary](#1-current-state-summary)
2. [Phase 2 Objectives](#2-phase-2-objectives)
3. [Architecture Overview](#3-architecture-overview)
4. [Pre-Requisites & Constraints](#4-pre-requisites--constraints)
5. [Step-by-Step Implementation](#5-step-by-step-implementation)
   - [Step 1: Scaffold the New Chaincode Module](#step-1-scaffold-the-new-chaincode-module)
   - [Step 2: Define Data Models](#step-2-define-data-models)
   - [Step 3: Implement Utility Packages](#step-3-implement-utility-packages)
   - [Step 4: Implement CompanyRegistryContract](#step-4-implement-companyregistrycontract)
   - [Step 5: Implement EmployeeRegistryContract](#step-5-implement-employeeregistrycontract)
   - [Step 6: Implement EmploymentLifecycleContract](#step-6-implement-employmentlifecyclecontract)
   - [Step 7: Implement VerificationContract](#step-7-implement-verificationcontract)
   - [Step 8: Implement AccessControlContract](#step-8-implement-accesscontractcontract)
   - [Step 9: Wire Up SmartContract Router](#step-9-wire-up-smartcontract-router)
   - [Step 10: Update main.go](#step-10-update-maingo)
   - [Step 11: Build & Vendor Dependencies](#step-11-build--vendor-dependencies)
   - [Step 12: Deploy New Chaincode to Network](#step-12-deploy-new-chaincode-to-network)
   - [Step 13: Expand Gateway API — Routes & Controllers](#step-13-expand-gateway-api--routes--controllers)
   - [Step 14: Update Gateway FabricService](#step-14-update-gateway-fabricservice)
   - [Step 15: End-to-End Smoke Test](#step-15-end-to-end-smoke-test)
6. [Verification Plan](#6-verification-plan)
7. [File Change Summary](#7-file-change-summary)
8. [Risk & Rollback Strategy](#8-risk--rollback-strategy)

---

## 1. Current State Summary

### Fabric Network (Stable — DO NOT MODIFY)

| Component | Details |
|---|---|
| Fabric Version | 2.5 |
| Orderer | `orderer.nevs.gov` (EtcdRaft, port 7050) |
| Peers | `peer0.central.govt` (7051), `peer1.central.govt` (8051) |
| CAs | `ca.central.govt` (7054), `ca.nevs.gov` (8054) |
| Channel | `nevs-channel` |
| Org MSP | `CentralGovtMSP` |
| TLS | Enabled |
| Consensus | EtcdRaft |

### Existing Chaincode (`employment`)

| Item | Value |
|---|---|
| Language | Go 1.18 |
| Package | `github.com/nevs/chaincode/employment` |
| Framework | `fabric-contract-api-go` v1.2.2 |
| Deployment | CCaaS (Chaincode-as-a-Service) on port 9999 |
| Container | `employment.cc` |

**Current Functions:**
- `CreateEmploymentRecord` — creates a record with composite key `EMPLOYMENT~employeeId~recordId`
- `GetEmploymentRecord` — retrieves by employee + record ID
- `UpdateEmploymentStatus` — updates status and optional end date
- `GetEmploymentHistory` — all records for one employee (partial composite key query)
- `GetAllEmploymentRecords` — all records in the network
- `EmploymentRecordExists` — existence check

**Current Data Model (`EmploymentRecord`):**
```go
RecordID, EmployeeID, EmployerID, Position, StartDate, EndDate, Status, CreatedAt, UpdatedAt
```

### Existing Gateway (`nevs-gateway`)

| Item | Value |
|---|---|
| Framework | Express.js 4.19.2 |
| Fabric SDK | `fabric-network` v2.2.20 |
| Port | 3000 |
| Identity | `Admin@central.govt` (CentralGovtMSP) |

**Current Route Map:**
| Method | Endpoint | Function |
|---|---|---|
| GET | `/api/employment` | Get all records |
| POST | `/api/employment` | Create a record |
| GET | `/api/employment/employee/:employeeId` | Get employee history |
| GET | `/api/employment/record/:employeeId/:recordId` | Get specific record |
| PUT | `/api/employment/:employeeId/:recordId/status` | Update status |
| POST | `/api/godmode/peers/stop` | Stop a peer container |
| POST | `/api/godmode/peers/start` | Start a peer container |
| GET | `/api/godmode/network-status` | Docker container status |
| GET | `/api/godmode/peers/sync-status` | Peer block-height sync |

### Existing UI (`nevs-godmode-ui`)
- Vite + React + Tailwind CSS
- Sci-Fi "God Mode" monitoring dashboard
- **Will NOT be modified in Phase 2** (new UI is out of scope)

---

## 2. Phase 2 Objectives

1. **Modular Smart Contracts** — Refactor the single `employment` chaincode into a multi-contract chaincode (`nevs`) with distinct contract domains.
2. **Company Registry** — Government-controlled company onboarding and lifecycle management.
3. **Employee Registry** — Individual employee identity records on the ledger.
4. **Employment Lifecycle** — Full propose → consent → confirm → terminate flow.
5. **Verification** — Third-party employment verification and proof generation.
6. **Access Control** — Role-based access using X.509 certificate attributes.
7. **Gateway API Expansion** — REST endpoints for all new contracts, organized by role.
8. **Data Privacy** — Sensitive fields encrypted before ledger storage (encryption at the application layer).

---

## 3. Architecture Overview

### Target Chaincode Structure

```
nevs-ledger/
└── chaincode/
    └── nevs/                          ← NEW chaincode module
        ├── contracts/
        │   ├── company_registry.go     ← CompanyRegistryContract
        │   ├── employee_registry.go    ← EmployeeRegistryContract
        │   ├── employment_lifecycle.go ← EmploymentLifecycleContract
        │   ├── verification.go         ← VerificationContract
        │   └── access_control.go       ← AccessControlContract
        ├── models/
        │   ├── company.go              ← Company struct + statuses
        │   ├── employee.go             ← Employee struct
        │   ├── employment.go           ← Employment struct + statuses
        │   └── verification_record.go  ← VerificationRecord struct
        ├── utils/
        │   ├── identity.go             ← GetCallerRole(), GetCallerCompanyID()
        │   └── composite_keys.go       ← All composite key definitions
        ├── smartcontract.go            ← Multi-contract router
        ├── main.go                     ← CCaaS entrypoint
        ├── Dockerfile                  ← Container build
        ├── go.mod
        └── go.sum
```

> **Note:** The old `chaincode/employment/` directory is preserved for rollback. The new chaincode is deployed under a new name `nevs` so it can coexist during transition.

### Target Gateway Structure

```
nevs-gateway/
└── src/
    ├── app.js                         ← Modified: add new route mounts
    ├── server.js                      ← Unchanged
    ├── controllers/
    │   ├── employmentController.js    ← Kept for backward compatibility
    │   ├── godModeController.js       ← Unchanged
    │   ├── companyController.js       ← NEW
    │   ├── employeeController.js      ← NEW
    │   ├── lifecycleController.js     ← NEW
    │   └── verifierController.js      ← NEW
    ├── routes/
    │   ├── employmentRoutes.js        ← Kept for backward compatibility
    │   ├── godModeRoutes.js           ← Unchanged
    │   ├── govtRoutes.js              ← NEW (company approval flows)
    │   ├── companyRoutes.js           ← NEW
    │   ├── employeeRoutes.js          ← NEW
    │   └── verifierRoutes.js          ← NEW
    ├── services/
    │   ├── fabricService.js           ← Modified: support multiple contracts
    │   └── peerMonitorService.js      ← Unchanged
    └── utils/
        ├── logger.js                  ← Unchanged
        └── responseHandler.js         ← Unchanged
```

### Tiered Company Participation (Logical Design)

```
┌─────────────────────────────────────────────────────────┐
│                    NEVS NETWORK                         │
│                                                         │
│   ┌───────────────┐    ┌──────────────────────────┐     │
│   │  Orderer Org   │    │   CentralGovtMSP          │     │
│   │  nevs.gov     │    │   peer0 + peer1            │     │
│   └───────────────┘    └──────────────────────────┘     │
│                                                         │
│   Tier 1 (Small Co.)   ── Gateway API ──→ Govt Peers   │
│   Tier 2 (Medium Co.)  ── Optional Peer (read-only)    │
│   Tier 3 (Large Co.)   ── Own MSP + Peer + Endorsement │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

> **Phase 2 scope:** All companies interact as **Tier 1** through the gateway. Tier 2 & 3 infrastructure provisioning is deferred to Phase 3. However, the **data model and access control** must be designed to support all tiers from day one.

---

## 4. Pre-Requisites & Constraints

### Hard Constraints
- **Do NOT modify** existing Fabric network infrastructure (orderer, peers, CAs, channel, TLS, crypto material).
- **Do NOT delete** the old `chaincode/employment/` directory — keep it for rollback.
- **Do NOT modify** `configtx.yaml`, any Docker Compose files in `network/docker/`, or the `organizations/` directory.
- The new chaincode must use the same CCaaS deployment pattern.
- The gateway must remain backward-compatible with existing `/api/employment` and `/api/godmode` routes.

### Soft Constraints
- Go version: 1.18+ (match existing `go.mod`).
- Use `fabric-contract-api-go` v1.2.2 (same as existing chaincode).
- The new chaincode should be deployed as chaincode name `nevs` (not overwriting `employment`).
- All new API routes should be prefixed with `/api/v2/`.

### Environment
- OS: Windows (PowerShell)
- Docker Desktop must be running
- Network: `nevs_network` (Docker network)

---

## 5. Step-by-Step Implementation

---

### Step 1: Scaffold the New Chaincode Module

**Goal:** Create the directory structure for the new `nevs` chaincode.

**Actions:**

1. Create the following directory tree under `nevs-ledger/chaincode/`:

```
nevs/
├── contracts/
├── models/
├── utils/
├── smartcontract.go    (empty placeholder)
├── main.go             (empty placeholder)
├── Dockerfile
└── go.mod
```

2. Create `go.mod`:

```go
module github.com/nevs/chaincode/nevs

go 1.18

require github.com/hyperledger/fabric-contract-api-go v1.2.2
```

3. Create `Dockerfile` (identical pattern to existing):

```dockerfile
FROM golang:1.18-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o chaincode -mod=vendor .

FROM alpine:3.17
COPY --from=builder /app/chaincode /app/chaincode
EXPOSE 9998
CMD ["/app/chaincode"]
```

> Note: Use port **9998** to avoid conflict with the existing chaincode on 9999.

**Validation:** Directory exists and `go mod tidy` runs without errors.

---

### Step 2: Define Data Models

**Goal:** Create all data structs and constants used across contracts.

#### File: `models/company.go`

```go
package models

// Company statuses
const (
    CompanyStatusPending   = "PENDING"
    CompanyStatusApproved  = "APPROVED"
    CompanyStatusSuspended = "SUSPENDED"
    CompanyStatusRejected  = "REJECTED"
)

// Company tiers
const (
    CompanyTierSmall      = "TIER_1"  // Gateway-only access
    CompanyTierMedium     = "TIER_2"  // Optional hosted peer
    CompanyTierEnterprise = "TIER_3"  // Own MSP + endorsement
)

type Company struct {
    CompanyID      string `json:"companyId"`
    Name           string `json:"name"`
    RegistrationNo string `json:"registrationNo"`
    Industry       string `json:"industry"`
    Tier           string `json:"tier"`           // TIER_1, TIER_2, TIER_3
    Status         string `json:"status"`         // PENDING, APPROVED, SUSPENDED, REJECTED
    AdminEmail     string `json:"adminEmail"`
    CreatedAt      string `json:"createdAt"`
    UpdatedAt      string `json:"updatedAt"`
    ApprovedBy     string `json:"approvedBy"`     // Gov admin who approved
    SuspendedAt    string `json:"suspendedAt,omitempty"`
    SuspendReason  string `json:"suspendReason,omitempty"`
}
```

#### File: `models/employee.go`

```go
package models

const (
    EmployeeStatusActive   = "ACTIVE"
    EmployeeStatusInactive = "INACTIVE"
)

type Employee struct {
    EmployeeID   string `json:"employeeId"`
    FullName     string `json:"fullName"`
    DateOfBirth  string `json:"dateOfBirth"`
    IDHash       string `json:"idHash"`       // SHA-256 of govt ID (Aadhaar/PAN)
    Status       string `json:"status"`       // ACTIVE, INACTIVE
    RegisteredBy string `json:"registeredBy"` // CompanyID that first registered
    CreatedAt    string `json:"createdAt"`
    UpdatedAt    string `json:"updatedAt"`
}
```

#### File: `models/employment.go`

```go
package models

const (
    EmploymentStatusProposed   = "PROPOSED"    // Company proposed, awaiting employee consent
    EmploymentStatusConsented  = "CONSENTED"   // Employee consented
    EmploymentStatusConfirmed  = "CONFIRMED"   // Government confirmed (active employment)
    EmploymentStatusTerminated = "TERMINATED"  // Employment ended
    EmploymentStatusDisputed   = "DISPUTED"    // Under dispute
)

type Employment struct {
    EmploymentID     string `json:"employmentId"`
    EmployeeID       string `json:"employeeId"`
    CompanyID        string `json:"companyId"`
    Position         string `json:"position"`
    Department       string `json:"department,omitempty"`
    StartDate        string `json:"startDate"`
    EndDate          string `json:"endDate,omitempty"`
    Status           string `json:"status"`
    VerificationHash string `json:"verificationHash"` // SHA-256(employeeId+companyId+startDate)
    ProposedBy       string `json:"proposedBy"`       // Identity who proposed
    ConsentedAt      string `json:"consentedAt,omitempty"`
    ConfirmedAt      string `json:"confirmedAt,omitempty"`
    TerminatedAt     string `json:"terminatedAt,omitempty"`
    CreatedAt        string `json:"createdAt"`
    UpdatedAt        string `json:"updatedAt"`
}
```

#### File: `models/verification_record.go`

```go
package models

type VerificationRecord struct {
    VerificationID   string `json:"verificationId"`
    EmploymentID     string `json:"employmentId"`
    EmployeeID       string `json:"employeeId"`
    CompanyID        string `json:"companyId"`
    VerifierID       string `json:"verifierId"`       // e.g. "internshala", "indeed"
    Status           string `json:"status"`            // VERIFIED, NOT_FOUND, MISMATCH
    VerificationHash string `json:"verificationHash"`  // Proof hash
    RequestedAt      string `json:"requestedAt"`
    RespondedAt      string `json:"respondedAt,omitempty"`
}
```

**Validation:** All models compile with `go build ./models/...`

---

### Step 3: Implement Utility Packages

**Goal:** Create shared helpers for identity extraction and composite key management.

#### File: `utils/composite_keys.go`

```go
package utils

// Composite key index names for world state
const (
    CompanyIndex       = "COMPANY"       // COMPANY~companyId
    EmployeeIndex      = "EMPLOYEE"      // EMPLOYEE~employeeId
    EmploymentIndex    = "EMPLOYMENT"    // EMPLOYMENT~employeeId~employmentId
    EmpByCompanyIndex  = "EMP_COMPANY"   // EMP_COMPANY~companyId~employmentId
    VerificationIndex  = "VERIFICATION"  // VERIFICATION~verificationId
    VerifByEmployment  = "VERIF_EMP"     // VERIF_EMP~employmentId~verificationId
)
```

#### File: `utils/identity.go`

This file extracts the caller's role and company ID from the X.509 certificate attributes embedded in the transaction context.

```go
package utils

import (
    "fmt"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Roles
const (
    RoleGovt     = "govt"
    RoleCompany  = "company"
    RoleEmployee = "employee"
    RoleVerifier = "verifier"
)

// GetCallerMSPID returns the MSP ID of the transaction caller.
func GetCallerMSPID(ctx contractapi.TransactionContextInterface) (string, error) {
    return ctx.GetClientIdentity().GetMSPID()
}

// GetCallerRole extracts the "role" attribute from the caller's certificate.
// Falls back to "govt" if role attribute is missing and caller is CentralGovtMSP.
func GetCallerRole(ctx contractapi.TransactionContextInterface) (string, error) {
    role, found, err := ctx.GetClientIdentity().GetAttributeValue("role")
    if err != nil {
        return "", fmt.Errorf("failed to get role attribute: %v", err)
    }
    if !found || role == "" {
        // Fallback: if the caller belongs to CentralGovtMSP, treat as govt
        mspID, _ := GetCallerMSPID(ctx)
        if mspID == "CentralGovtMSP" {
            return RoleGovt, nil
        }
        return "", fmt.Errorf("role attribute not found in certificate")
    }
    return role, nil
}

// GetCallerCompanyID extracts the "companyId" attribute from the caller's certificate.
func GetCallerCompanyID(ctx contractapi.TransactionContextInterface) (string, error) {
    companyID, found, err := ctx.GetClientIdentity().GetAttributeValue("companyId")
    if err != nil {
        return "", fmt.Errorf("failed to get companyId attribute: %v", err)
    }
    if !found || companyID == "" {
        return "", fmt.Errorf("companyId attribute not found in certificate")
    }
    return companyID, nil
}

// RequireRole verifies the caller has the expected role. Returns error if not.
func RequireRole(ctx contractapi.TransactionContextInterface, expectedRole string) error {
    role, err := GetCallerRole(ctx)
    if err != nil {
        return err
    }
    if role != expectedRole {
        return fmt.Errorf("access denied: required role '%s', caller has '%s'", expectedRole, role)
    }
    return nil
}
```

> **Important Note for Phase 2:** Since the Fabric CA is currently only issuing certificates for `Admin@central.govt` without custom attributes, the `GetCallerRole` function includes a **fallback** — any caller from `CentralGovtMSP` is treated as `govt` role. As we add CA enrollment for companies/employees in future steps, the attribute-based path will be the primary one.

**Validation:** `go build ./utils/...` compiles successfully.

---

### Step 4: Implement CompanyRegistryContract

**Goal:** Allow government to register, approve, suspend, and query companies.

#### File: `contracts/company_registry.go`

**Functions to Implement:**

| Function | Caller Role | Description |
|---|---|---|
| `RegisterCompany` | `govt` | Creates a new company with status `PENDING` |
| `ApproveCompany` | `govt` | Sets company status to `APPROVED` |
| `SuspendCompany` | `govt` | Sets company status to `SUSPENDED` with reason |
| `RejectCompany` | `govt` | Sets company status to `REJECTED` |
| `GetCompany` | any | Retrieves a company by ID |
| `GetAllCompanies` | `govt` | Lists all registered companies |
| `GetCompaniesByStatus` | `govt` | Lists companies filtered by status |

**Implementation Details:**
- Use composite key `COMPANY~companyId` via `ctx.GetStub().CreateCompositeKey()`
- All write operations require `RequireRole(ctx, "govt")`
- `RegisterCompany` accepts: `companyId, name, registrationNo, industry, tier, adminEmail, createdAt`
- `ApproveCompany` accepts: `companyId, updatedAt` — sets `Status=APPROVED`, records `ApprovedBy` from caller identity
- `SuspendCompany` accepts: `companyId, reason, updatedAt` — sets `Status=SUSPENDED`, `SuspendReason`, `SuspendedAt`

**Validation:** Unit-level: invoke `RegisterCompany`, then `GetCompany` returns the correct struct.

---

### Step 5: Implement EmployeeRegistryContract

**Goal:** Manage employee identity records on the ledger.

#### File: `contracts/employee_registry.go`

**Functions to Implement:**

| Function | Caller Role | Description |
|---|---|---|
| `RegisterEmployee` | `govt` or `company` | Creates a new employee identity record |
| `GetEmployee` | any | Retrieves an employee by ID |
| `UpdateEmployee` | `govt` | Updates employee details |
| `GetAllEmployees` | `govt` | Lists all employees |

**Implementation Details:**
- Use composite key `EMPLOYEE~employeeId`
- `RegisterEmployee` accepts: `employeeId, fullName, dateOfBirth, idHash, createdAt`
  - Sets `Status=ACTIVE`, `RegisteredBy` = caller's company ID (or "GOVT" if govt)
- `GetEmployee` returns the `Employee` struct
- `UpdateEmployee` allows modifying `FullName`, `Status`, `UpdatedAt`
- Duplicate `employeeId` registration should return an error

**Validation:** Register then query by ID.

---

### Step 6: Implement EmploymentLifecycleContract

**Goal:** Implement the full employment lifecycle: propose → consent → confirm → terminate.

#### File: `contracts/employment_lifecycle.go`

**Functions to Implement:**

| Function | Caller Role | Description |
|---|---|---|
| `ProposeEmployment` | `company` or `govt` | Company proposes employment with status `PROPOSED` |
| `EmployeeConsent` | `employee` or `govt` | Employee gives consent, status → `CONSENTED` |
| `ConfirmEmployment` | `govt` | Government confirms, status → `CONFIRMED` |
| `TerminateEmployment` | `company` or `govt` | Ends employment, status → `TERMINATED` |
| `GetEmployment` | any | Retrieves by employment ID |
| `GetEmploymentsByEmployee` | any | All employments for an employee |
| `GetEmploymentsByCompany` | `company` or `govt` | All employments for a company |

**Implementation Details:**
- **Primary key:** `EMPLOYMENT~employeeId~employmentId`
- **Secondary index:** `EMP_COMPANY~companyId~employmentId` (for company-scoped queries)
- `ProposeEmployment` accepts: `employmentId, employeeId, companyId, position, department, startDate, createdAt`
  - Validates that `companyId` exists and is `APPROVED`
  - Validates that `employeeId` exists and is `ACTIVE`
  - Generates `VerificationHash = SHA256(employeeId + companyId + startDate)`
  - Creates both composite keys
- `EmployeeConsent`: verifies current status is `PROPOSED`, transitions to `CONSENTED`
- `ConfirmEmployment`: verifies current status is `CONSENTED`, transitions to `CONFIRMED`
- `TerminateEmployment`: verifies status is `CONFIRMED`, transitions to `TERMINATED`, sets `EndDate`

**State Machine:**
```
PROPOSED → CONSENTED → CONFIRMED → TERMINATED
                                  ↘ DISPUTED
```

> **Phase 2 Note:** Since all callers currently use `Admin@central.govt`, the role checks should use the fallback (all treated as `govt`). The `company` and `employee` role paths will activate once CA enrollment is expanded.

**Validation:** Full lifecycle test: propose → consent → confirm → terminate, verifying status transitions.

---

### Step 7: Implement VerificationContract

**Goal:** Allow external verifiers to verify employment records and generate proofs.

#### File: `contracts/verification.go`

**Functions to Implement:**

| Function | Caller Role | Description |
|---|---|---|
| `VerifyEmployment` | `verifier` or `govt` | Checks if an employment record exists and is valid, creates verification record |
| `GetVerificationRecord` | any | Retrieves a verification record |
| `GetEmploymentHistory` | any | Returns full employment history for an employee |
| `GenerateVerificationProof` | `verifier` or `govt` | Generates a proof hash for an employment claim |

**Implementation Details:**
- `VerifyEmployment` accepts: `verificationId, employmentId, employeeId, verifierId, requestedAt`
  - Looks up employment record by `employmentId`
  - Creates a `VerificationRecord` with status `VERIFIED` (if found) or `NOT_FOUND`
  - Uses composite key `VERIFICATION~verificationId`
  - Secondary index: `VERIF_EMP~employmentId~verificationId`
- `GenerateVerificationProof`:
  - Looks up employment, returns a JSON proof containing: `VerificationHash`, `CompanyID`, `Status`, timestamp
  - Does NOT reveal sensitive data

**Validation:** Create employment → verify it → check `VerificationRecord` is correct.

---

### Step 8: Implement AccessControlContract

**Goal:** Provide centralized helper contract for role checks. This contract is primarily for admin introspection.

#### File: `contracts/access_control.go`

**Functions to Implement:**

| Function | Caller Role | Description |
|---|---|---|
| `GetCallerIdentity` | any | Returns caller's MSP ID, role, and company ID (for debugging/admin) |
| `ValidateAccess` | any | Returns whether the caller has a given role |

**Implementation Details:**
- This is a lightweight introspection contract.
- Uses `utils/identity.go` functions.
- Primarily useful for the God Mode UI to display who is calling what.

**Validation:** Call `GetCallerIdentity`, verify it returns correct MSP and role.

---

### Step 9: Wire Up SmartContract Router

**Goal:** Register all contracts under a single chaincode.

#### File: `smartcontract.go`

```go
package main

import (
    "github.com/nevs/chaincode/nevs/contracts"
)

// GetContracts returns all contract instances to be registered with the chaincode.
func GetContracts() []interface{} {
    return []interface{}{
        &contracts.CompanyRegistryContract{},
        &contracts.EmployeeRegistryContract{},
        &contracts.EmploymentLifecycleContract{},
        &contracts.VerificationContract{},
        &contracts.AccessControlContract{},
    }
}
```

Each contract struct must embed `contractapi.Contract` and optionally set a custom name via `GetName()`:

```go
type CompanyRegistryContract struct {
    contractapi.Contract
}

// All functions are accessed as:  CompanyRegistryContract:RegisterCompany
```

Alternatively, use `contractapi.Contract` with `SetName("CompanyRegistry")` in the contract's constructor so functions are accessed as `CompanyRegistry:RegisterCompany`.

---

### Step 10: Update main.go

**Goal:** Create the CCaaS entrypoint for the new chaincode.

#### File: `main.go`

```go
package main

import (
    "log"
    "os"

    "github.com/hyperledger/fabric-chaincode-go/shim"
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
    "github.com/nevs/chaincode/nevs/contracts"
)

func main() {
    chaincode, err := contractapi.NewChaincode(
        &contracts.CompanyRegistryContract{},
        &contracts.EmployeeRegistryContract{},
        &contracts.EmploymentLifecycleContract{},
        &contracts.VerificationContract{},
        &contracts.AccessControlContract{},
    )
    if err != nil {
        log.Panicf("Error creating NEVS chaincode: %v", err)
    }

    server := &shim.ChaincodeServer{
        CCID:    os.Getenv("CHAINCODE_ID"),
        Address: os.Getenv("CHAINCODE_SERVER_ADDRESS"),
        CC:      chaincode,
        TLSProps: shim.TLSProperties{
            Disabled: true,
        },
    }

    log.Printf("Starting NEVS chaincode server on %s", server.Address)
    if err := server.Start(); err != nil {
        log.Panicf("Error starting NEVS chaincode server: %v", err)
    }
}
```

**Validation:** `go build .` in the `nevs/` directory produces a binary without errors.

---

### Step 11: Build & Vendor Dependencies

**Goal:** Prepare the chaincode for Docker build.

**Actions:**

1. From `nevs-ledger/chaincode/nevs/`, run:
   ```powershell
   go mod tidy
   go mod vendor
   go build .
   ```

2. Verify no compilation errors.

3. Test that the `Dockerfile` builds:
   ```powershell
   docker build -t nevs-chaincode:latest -f Dockerfile .
   ```

**Validation:** Docker image builds successfully. Binary starts and awaits connection.

---

### Step 12: Deploy New Chaincode to Network

**Goal:** Deploy the `nevs` chaincode alongside the existing `employment` chaincode.

> ⚠️ **This step requires the Fabric network to be running.** Bring up all containers first.

**Actions:**

1. **Create a new Docker Compose file** for the new chaincode container:
   
   File: `nevs-ledger/network/docker/docker-compose.chaincode-nevs.yaml`
   
   ```yaml
   version: '3.7'
   
   networks:
     nevs_net:
       name: nevs_network
   
   services:
     nevs.cc:
       build:
         context: ../../chaincode/nevs
         dockerfile: Dockerfile
       container_name: nevs.cc
       environment:
         - CHAINCODE_SERVER_ADDRESS=0.0.0.0:9998
         - CHAINCODE_ID=${NEVS_CHAINCODE_ID:-pending_install}
         - CORE_PEER_TLS_ENABLED=false
       ports:
         - "9998:9998"
       networks:
         - nevs_net
   ```

2. **Package the chaincode** using the CLI container:
   ```bash
   # Inside CLI container
   peer lifecycle chaincode package nevs.tar.gz \
     --path /opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/nevs \
     --lang golang \
     --label nevs_1.0
   ```

3. **Install on both peers:**
   ```bash
   # On peer0
   peer lifecycle chaincode install nevs.tar.gz
   
   # Switch to peer1 env and install
   peer lifecycle chaincode install nevs.tar.gz
   ```

4. **Approve and commit** the chaincode definition:
   ```bash
   peer lifecycle chaincode approveformyorg \
     --channelID nevs-channel \
     --name nevs \
     --version 1.0 \
     --sequence 1 \
     --package-id <PACKAGE_ID> \
     --orderer orderer.nevs.gov:7050 \
     --tls --cafile <ORDERER_CA_PATH>
   
   peer lifecycle chaincode commit \
     --channelID nevs-channel \
     --name nevs \
     --version 1.0 \
     --sequence 1 \
     --orderer orderer.nevs.gov:7050 \
     --tls --cafile <ORDERER_CA_PATH> \
     --peerAddresses peer0.central.govt:7051 \
     --tlsRootCertFiles <PEER0_TLS_CA>
   ```

5. **Start the chaincode container:**
   ```powershell
   # Set the NEVS_CHAINCODE_ID env var to the installed package ID
   $env:NEVS_CHAINCODE_ID = "<package_id_from_install>"
   docker-compose -f docker-compose.chaincode-nevs.yaml up -d
   ```

6. **Verify:**
   ```bash
   peer lifecycle chaincode querycommitted --channelID nevs-channel --name nevs
   ```

**Validation:** `querycommitted` shows `nevs` chaincode is committed and active.

---

### Step 13: Expand Gateway API — Routes & Controllers

**Goal:** Add new API routes organized by role/domain.

#### New Route Files:

**`routes/govtRoutes.js`** — Government admin operations
```
POST   /api/v2/govt/companies              → Register a company
PUT    /api/v2/govt/companies/:id/approve   → Approve a company
PUT    /api/v2/govt/companies/:id/suspend   → Suspend a company
PUT    /api/v2/govt/companies/:id/reject    → Reject a company
GET    /api/v2/govt/companies               → List all companies
GET    /api/v2/govt/companies/status/:status → Filter by status
PUT    /api/v2/govt/employment/:id/confirm  → Confirm employment
```

**`routes/companyRoutes.js`** — Company operations
```
POST   /api/v2/company/employees            → Register an employee
POST   /api/v2/company/employment/propose    → Propose employment
PUT    /api/v2/company/employment/:id/terminate → Terminate employment
GET    /api/v2/company/employment            → List company's employments
```

**`routes/employeeRoutes.js`** — Employee operations
```
PUT    /api/v2/employee/employment/:id/consent → Employee consent
GET    /api/v2/employee/employment             → My employment history
GET    /api/v2/employee/profile                → My profile
```

**`routes/verifierRoutes.js`** — External verifier operations
```
POST   /api/v2/verifier/verify              → Verify an employment claim
GET    /api/v2/verifier/proof/:employmentId  → Generate verification proof
GET    /api/v2/verifier/record/:id           → Get verification record
```

#### New Controller Files:

Each controller maps to the corresponding contract functions. Controllers follow the same pattern as the existing `employmentController.js`:

1. Get the contract from `fabricService`
2. Call `submitTransaction` (write) or `evaluateTransaction` (read)
3. Parse and return the result via `successResponse` / `errorResponse`

**Key difference from Phase 1:** Controllers must specify the **contract name** when calling transactions:

```javascript
// Phase 1 (single contract)
const contract = fabricService.getContract();

// Phase 2 (named contracts)
const companyContract = fabricService.getContract('CompanyRegistryContract');
const employmentContract = fabricService.getContract('EmploymentLifecycleContract');
```

---

### Step 14: Update Gateway FabricService

**Goal:** Modify `fabricService.js` to support multiple named contracts from the `nevs` chaincode.

**Changes to `fabricService.js`:**

1. Add a new env var `CHAINCODE_NAME_V2=nevs` (or read from `.env`)
2. Add a method `getContractV2(contractName)`:

```javascript
getContractV2(contractName) {
    if (!this.network) {
        throw new Error('Fabric connection not initialized');
    }
    const chaincodeName = process.env.CHAINCODE_NAME_V2 || 'nevs';
    return this.network.getContract(chaincodeName, contractName);
}
```

3. Keep the existing `getContract()` method unchanged for backward compatibility.

**Changes to `.env`:**
```
CHAINCODE_NAME_V2=nevs
```

**Changes to `app.js`:**
```javascript
// Add new v2 route mounts
const govtRoutes = require('./routes/govtRoutes');
const companyRoutes = require('./routes/companyRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const verifierRoutes = require('./routes/verifierRoutes');

app.use('/api/v2/govt', govtRoutes);
app.use('/api/v2/company', companyRoutes);
app.use('/api/v2/employee', employeeRoutes);
app.use('/api/v2/verifier', verifierRoutes);
```

**Validation:** Gateway starts without errors and all v1 routes still work.

---

### Step 15: End-to-End Smoke Test

**Goal:** Validate the entire Phase 2 system works end-to-end.

**Test Scenario:**

```
1. Register a company        → POST /api/v2/govt/companies
2. Approve the company       → PUT  /api/v2/govt/companies/:id/approve
3. Register an employee      → POST /api/v2/company/employees
4. Propose employment        → POST /api/v2/company/employment/propose
5. Employee consent          → PUT  /api/v2/employee/employment/:id/consent
6. Government confirm        → PUT  /api/v2/govt/employment/:id/confirm
7. Verify employment         → POST /api/v2/verifier/verify
8. Generate proof            → GET  /api/v2/verifier/proof/:employmentId
9. Terminate employment      → PUT  /api/v2/company/employment/:id/terminate
10. Verify old v1 routes     → GET  /api/employment (should still work)
```

**Validation:** All 10 steps return expected HTTP status codes and response bodies.

---

## 6. Verification Plan

### Automated Tests

Since this is a Hyperledger Fabric chaincode project, traditional unit tests require mocking the `contractapi.TransactionContextInterface`. The recommended approach:

1. **Chaincode Compilation Test:**
   ```powershell
   cd nevs-ledger/chaincode/nevs
   go build .
   ```
   This verifies all contracts compile and the router wires correctly.

2. **Docker Build Test:**
   ```powershell
   cd nevs-ledger/chaincode/nevs
   docker build -t nevs-chaincode-test:latest .
   ```

3. **Gateway Startup Test:**
   ```powershell
   cd nevs-gateway
   node -e "require('./src/app')"
   ```
   This ensures all new routes are loaded without import errors.

### Manual/Integration Tests (Require Running Network)

1. **Bring up the network** — start all existing containers.
2. **Deploy `nevs` chaincode** — follow Step 12.
3. **Run the 10-step smoke test** from Step 15 using `curl` or Postman.
4. **Verify backward compatibility** — old `/api/employment` and `/api/godmode` routes still function.

### Suggested: Ask the User

> Since the project doesn't have existing Go unit tests or a test framework configured, it is recommended to **ask the user** whether they want to:
> - (a) Add Go mock-based unit tests for chaincode contracts
> - (b) Add a Postman/Newman collection for API integration tests
> - (c) Proceed without tests for now and test manually

---

## 7. File Change Summary

### New Files (Chaincode)

| File | Description |
|---|---|
| `nevs-ledger/chaincode/nevs/go.mod` | Go module definition |
| `nevs-ledger/chaincode/nevs/Dockerfile` | Container build file |
| `nevs-ledger/chaincode/nevs/main.go` | CCaaS entrypoint |
| `nevs-ledger/chaincode/nevs/smartcontract.go` | Multi-contract router |
| `nevs-ledger/chaincode/nevs/models/company.go` | Company data model |
| `nevs-ledger/chaincode/nevs/models/employee.go` | Employee data model |
| `nevs-ledger/chaincode/nevs/models/employment.go` | Employment data model |
| `nevs-ledger/chaincode/nevs/models/verification_record.go` | Verification data model |
| `nevs-ledger/chaincode/nevs/utils/composite_keys.go` | Composite key constants |
| `nevs-ledger/chaincode/nevs/utils/identity.go` | Identity/role extraction |
| `nevs-ledger/chaincode/nevs/contracts/company_registry.go` | Company registry contract |
| `nevs-ledger/chaincode/nevs/contracts/employee_registry.go` | Employee registry contract |
| `nevs-ledger/chaincode/nevs/contracts/employment_lifecycle.go` | Employment lifecycle contract |
| `nevs-ledger/chaincode/nevs/contracts/verification.go` | Verification contract |
| `nevs-ledger/chaincode/nevs/contracts/access_control.go` | Access control contract |

### New Files (Network)

| File | Description |
|---|---|
| `nevs-ledger/network/docker/docker-compose.chaincode-nevs.yaml` | Docker Compose for new chaincode container |

### New Files (Gateway)

| File | Description |
|---|---|
| `nevs-gateway/src/routes/govtRoutes.js` | Government API routes |
| `nevs-gateway/src/routes/companyRoutes.js` | Company API routes |
| `nevs-gateway/src/routes/employeeRoutes.js` | Employee API routes |
| `nevs-gateway/src/routes/verifierRoutes.js` | Verifier API routes |
| `nevs-gateway/src/controllers/companyController.js` | Company controller |
| `nevs-gateway/src/controllers/employeeController.js` | Employee controller |
| `nevs-gateway/src/controllers/lifecycleController.js` | Lifecycle controller |
| `nevs-gateway/src/controllers/verifierController.js` | Verifier controller |

### Modified Files

| File | Change |
|---|---|
| `nevs-gateway/src/app.js` | Add `/api/v2/*` route mounts |
| `nevs-gateway/src/services/fabricService.js` | Add `getContractV2()` method |
| `nevs-gateway/.env` | Add `CHAINCODE_NAME_V2=nevs` |
| `nevs-gateway/docker-compose.yaml` | Add `CHAINCODE_NAME_V2` env var |
| `nevs-gateway/src/controllers/godModeController.js` | Add `nevs.cc` to `ALLOWED_CONTAINERS` |

### Unchanged Files

| File | Reason |
|---|---|
| `nevs-ledger/chaincode/employment/*` | Preserved for rollback |
| `nevs-ledger/network/configtx/*` | Network config unchanged |
| `nevs-ledger/network/organizations/*` | Crypto material unchanged |
| All other `network/docker/*.yaml` files | Infrastructure unchanged |
| `nevs-godmode-ui/*` | UI unchanged in Phase 2 |

---

## 8. Risk & Rollback Strategy

| Risk | Mitigation |
|---|---|
| New chaincode doesn't compile | Fix Go build errors before packaging. Old `employment` chaincode remains active. |
| Chaincode deploy fails | The old `employment` chaincode is not affected. `nevs` is a separate chaincode name. |
| Gateway crashes with new routes | New routes are under `/api/v2/` prefix. Remove route imports in `app.js` to restore. |
| Identity/role fallback doesn't work | All callers currently use `Admin@central.govt` from `CentralGovtMSP`. The fallback in `identity.go` handles this. |
| Network instability during deploy | Use `peer lifecycle chaincode queryinstalled` before committing to verify installation succeeded. |

**Rollback procedure:**
1. Stop `nevs.cc` container
2. Remove new route imports from `app.js`
3. Restart gateway
4. Network returns to Phase 1 state with zero data loss

---

> **This document is self-contained.** Any AI agent or developer can follow these 15 steps sequentially to implement NEVS Phase 2 from the current codebase state.
