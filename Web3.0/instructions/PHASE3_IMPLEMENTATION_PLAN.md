# 🚀 NEVS Phase 3 — Multi-Org Architecture Implementation Plan

> **Objective:** Transform NEVS from a single-org centralized ledger (`CentralGovtMSP`) into a distributed multi-organization trust network with `CompanyOrgMSP`, decentralized endorsement, and a Private Data Collection (PDC) privacy layer.

---

## Current Topology Snapshot

| Component | Details |
|---|---|
| **Orderer** | `orderer.nevs.gov:7050` (`OrdererMSP`, EtcdRaft, TLS) |
| **Orderer CA** | `ca.nevs.gov:8054` |
| **Central Govt CA** | `ca.central.govt:7054` |
| **Peer0 (Govt)** | `peer0.central.govt:7051` (`CentralGovtMSP`) |
| **Peer1 (Govt)** | `peer1.central.govt:8051` (`CentralGovtMSP`) |
| **Channel** | `nevs-channel` (genesis has only `CentralGovtMSP`) |
| **Chaincode** | `employment` v1.0, sequence 1 (CCaaS at `employment.cc:9999`) |
| **Endorsement Policy** | Default `MAJORITY Endorsement` (ImplicitMeta) |
| **Gateway** | Node.js Fabric SDK, discovery enabled, SSE readiness stream |
| **CLI** | `hyperledger/fabric-tools:2.5`, defaults to `peer0.central.govt` |

---

## Phase 3.1 — CompanyOrg Identity Infrastructure

**Goal:** Create the `CompanyOrgMSP` identity material using a dedicated Fabric CA.

**Dependencies:** None. This is the foundation for all subsequent phases.

### Step 1: Create CompanyOrg CA Docker Compose

Create `docker-compose-ca-company.yaml` in `nevs-ledger/network/docker/`.

- **Service:** `ca.company.org`
- **Image:** `hyperledger/fabric-ca:1.5.7`
- **Port mapping:** `9054:7054` (host:container, avoids conflict with existing CAs)
- **Volume mount:** `../organizations/peerOrganizations/company.org/ca:/etc/hyperledger/fabric-ca-server`
- **Network:** `nevs_net` (external: `nevs_network`)
- **Bootstrap credentials:** `admin:adminpw`

### Step 2: Start CompanyOrg CA

```bash
docker-compose -f docker-compose-ca-company.yaml up -d
```

Wait ~5 seconds for the CA server to initialize and generate its root certificate.

### Step 3: Enroll CompanyOrg Admin and Peer Identities

Create `enroll_company.sh` in `nevs-ledger/scripts/bash/`. It must:

1. **Register and enroll the Org Admin:**
   - Set `FABRIC_CA_CLIENT_HOME` to `../network/organizations/peerOrganizations/company.org`
   - Enroll admin against `ca.company.org` (port `9054`)
   - Store admin credentials in `users/Admin@company.org/msp`

2. **Register and enroll `peer0.company.org`:**
   - Register with `--id.type peer`
   - Enroll MSP to `peers/peer0.company.org/msp`
   - Enroll TLS to `peers/peer0.company.org/tls` with `--csr.hosts peer0.company.org,localhost`
   - Copy TLS artifacts: `keystore/* → server.key`, `signcerts/* → server.crt`, `tlscacerts/* → ca.crt`

3. **Create the Org-level MSP directory:**
   - Copy `cacerts/`, `tlscacerts/` from the enrolled admin into `organizations/peerOrganizations/company.org/msp/`
   - Create `config.yaml` in the MSP directory with `NodeOUs` enabled (same pattern as `central.govt/msp/config.yaml`)

> [!IMPORTANT]
> The `config.yaml` file in the MSP directory is critical. Without `NodeOUs` enabled, the peer will fail to validate its own identity. Copy the exact structure from `central.govt/msp/config.yaml` and update the certificate filenames.

### Step 4: Verify Identity Material

Confirm the following directory tree exists before proceeding:

