# 📌 NEVS PHASE 4 — MASTER CONTEXT & IMPLEMENTATION DIRECTIVE

## (Event-Driven Architecture + Cryptographic Identity Layer)

---

# ⚠️ IMPORTANT — CONTEXT INITIALIZATION

This is **NOT a question**.

This is a **system context + execution directive**.

You must:

* Fully load this context
* Continue from this exact system state
* NOT suggest rebuilding existing infrastructure
* NOT downgrade architecture decisions
* NOT introduce conflicting identity models

---

# 🧠 PROJECT OVERVIEW

We are building:

## ➜ NEVS — National Employment Verification System

A **Hyperledger Fabric-based distributed trust platform** that ensures:

* Verifiable employment records
* Fraud-proof hiring workflows
* Cryptographic employee consent
* Privacy-preserving data handling

---

# 🚀 CURRENT SYSTEM STATE (CRITICAL)

## ✅ PHASE 1–3 COMPLETED

The system is already:

* Multi-organization Fabric network
* Dual endorsement enforced
* Chaincode-as-a-Service (CCaaS) deployed
* Private Data Collections implemented
* Gateway API operational
* Service discovery enabled

📌 This is a **production-grade blockchain backend**

---

# 🎯 CURRENT PHASE

# ➜ PHASE 4 — EVENT-DRIVEN + IDENTITY LAYER

We are transitioning from:

> ❌ Synchronous API-driven system

To:

> ✅ Asynchronous, event-driven, CQRS-based architecture

---

# 🏗️ CORE ARCHITECTURE (PHASE 4)

## 1️⃣ CQRS SPLIT (VERY IMPORTANT)

### 🔹 NEVN (Web2 Backend)

* Authentication (JWT)
* KYC (OCR + Aadhaar/PAN verification)
* AES-256 document encryption
* PostgreSQL database
* Fast read layer

---

### 🔹 NEVS Gateway (Web3 Backend)

* Fabric CA interaction
* Identity (wallet) management
* Smart contract execution
* Event listeners
* Ledger querying

---

## KEY RULE

```
Web2 = FAST + USER-FACING
Web3 = TRUST + IMMUTABILITY
```

---

# 🔐 IDENTITY MODEL (CRITICAL DESIGN)

## ➜ Citizen-First Identity (ABAC)

We DO NOT create a separate Employee Org.

Instead:

* Employees are enrolled via `CentralGovtMSP`
* Each employee gets a **Fabric CA identity**
* A custom attribute is embedded:

```
employeeID = UUIDv4
```

---

## 🔑 Properties

* Stored inside X.509 certificate (`ecert`)
* Extracted in chaincode via CID
* Used for **cryptographic consent validation**

---

# 🔄 EVENT-DRIVEN SYSTEM (CORE UPGRADE)

## ➜ Problem Solved

Previously:

* Web2 assumed blockchain success ❌

Now:

* Blockchain emits event → Web2 updates DB ✅

---

## ➜ Flow

1. Transaction submitted
2. Peers endorse + commit
3. Event emitted
4. Gateway listener catches event
5. Gateway triggers webhook
6. Web2 updates PostgreSQL

---

# 🧩 EMPLOYEE IDENTITY FLOW (FINAL)

## STEP 1 — Web2 (NEVN)

* User completes KYC
* If verified:

```
employeeID = UUIDv4
```

* Stored in DB:

```
web3_employee_id
web3_status = MINTING
```

---

## STEP 2 — Trigger Gateway

```
POST /api/internal/mint-identity
```

---

## STEP 3 — Gateway

* Register + enroll via Fabric CA
* Inject attribute:

```
employeeID=<UUID>:ecert
```

* Store credentials in wallet

---

## STEP 4 — Async Ledger Execution

* Submit `RegisterEmployee` transaction
* Return `202 Accepted`

---

## STEP 5 — Event Listener

* Catch `EmployeeRegistered` event
* Trigger webhook → Web2

