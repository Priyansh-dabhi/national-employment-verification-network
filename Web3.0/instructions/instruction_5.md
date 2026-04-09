# 📌 MASTER PROMPT — NEVS CHAINCODE DEVELOPMENT & DEPLOYMENT PHASE (V1)

Paste everything below into a new chat:

---

We are now transitioning into the **Chaincode Development & Deployment Phase (Version 1)** of the National Employment Verification System (NEVS).

The underlying blockchain network has already been fully built and stabilized using **Hyperledger Fabric v2.4**.

This prompt defines the exact current state and instructs you to proceed without re-architecting any infrastructure.

---

# 🏛 CURRENT NETWORK STATE (DO NOT MODIFY)

The following infrastructure is complete and operational:

### Blockchain Type

* Hyperledger Fabric v2.4
* etcdraft (Raft) consensus
* TLS enabled everywhere
* NodeOU enabled
* Separate Fabric CA per organization
* Production-style MSP structure

---

## 🔐 Organizations

### 1️⃣ Orderer Organization

* MSP ID: `OrdererMSP`
* Domain: `nevs.gov`
* System channel bootstrapped
* Raft leader stable
* No TLS errors

### 2️⃣ Peer Organization

* MSP ID: `CentralGovtMSP`
* Domain: `central.govt`
* Peer joined to application channel
* Anchor peer configured
* Ledger initialized cleanly

---

## 📦 Channels

### System Channel

* Successfully created
* Orderer operational

### Application Channel

* Channel ID: `nevs-channel`
* Peer joined
* Anchor peer configured
* No MSP mismatch errors
* No TLS handshake warnings

---

# ⚠ STRICT CONSTRAINTS

You must:

* NOT reconfigure the network
* NOT recreate channels
* NOT modify MSP structure
* NOT change TLS setup
* NOT redesign endorsement policy unless required
* Use existing `nevs-channel`
* Use MSP IDs:

  * `OrdererMSP`
  * `CentralGovtMSP`
* Follow Fabric v2 lifecycle strictly

We are continuing from the existing operational ledger state.

---

# 🚀 DEVELOPMENT PHASE OBJECTIVE

We will now design, implement, and deploy the first smart contract:

## ➜ Employment Registry Chaincode (Version 1)

---

# 💻 PROGRAMMING LANGUAGE

The chaincode must be written in:

## ➜ Go (Golang)

Using:

* `fabric-contract-api-go`
* Fabric v2 lifecycle model
* Deterministic state logic
* Clean error handling
* No unnecessary abstractions

No JavaScript.
No Java.
No external dependencies beyond Fabric SDK.

---

# 🎯 VERSION 1 SCOPE (MINIMAL & CORRECT)

The Employment Registry must support:

1. `CreateEmploymentRecord`
2. `GetEmploymentRecord`
3. `UpdateEmploymentStatus`
4. `GetEmploymentHistory`

---

# 📌 DATA MODEL CONSTRAINTS

* Salary must NOT be included
* No private data collections in v1
* No company org logic yet
* No access control logic yet
* Only public employment relationship data

The record should include:

* RecordID
* EmployeeID
* EmployerID
* Position
* StartDate (ISO8601 string)
* EndDate (optional)
* Status (ACTIVE / TERMINATED)
* CreatedAt
* UpdatedAt

Dates must be passed deterministically (no time.Now()).

---

# 🗝 KEY STRATEGY

Use composite keys structured as:

```
EMPLOYMENT~employeeId~recordId
```

Use Fabric composite key APIs properly.

No world-state scans.
No inefficient queries.

---

# 🔄 LIFECYCLE REQUIREMENTS

Deployment must follow:

1. Package
2. Install
3. QueryInstalled
4. ApproveForMyOrg
5. Commit
6. QueryCommitted

On:

```
nevs-channel
```

Sequence:

```
1
```

Version:

```
1.0
```

Endorsement policy: single org default (CentralGovtMSP)

---

# 🧠 DESIGN PRINCIPLES

* Deterministic writes
* Explicit error messages
* Upgrade-safe struct design
* Clean separation of model and contract
* No over-engineering
* Future-ready for multi-org expansion

---

# 🔮 FUTURE PHASES (NOT NOW)

Later phases will include:

* Company Organizations
* Private Data Collections (salary storage)
* Multi-org endorsement
* Employee-signed transactions
* Off-chain hashing
* Governance expansion

Do NOT implement these now.

Focus strictly on Version 1 correctness.

---

# 🛠 REQUIRED OUTPUT FROM YOU

Proceed step-by-step:

1. Finalize the data model struct design
2. Design composite key logic
3. Write complete Go chaincode files
4. Provide directory structure
5. Provide go.mod
6. Provide lifecycle CLI deployment commands
7. Provide test invoke and query commands
8. Explain how to verify correct deployment

Do not skip steps.

Do not assume missing context.

Continue from the exact network state defined above.