```
organizations/peerOrganizations/company.org/
├── ca/                          # CA server data (auto-generated)
├── msp/
│   ├── cacerts/                 # Root CA cert
│   ├── tlscacerts/              # TLS CA cert
│   └── config.yaml              # NodeOUs configuration
├── peers/
│   └── peer0.company.org/
│       ├── msp/                 # Peer identity
│       └── tls/                 # Peer TLS certs (server.key, server.crt, ca.crt)
└── users/
    └── Admin@company.org/
        └── msp/                 # Admin identity
```

> [!CAUTION]
> **Risk Point:** If `config.yaml` is missing or incorrect, the peer will crash on startup with `NodeOUs not enabled` errors. Validate this file before starting the peer container.

---

## Phase 3.2 — CompanyOrg Peer Deployment

**Goal:** Bring `peer0.company.org` online and connect it to the Docker network.

**Dependencies:** Phase 3.1 must be complete (identity material exists).

### Step 5: Create CompanyOrg Peer Docker Compose

Create `docker-compose-peer-company.yaml` in `nevs-ledger/network/docker/`.

| Config | Value |
|---|---|
| **Image** | `hyperledger/fabric-peer:2.5` |
| **Container name** | `peer0.company.org` |
| **Listen port** | `9051` (host and container) |
| **Chaincode address** | `peer0.company.org:9052` |
| **MSPID** | `CompanyOrgMSP` |
| **MSP volume** | `../organizations/peerOrganizations/company.org/peers/peer0.company.org/msp` |
| **TLS volume** | `../organizations/peerOrganizations/company.org/peers/peer0.company.org/tls` |
| **Gossip bootstrap** | `peer0.company.org:9051` |
| **Gossip external endpoint** | `peer0.company.org:9051` |
| **Network** | `nevs_net` (`nevs_network`) |

### Step 6: Start the CompanyOrg Peer

```bash
docker-compose -f docker-compose-peer-company.yaml up -d
```

### Step 7: Verify Peer Startup

```bash
docker logs peer0.company.org --tail 20
```

Confirm the peer starts without errors and logs its listen address as `0.0.0.0:9051`.

> [!WARNING]
> The `core.yaml` inside the Fabric peer image already includes the CCaaS external builder at `/opt/hyperledger/ccaas_builder`. No manual `core.yaml` modifications are needed for peer images ≥ 2.5, **provided** the image is the official `hyperledger/fabric-peer:2.5`.

---

## Phase 3.3 — Channel Configuration Update

**Goal:** Add `CompanyOrgMSP` to the existing `nevs-channel` via a channel configuration update transaction.

**Dependencies:** Phase 3.2 (peer is running), Phase 3.1 (MSP material exists).

> [!IMPORTANT]
> This is the most complex and risk-sensitive phase. A malformed config update will be rejected by the orderer. Each step must be executed in exact sequence.

### Step 8: Fetch Current Channel Config

From the CLI container (or a `fabric-tools` container), targeting `peer0.central.govt`:

```bash
peer channel fetch config config_block.pb \
  -o orderer.nevs.gov:7050 \
  -c nevs-channel \
  --tls \
  --cafile $ORDERER_CA
```

### Step 9: Decode Config to JSON

```bash
configtxlator proto_decode --input config_block.pb --type common.Block \
  | jq '.data.data[0].payload.data.config' > config.json
```

### Step 10: Create Modified Config

Create `modified_config.json` by adding `CompanyOrgMSP` to the `Application.groups` section.

This requires:

1. **Generating the CompanyOrg JSON definition** using `configtxgen -printOrg`:
   - First, add `CompanyOrgMSP` to `configtx.yaml` as a new organization anchor (without modifying existing profiles):

   ```yaml
   - &CompanyOrg
     Name: CompanyOrgMSP
     ID: CompanyOrgMSP
     MSPDir: ../organizations/peerOrganizations/company.org/msp
     AnchorPeers:
       - Host: peer0.company.org
         Port: 9051
     Policies:
       Readers:
         Type: Signature
         Rule: "OR('CompanyOrgMSP.member')"
       Writers:
         Type: Signature
         Rule: "OR('CompanyOrgMSP.member')"
       Admins:
         Type: Signature
         Rule: "OR('CompanyOrgMSP.admin')"
       Endorsement:
         Type: Signature
         Rule: "OR('CompanyOrgMSP.member')"
   ```

2. **Print the org definition:**

   ```bash
   configtxgen -printOrg CompanyOrgMSP -configPath ../configtx > company_org.json
   ```

