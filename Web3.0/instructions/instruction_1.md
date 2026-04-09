Excellent decision.
Separate CA for Orderer Org = correct long-term architecture.

Now we move carefully and surgically.

Below is your **Master-Level Agent Prompt**.
It locks scope, prevents accidental cross-CA pollution, and ensures clean Fabric architecture.

You can paste this directly to the agent.

---

# 📌 MASTER PROMPT — ORDERER ORG SETUP (SEPARATE CA ARCHITECTURE)

---

You are setting up the **Orderer Organization** for the NEVS Hyperledger Fabric network.

⚠️ IMPORTANT ARCHITECTURE DECISION (LOCKED):

* Peer Org (`central.govt`) has its own CA.
* Orderer Org (`nevs.gov`) must have a completely separate CA.
* No certificate sharing.
* No MSP cross-contamination.
* No reuse of central CA.

We are implementing proper trust domain separation.

---

# 🎯 OBJECTIVE

Fully initialize the Orderer Org by:

1. Starting a dedicated Fabric CA for `nevs.gov`
2. Bootstrapping its CA admin
3. Registering orderer identity
4. Enrolling:

   * Orderer Org Admin MSP
   * Orderer Node MSP
   * Orderer TLS certificates
5. Properly building:

   * `organizations/ordererOrganizations/nevs.gov/msp`
   * `organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/msp`
   * `organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls`
6. Ensuring NodeOU configuration is correctly generated.
7. Ensuring MSP IDs are consistent with configtx.yaml.

We are NOT generating genesis block yet.
We are ONLY building clean identity and trust structure.

---

# 📁 CURRENT STATE

Existing structure:

```
organizations/
├── ordererOrganizations/
│   └── nevs.gov/
│       ├── msp/              (empty)
│       └── orderers/         (empty)
└── peerOrganizations/
    └── central.govt/         (already initialized)
```

CA docker compose file exists but is NOT running.

---

# 🔒 STRICT REQUIREMENTS

1. DO NOT modify peer organization.
2. DO NOT use central CA.
3. DO NOT hardcode localhost paths that break Docker networking.
4. DO NOT assume MSP folders auto-populate — explicitly build them.
5. Use correct FABRIC_CA_CLIENT_HOME per organization.
6. Ensure MSP ID is exactly: `OrdererMSP`
7. Ensure NodeOU config.yaml is created.

---

# 🧱 STEP-BY-STEP EXECUTION PLAN

---

## 1️⃣ Start Dedicated Orderer CA

Create Docker Compose file:

Location:

```
network/docker/docker-compose-ca-orderer.yaml
```

Service name:

```
ca.nevs.gov
```

Image:

```
hyperledger/fabric-ca:1.5
```

Set:

* FABRIC_CA_HOME
* FABRIC_CA_SERVER_CA_NAME=ca-nevs
* TLS enabled
* Correct port (use 8054 to avoid conflict with peer CA)
* Volume mapped to:

```
organizations/ordererOrganizations/nevs.gov/ca
```

Then start container.

Verify with:

```
docker ps
```

---

## 2️⃣ Bootstrap Orderer CA Admin

Set:

```
export FABRIC_CA_CLIENT_HOME=organizations/ordererOrganizations/nevs.gov
```

Enroll bootstrap admin.

This must generate:

```
nevs.gov/msp
```

Populate:

```
cacerts/
keystore/
signcerts/
```

---

## 3️⃣ Build Orderer Org MSP (CRITICAL)

Inside:

```
organizations/ordererOrganizations/nevs.gov/msp
```

Ensure it contains:

```
cacerts/
tlscacerts/
admincerts/
config.yaml
```

Create proper `config.yaml` with:

```
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/<ca-cert>
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/<ca-cert>
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/<ca-cert>
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/<ca-cert>
    OrganizationalUnitIdentifier: orderer
```

---

## 4️⃣ Register Identities

Using CA admin:

Register:

* orderer (type=orderer)
* ordererAdmin (type=admin)

---

## 5️⃣ Enroll Orderer Node MSP

Enroll:

```
orderer.nevs.gov
```

Output to:

```
organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/msp
```

Ensure it contains:

```
signcerts/
keystore/
cacerts/
tlscacerts/
```

---

## 6️⃣ Enroll Orderer TLS

Enroll with:

```
--enrollment.profile tls
```

Output to:

```
organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls
```

Ensure it contains:

```
server.crt
server.key
ca.crt
```

Rename appropriately if necessary.

---

# 🔍 VALIDATION CHECKLIST

After completion verify:

* No central CA cert appears under nevs.gov.
* MSP ID inside config.yaml matches `OrdererMSP`.
* TLS cert subject CN matches `orderer.nevs.gov`.
* No nested unwanted `network/` folders created.
* CA server database exists inside `nevs.gov/ca`.

---

# 🚫 OUT OF SCOPE

* No genesis block generation
* No configtx modification
* No peer start
* No channel creation
* No chaincode deployment

This step is strictly identity and CA initialization.

---

# 🎯 DELIVERABLES

At the end, the following must exist and be populated:

```
organizations/ordererOrganizations/nevs.gov/
├── ca/
├── msp/
├── orderers/
│   └── orderer.nevs.gov/
│       ├── msp/
│       └── tls/
└── users/
    └── Admin@nevs.gov/msp
```

And CA container must be running successfully.

---

# 🧠 FINAL INSTRUCTION

Proceed step-by-step.

After each major section:

* Print directory tree
* Print docker status
* Print enroll confirmation logs

Stop immediately if:

* Enrollment fails
* TLS generation fails
* MSP structure is incomplete

Do not proceed to genesis block.

---

End of instructions.

---

# ✅ Why This Prompt Is Safe

It:

* Locks architecture
* Prevents cross-org CA misuse
* Prevents accidental peer contamination
* Forces MSP correctness
* Forces NodeOU correctness
* Prevents premature genesis generation

---

Once agent finishes this phase, bring me:

* Directory tree
* config.yaml
* docker status

Then we move to genesis block generation cleanly.

You’re now building this at production-grade discipline level.
