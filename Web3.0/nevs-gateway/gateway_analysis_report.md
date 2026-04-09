# NEVS Gateway - Backend Analysis Report

This report provides a detailed analysis of the `nevs-gateway`, which serves as the administrative and integration layer between the application frontend and the Hyperledger Fabric blockchain network.

---

## 🏗️ Architecture & Core Components

The `nevs-gateway` is a Node.js Express application designed to manage identity, handle high-throughput blockchain transactions, and provide "God Mode" administrative capabilities.

### 1. Ledger Interaction Service (`src/services/fabricService.js`)
This is the heart of the gateway. It manages:
- **Identity Management**: Uses X.509 certificates and private keys stored in a local `wallet`.
- **Connection Lifecycle**: Initializes connections to the Fabric network using `fabric-network` SDK. It handles network discovery and provides exponential back-off retries to ensure endorsers are connected after a network restart.
- **Dynamic Configuration**: Automatically rewrites connection profile URLs (Docker hostnames vs. `127.0.0.1`) based on the environment.
- **Contract Access**: Gatekeeps access to both V1 (`employment`) and V2 (`nevs`) chaincodes.

### 2. "God Mode" Chaos Monkey (`src/controllers/godModeController.js`)
The gateway provides unique administrative power to control the physical infrastructure of the ledger:
- **Peer Control**: Can programmatically `stop` and `start` Docker containers for Peers and Orderers.
- **Sync Monitoring**: Real-time monitoring of block heights across all peers via the `qscc` system chaincode.
- **Status Streaming**: Uses **Server-Sent Events (SSE)** to stream the readiness status of the Fabric network to the frontend.

---

## 🛤️ API Surface & Logic Mapping

### 🏛️ Government Operations (`/api/v2/govt`)
Managed by the `CentralGovt` identity.
- **Company Lifecycle**: Registration, Approval, Suspension, and Rejection of participating organizations.
- **Confirmation**: Final confirmation of employment records on the ledger.

### 🏢 Company Operations (`/api/v2/company`)
Managed by corporate identities.
- **Employee Onboarding**: Registering new employees on the platform.
- **Employment Proposals**: Proposing a new employment record (state machine: `PROPOSED`).
- **Termination**: Marking a ledger record as terminated.

### 👥 Employee Operations (`/api/v2/employee`)
- **Consent Management**: Employees must provide ledger-recorded consent for employment proposals created by companies.
- **History Tracking**: Fetching a complete, immutable history of all employment events for an individual.

### 🔍 Verifier Operations (`/api/v2/verifier`)
- **Verification Proofs**: Generates cryptographic proofs that an employment record exists and is valid.
- **History Queries**: Allows external verifiers (with permission) to view employment history.

---

## 🔐 Security & Ledger Patterns

1.  **Transaction Strategies**: Uses `MSPID_SCOPE_ANYFORTX` strategy, allowing any peer within the organization to handle the transaction, increasing resilience.
2.  **Private Data Collections (PDC)**: Sensitive fields like `salary` and `compensation` are passed via **Transient Data** in transaction proposals. They are stored in private state and are never part of the public ledger blocks.
3.  **State Machine**: Employment records transition through specific states (`PROPOSED` -> `CONSENTED` -> `CONFIRMED` -> `TERMINATED`) ensuring business logic consistency.
4.  **Transaction Logging**: Every ledger interaction (Evaluate vs. Submit) is logged with its Transaction ID (TxID) and the specific peer that handled the request.

---

## 🗄️ Infrastructure Overview

- **Port**: `3000` (Default)
- **Containerization**: Includes a `Dockerfile` and `docker-compose.yaml` for independent scaling.
- **Storage**:
    - **Wallet**: Local filesystem for X.509 identities.
    - **Config**: Network connection profiles in JSON format.
    - **Persistence**: Final state is recorded on the Hyperledger Fabric ledger (LevelDB/CouchDB).

---

> [!IMPORTANT]
> The `nevs-gateway` acts as the single source of truth for the frontend. It is specifically optimized to wait for ledger discovery to be "ready" before allowing state-changing operations, preventing transaction failures during network cold starts.