3. **Inject into config.json using jq:**

   ```bash
   jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups":{"CompanyOrgMSP":.[1]}}}}}' \
     config.json company_org.json > modified_config.json
   ```

### Step 11: Compute Config Update Delta

```bash
configtxlator proto_encode --input config.json --type common.Config --output config.pb
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
configtxlator compute_update --channel_id nevs-channel --original config.pb --updated modified_config.pb --output config_update.pb
configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json
```

### Step 12: Wrap and Sign the Update

```bash
echo '{"payload":{"header":{"channel_header":{"channel_id":"nevs-channel","type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' \
  | jq . > config_update_envelope.json

configtxlator proto_encode --input config_update_envelope.json --type common.Envelope --output config_update_envelope.pb
```

### Step 13: Submit the Config Update

Since the channel's `Admins` policy is `MAJORITY Admins` and there is currently only one org (`CentralGovtMSP`), only the CentralGovt admin signature is needed:

```bash
peer channel update -f config_update_envelope.pb \
  -o orderer.nevs.gov:7050 \
  -c nevs-channel \
  --tls \
  --cafile $ORDERER_CA
```

### Step 14: Join CompanyOrg Peer to Channel

From a CLI context targeting `peer0.company.org`:

```bash
# Fetch the genesis block
peer channel fetch 0 nevs-channel.block \
  -o orderer.nevs.gov:7050 \
  -c nevs-channel \
  --tls \
  --cafile $ORDERER_CA

# Join the channel
peer channel join -b nevs-channel.block
```

### Step 15: Set CompanyOrg Anchor Peer

Submit an anchor peer update for `CompanyOrgMSP` on `nevs-channel`:

```bash
peer channel fetch config config_block.pb -o orderer.nevs.gov:7050 -c nevs-channel --tls --cafile $ORDERER_CA
# Decode → modify anchorPeers for CompanyOrgMSP → encode → compute delta → submit update
```

> [!CAUTION]
> **Risk Point:** If the anchor peer is not set, cross-org gossip will not work, and the Gateway SDK's discovery service will never discover `CompanyOrgMSP` peers. This will cause the dual-org endorsement policy to fail silently.

---

## Phase 3.4 — Chaincode Lifecycle Update (Multi-Org Endorsement)

**Goal:** Install chaincode on `peer0.company.org`, approve for `CompanyOrgMSP`, and re-commit with the new dual-org endorsement policy.

**Dependencies:** Phase 3.3 (CompanyOrg has joined the channel).

### Step 16: Install CCaaS Package on CompanyOrg Peer

Using the same `employment.tar.gz` package:

```bash
# From CLI targeting peer0.company.org (MSP = CompanyOrgMSP)
peer lifecycle chaincode install /tmp/employment.tar.gz
```

The CCaaS `connection.json` inside the tarball points to `employment.cc:9999`. Since `peer0.company.org` is on the same Docker network (`nevs_network`), it can reach the chaincode container.

### Step 17: Approve Chaincode for CompanyOrgMSP

```bash
peer lifecycle chaincode approveformyorg \
  -o orderer.nevs.gov:7050 \
  --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID nevs-channel \
  --name employment \
  --version 1.0 \
  --package-id $PACKAGE_ID \
  --sequence 2
```

> [!IMPORTANT]
> The `--sequence` must be incremented to `2`. Fabric requires a new sequence for any definition change, including endorsement policy updates.

### Step 18: Re-Approve for CentralGovtMSP

CentralGovt must also approve the updated definition at sequence 2 with the new endorsement policy:

```bash
# From CLI targeting peer0.central.govt (MSP = CentralGovtMSP)
peer lifecycle chaincode approveformyorg \
  -o orderer.nevs.gov:7050 \
  --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID nevs-channel \
  --name employment \
  --version 1.0 \
  --package-id $PACKAGE_ID \
  --sequence 2 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"
```

### Step 19: Check Commit Readiness

```bash
peer lifecycle chaincode checkcommitreadiness \
  --channelID nevs-channel \
  --name employment \
  --version 1.0 \
  --sequence 2 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"
```

Both orgs must show `true` before proceeding.

### Step 20: Commit Updated Chaincode Definition

