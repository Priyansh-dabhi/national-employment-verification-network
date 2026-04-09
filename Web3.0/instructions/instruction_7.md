# 📌 MASTER PROMPT — NEVS GOD MODE BACKEND (DEMO PHASE)

We are building a **God Mode Admin Backend** for demonstration purposes.

This backend will connect to an already running:

* Hyperledger Fabric v2.5 network
* CCaaS chaincode deployment model
* Channel: `nevs-channel`
* Chaincode name: `employment`
* MSP: `CentralGovtMSP`
* State DB: LevelDB (DO NOT CHANGE)
* TLS enabled
* Peer and Orderer already running
* Chaincode already committed and functional

The ledger is operational and tested via CLI.

We are NOT modifying:

* Network configuration
* MSP IDs
* Channel
* CCaaS model
* Docker setup
* Chaincode execution model
* Folder structure of nevs-ledger

We are ONLY building a backend layer that connects to the ledger using the Fabric SDK.

---

# 🎯 OBJECTIVE

Build a production-style backend that:

* Connects to Fabric using Node.js SDK
* Uses `fabric-network`
* Uses CentralGovtMSP admin identity
* Connects securely via connection profile
* Exposes REST APIs
* Cleanly separates services, routes, config
* Demonstrates ledger interaction clearly

This backend will later power a React frontend.

For now:

> Backend only. No frontend work.

---

# 🧠 EXPECTATION FROM YOU (AGENT)

You must:

1. First produce a full architectural plan.
2. Show folder structure.
3. Explain identity management strategy.
4. Explain wallet setup.
5. Explain connection profile usage.
6. Define all REST endpoints.
7. Only after planning approval, provide implementation code.

Do NOT:

* Guess paths
* Assume missing certificates
* Invent connection profiles
* Modify Fabric network
* Suggest installing Go
* Suggest re-packaging chaincode
* Suggest recreating network
* Suggest CouchDB
* Suggest changing endorsement policy

Work strictly with the existing running network.

If something is required (like path to admin cert), explicitly ask for it.

No hallucinations allowed.

---

# 🏛 BACKEND REQUIREMENTS

## 1️⃣ Technology

* Node.js (LTS)
* Express.js
* fabric-network
* dotenv
* Proper logging
* Structured error handling

No TypeScript for demo speed.
Use JavaScript.

---

## 2️⃣ Folder Structure (MANDATORY CLEAN STRUCTURE)

Propose something like:

```
nevs-gateway/
│
├── config/
│   └── connection-profile.json
│
├── wallet/
│
├── services/
│   └── fabricService.js
│
├── routes/
│   └── employmentRoutes.js
│
├── controllers/
│   └── employmentController.js
│
├── utils/
│   └── responseHandler.js
│
├── app.js
├── server.js
├── package.json
└── .env
```

You may improve structure but must keep clean separation.

---

## 3️⃣ Core REST Endpoints (GOD MODE VIEW)

Implement:

### Create Employment Record

POST `/api/employment`

### Get All Employment Records

GET `/api/employment`

### Get Employment Record by ID

GET `/api/employment/:id`

### (Optional if exists in chaincode)

Update Status
PUT `/api/employment/:id/status`

If a function does not exist in chaincode,
ask before implementing.

---

## 4️⃣ Fabric Connection Strategy

Use:

```js
Gateway
Wallets
```

Connection Flow:

1. Load connection profile
2. Load wallet identity ([Admin@central.govt](mailto:Admin@central.govt))
3. Connect gateway
4. Get network (nevs-channel)
5. Get contract (employment)
6. Submit / Evaluate transaction

Connection must:

* Use TLS
* Respect existing certs
* Not disable security

---

## 5️⃣ Logging Strategy

For demo impact:

Each request should log:

* Transaction type
* TxID
* Timestamp
* Success/Failure
* Ledger response

This will impress during demo.

---

## 6️⃣ Demo Narrative Alignment

The backend must support demonstration of:

* Ledger immutability
* Blockchain-backed state
* Deterministic writes
* Chaincode invocation
* Real transaction submission

Responses should include:

```json
{
  "success": true,
  "txId": "...",
  "data": {...}
}
```

Structured and clean.

---

# 🚦 EXECUTION PHASES

You must proceed in phases:

### Phase 1 – Architecture Plan

* Folder structure
* Connection flow explanation
* Wallet plan
* Required files list
* Env variables required

STOP and wait for approval.

---

### Phase 2 – Backend Implementation

* Provide complete code
* No placeholders
* No pseudo code
* No missing imports
* No “assume this exists”

Everything must be runnable.

---

### Phase 3 – Testing Instructions

* How to start backend
* How to test with curl/Postman
* Example payloads
* Expected output

---

# 🔐 IMPORTANT CONSTRAINTS

* Do NOT touch nevs-ledger folder
* Do NOT edit docker-compose
* Do NOT reconfigure peer
* Do NOT regenerate certs
* Do NOT recreate channel
* Do NOT switch to CouchDB
* Do NOT change CCaaS model
* Do NOT suggest legacy Docker chaincode build
* Do NOT simplify TLS
* Do NOT disable security for demo

---

# 🎯 FINAL GOAL

We are building a **Professor-Level Demonstration Backend** that shows:

“Here is a Government Blockchain Ledger, and here is the secure backend talking to it.”

This must look professional, structured, and architecturally sound.

Frontend will be built later after backend approval.

---

Start with:

## PHASE 1 – ARCHITECTURE PLAN

Do not write code yet.

Wait for my approval before proceeding to implementation.