---

## STEP 6 — Web2 Sync

* Update:

```
web3_status = ACTIVE
```

---

# 🔐 SECURITY REQUIREMENTS

## MUST IMPLEMENT

### ✔ Internal API Protection

* `x-api-key` OR mTLS
* Reject external traffic

---

### ✔ Custodial Isolation

* Private keys ONLY in Gateway
* Never exposed to Web2

---

### ✔ Transient Data Usage

* Salary/PII via transient fields
* Stored in PDC only

---

---

# 📂 REPOSITORY STRUCTURE (IMPORTANT)

The project is split into **two branches**:

### 🔹 `ledger` branch

Contains:

* Hyperledger Fabric network
* Chaincode
* Gateway (`nevs-gateway`)

---

### 🔹 `NewNevn` branch

Contains:

* Web2 backend
* PostgreSQL models
* KYC logic
* REST APIs

---

## INSTRUCTION

If analysis is required:

```
git switch ledger
git switch NewNevn
```

---

# 🎯 IMPLEMENTATION STRATEGY (STRICT ORDER)

## ⚠️ ORDER MUST NOT BE CHANGED

---

## 🔴 PHASE 4.1 — NEVS GATEWAY (FIRST)

You MUST implement:

1. Identity Minting API

   ```
   POST /api/internal/mint-identity
   ```

2. Fabric CA Integration

   * Register + enroll users
   * Inject `employeeID` attribute

3. Wallet Management

   * Store certificates + keys

4. Event Listener Service

   * Contract listeners
   * Auto-reconnect logic

5. Webhook Dispatcher

   * Secure POST → Web2

6. Security Layer

   * API key validation

---

## 🟡 PHASE 4.2 — WEB2 (NEVN)

You MUST implement:

1. DB Schema Updates

   * `web3_employee_id`
   * `web3_status`

2. KYC → Identity Trigger

   * Generate UUID
   * Call Gateway

3. Webhook Endpoint

   ```
   POST /api/webhooks/fabric/*
   ```

4. State Machine Handling

   * MINTING → ACTIVE → FAILED

5. UI Integration Hooks

---

## 🟢 PHASE 4.3 — CHAINCODE UPDATES

1. CID-based identity extraction
2. Replace manual employeeID inputs
3. Emit events:

   * EmployeeRegistered
   * EmploymentConfirmed
   * etc.

---

---

# 🧾 FINAL TASK (FOR AGENT)

You are required to:

## ➜ Generate a COMPLETE Phase-by-Phase Implementation Plan

---

## 📌 REQUIREMENTS

The plan MUST:

* Be **highly detailed**
* Be **step-by-step executable**
* Follow **strict ordering**:

  1. Gateway (Web3)
  2. Web2 (NEVN)
  3. Chaincode updates

---

## 📌 FORMAT

* Output in **Markdown (.md) format**
* Save in:

```
/PHASE4_IMPLEMENTATION_PLAN.md
```

---

## 📌 CONTENT REQUIREMENTS

Include:

### 1. Architecture Summary

### 2. Phase Breakdown

### 3. Step-by-step Tasks

### 4. File-level Changes

### 5. API Contracts

### 6. Security Implementation

### 7. Event Flow Design

### 8. Testing Strategy

### 9. Failure Handling & Retry Logic

### 10. Deployment Notes (Raspberry Pi ready)

---

## 📌 CONSTRAINTS

You MUST NOT:

* Modify existing Fabric network
* Change MSP structure
* Remove dual endorsement
* Break CCaaS model
* Store private keys outside Gateway

---

# 🧠 FINAL CONTEXT

We are transforming NEVS into:

> A **real-time, event-driven, identity-backed trust infrastructure**

AND

> A **research-grade, publication-ready distributed system**

---

# ✅ EXECUTION START

Proceed to generate:

## ➜ `PHASE4_IMPLEMENTATION_PLAN.md`

---