```bash
peer lifecycle chaincode commit \
  -o orderer.nevs.gov:7050 \
  --ordererTLSHostnameOverride orderer.nevs.gov \
  --tls --cafile $ORDERER_CA \
  --channelID nevs-channel \
  --name employment \
  --version 1.0 \
  --sequence 2 \
  --signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')" \
  --peerAddresses peer0.central.govt:7051 \
  --tlsRootCertFiles /path/to/central.govt/peer0/tls/ca.crt \
  --peerAddresses peer0.company.org:9051 \
  --tlsRootCertFiles /path/to/company.org/peer0/tls/ca.crt
```

> [!CAUTION]
> **Risk Point:** The commit must specify `--peerAddresses` for **both** orgs. If only one org's peer is listed, the commit will fail because the new endorsement policy requires both signatures.

### Step 21: Verify Committed Definition

```bash
peer lifecycle chaincode querycommitted --channelID nevs-channel --name employment
```

Confirm: `Sequence: 2`, `Endorsement Plugin: escc`, `Validation Plugin: vscc`, and the signature policy shows `AND(CentralGovtMSP.peer, CompanyOrgMSP.peer)`.

---

## Phase 3.5 — Private Data Collection (PDC)

**Goal:** Introduce a PDC for sensitive employment data (salary, compensation) accessible only to `CentralGovtMSP` and `CompanyOrgMSP`.

**Dependencies:** Phase 3.4 must be complete.

### Step 22: Define `collections_config.json`

Create `nevs-ledger/chaincode/employment/collections_config.json`:

```json
[
  {
    "name": "employmentPrivateData",
    "policy": "OR('CentralGovtMSP.member', 'CompanyOrgMSP.member')",
    "requiredPeerCount": 1,
    "maxPeerCount": 3,
    "blockToLive": 0,
    "memberOnlyRead": true,
    "memberOnlyWrite": true
  }
]
```

| Field | Rationale |
|---|---|
| `requiredPeerCount: 1` | At least one peer from the eligible orgs must receive the private data during endorsement |
| `blockToLive: 0` | Private data is never purged (permanent record) |
| `memberOnlyRead/Write: true` | Only `CentralGovtMSP` or `CompanyOrgMSP` members can read/write |

### Step 23: Add Private Data Model to Chaincode

Add a new struct in Go:

```go
type EmploymentPrivateData struct {
    RecordID     string `json:"recordId"`
    Salary       string `json:"salary"`
    Compensation string `json:"compensation"`
}
```

### Step 24: Add Private Data Chaincode Functions

Add two new functions to `smartcontract.go`:

1. **`SetPrivateEmploymentData`** — Uses `ctx.GetStub().PutPrivateData("employmentPrivateData", key, data)`
2. **`GetPrivateEmploymentData`** — Uses `ctx.GetStub().GetPrivateData("employmentPrivateData", key)`

The private data is passed via the `transient` field of the transaction proposal, **not** as regular arguments.

### Step 25: Rebuild CCaaS Container

```bash
cd nevs-ledger/network/docker
docker-compose -f docker-compose.chaincode.yaml up -d --build
```

### Step 26: Redeploy Chaincode with PDC (Sequence 3)

Repeat the lifecycle flow (install → approve both orgs → commit) with:
- `--sequence 3`
- `--collections-config /path/to/collections_config.json`
- Same `--signature-policy "AND('CentralGovtMSP.peer','CompanyOrgMSP.peer')"`

---

## Phase 3.6 — Gateway Update

**Goal:** Update the Node.js Gateway to route transactions to both orgs for endorsement.

**Dependencies:** Phase 3.4 (dual endorsement is live).

### Step 27: Update Connection Profile

Add `CompanyOrgMSP` to `nevs-gateway/config/connection-profile.json`:

- Add `CompanyOrg` to `organizations` (with `mspid: CompanyOrgMSP`)
- Add `peer0.company.org` to `peers` (URL: `grpcs://peer0.company.org:9051`, TLS path)
- Add `peer0.company.org` to `channels.nevs-channel.peers` (endorsing + query)

### Step 28: Update `fabricService.js` for Local Path Rewriting

Add a rewriting block for `peer0.company.org` matching the existing pattern for `peer0.central.govt` and `peer1.central.govt`.

### Step 29: Update Gateway Docker Compose

In `nevs-gateway/docker-compose.yaml`, mount the CompanyOrg crypto material:

```yaml
volumes:
  - ../nevs-ledger/network/organizations:/organizations
```

This already exists and covers all orgs since the entire `organizations/` folder is mounted.

### Step 30: Add Transient Data Support to Employment Controller

Update the controller's `createRecord` handler to:
1. Accept optional `salary`/`compensation` fields in the request body.
2. Pass them via `contract.createTransaction('CreateEmploymentRecord').setTransient(...)` instead of regular arguments.

---

## Phase 3.7 — Validation

**Goal:** Verify the complete lifecycle with dual endorsement and PDC.

**Dependencies:** All previous phases.

### Test 1: Basic Transaction (Dual Endorsement)

Submit `CreateEmploymentRecord` from the Gateway. Verify:
- Transaction is endorsed by **both** `peer0.central.govt` and `peer0.company.org`
- Transaction commits successfully
- Record appears on both peers' world state

### Test 2: Private Data Write/Read

Submit a transaction with transient salary data. Verify:
- Private data is stored in the `employmentPrivateData` collection
- `GetPrivateEmploymentData` returns the salary from an authorized org peer
- Unauthorized orgs (if any future Tier-1/2 orgs exist) cannot read the PDC

### Test 3: Service Discovery

Confirm the Gateway SDK's discovery service returns endorsers from **both** organizations:

```bash
# From the gateway logs
✅ Discovery ready: 2 endorser(s) connected.
```

### Test 4: Full Lifecycle

Execute: **Create Record → Update Status → Get History → Get All Records**

All operations must succeed with dual endorsement and return consistent results.

---

## Dependency Graph

```
Phase 3.1 (CompanyOrg Identity)
    │
    ▼
Phase 3.2 (CompanyOrg Peer)
    │
    ▼
Phase 3.3 (Channel Config Update)  ← HIGHEST RISK
    │
    ▼
Phase 3.4 (Chaincode Lifecycle)
    │
    ├──────────────────────┐
    ▼                      ▼
Phase 3.5 (PDC)     Phase 3.6 (Gateway)
    │                      │
    └──────────┬───────────┘
               ▼
        Phase 3.7 (Validation)
```

---

## Risk Summary

| Risk | Phase | Mitigation |
|---|---|---|
| Missing `config.yaml` (NodeOUs) in CompanyOrg MSP | 3.1 | Copy from `central.govt/msp/config.yaml`, update cert filenames |
| Malformed channel config update | 3.3 | Always `diff config.json modified_config.json` before encoding |
| Anchor peer not set for CompanyOrg | 3.3 | Cross-org gossip won't work; discovery will fail |
| Sequence number mismatch during chaincode commit | 3.4 | Always run `querycommitted` first to verify current sequence |
| CCaaS container unreachable from CompanyOrg peer | 3.4 | Ensure `peer0.company.org` is on the same Docker network (`nevs_network`) |
| PDC policy mismatch | 3.5 | `collections_config.json` must list the exact MSP IDs |

---

## Files to Create (Summary)

| File | Location |
|---|---|
| `docker-compose-ca-company.yaml` | `nevs-ledger/network/docker/` |
| `docker-compose-peer-company.yaml` | `nevs-ledger/network/docker/` |
| `enroll_company.sh` | `nevs-ledger/scripts/bash/` |
| `collections_config.json` | `nevs-ledger/chaincode/employment/` |
| `EmploymentPrivateData` struct + PDC functions | `nevs-ledger/chaincode/employment/` |

## Files to Modify (Summary)

| File | Change |
|---|---|
| `configtx.yaml` | Add `CompanyOrgMSP` organization definition |
| `connection-profile.json` | Add `CompanyOrg` org + `peer0.company.org` peer |
| `fabricService.js` | Add local path rewriting for `peer0.company.org` |
| `smartcontract.go` | Add PDC read/write functions |
| `employmentController.js` | Add transient data support for private fields |
| `start_network.sh` | Add CompanyOrg CA + peer startup commands |
| `resume_network.sh` | Add CompanyOrg peer resume command |
| `deploy_chaincode.sh` | Add CompanyOrg install + approve steps |
