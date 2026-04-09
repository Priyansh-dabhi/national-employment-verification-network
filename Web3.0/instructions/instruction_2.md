# 📌 MASTER PROMPT — CONFIGTX + GENESIS GENERATION

---

You are now generating the **System Genesis Block** for the NEVS Hyperledger Fabric network.

⚠️ STRICT CONTEXT

We already have:

* Separate CA for Orderer Org (`nevs.gov`)
* Separate CA for Peer Org (`central.govt`)
* Orderer Org MSP fully initialized
* Orderer Node MSP and TLS fully generated
* Peer Org MSP already exists
* No genesis block generated yet

We are now configuring governance and consensus.

We are NOT starting peer.
We are NOT creating application channel.
We are ONLY generating system genesis block.

---

# 🎯 OBJECTIVE

1. Create a clean `configtx.yaml`
2. Ensure MSP IDs match existing MSP folders
3. Configure etcdraft consensus
4. Generate `system-genesis-block/genesis.block`
5. Validate success

---

# 🔒 LOCKED MSP IDS (DO NOT CHANGE)

Orderer Org MSP ID:

```
OrdererMSP
```

Peer Org MSP ID:

```
CentralGovtMSP
```

These MUST match the MSP IDs used previously.

---

# 📁 FILE LOCATION

Create or modify:

```
network/configtx/configtx.yaml
```

Do not place it anywhere else.

---

# 🧱 CONFIGTX STRUCTURE REQUIREMENTS

The file must contain:

---

## 1️⃣ Organizations Section

Define:

### Orderer Org

```
Name: OrdererMSP
ID: OrdererMSP
MSPDir: ../organizations/ordererOrganizations/nevs.gov/msp
Policies:
  Readers: Signature: "OR('OrdererMSP.member')"
  Writers: Signature: "OR('OrdererMSP.member')"
  Admins: Signature: "OR('OrdererMSP.admin')"
  Endorsement: Signature: "OR('OrdererMSP.member')"
```

---

### Central Govt Peer Org

```
Name: CentralGovtMSP
ID: CentralGovtMSP
MSPDir: ../organizations/peerOrganizations/central.govt/msp
Policies:
  Readers: Signature: "OR('CentralGovtMSP.member')"
  Writers: Signature: "OR('CentralGovtMSP.member')"
  Admins: Signature: "OR('CentralGovtMSP.admin')"
  Endorsement: Signature: "OR('CentralGovtMSP.member')"
```

---

## 2️⃣ Capabilities Section

Enable:

```
Channel: V2_0
Orderer: V2_0
Application: V2_0
```

---

## 3️⃣ Orderer Section

Configure:

```
OrdererType: etcdraft
Addresses:
  - orderer.nevs.gov:7050

BatchTimeout: 2s
BatchSize:
  MaxMessageCount: 10
  AbsoluteMaxBytes: 99 MB
  PreferredMaxBytes: 512 KB

EtcdRaft:
  Consenters:
    - Host: orderer.nevs.gov
      Port: 7050
      ClientTLSCert: ../organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/server.crt
      ServerTLSCert: ../organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/server.crt
```

Paths must be relative to configtx.yaml location.

---

## 4️⃣ Application Section

Basic default policies using:

```
Readers
Writers
Admins
Endorsement
```

Using ImplicitMeta policies.

---

## 5️⃣ Consortium Definition

Create:

```
Consortiums:
  NEVSConsortium:
    Organizations:
      - CentralGovtMSP
```

---

## 6️⃣ Profiles Section

Create profile:

```
NEVSOrdererGenesis:
  Orderer:
    OrdererType: etcdraft
    Organizations:
      - OrdererMSP
    Capabilities:
      V2_0: true
  Consortiums:
    NEVSConsortium:
      Organizations:
        - CentralGovtMSP
  Capabilities:
    V2_0: true
```

---

# ⚠️ PATH VALIDATION RULE

Before generating genesis:

Print:

* Absolute path of configtx.yaml
* Absolute path of Orderer MSP
* Absolute path of TLS cert used in Consenters

Ensure files exist.

Stop if any path does not exist.

---

# 🧱 GENESIS GENERATION COMMAND

From inside:

```
network/configtx
```

Run:

```
export FABRIC_CFG_PATH=$PWD
```

Then:

```
configtxgen \
-profile NEVSOrdererGenesis \
-channelID system-channel \
-outputBlock ../system-genesis-block/genesis.block
```

---

# 🔍 VALIDATION CHECKLIST

After generation:

1. Confirm file exists:

```
network/system-genesis-block/genesis.block
```

2. Print block info using:

```
configtxgen -inspectBlock ../system-genesis-block/genesis.block
```

3. Ensure:

   * OrdererMSP appears
   * CentralGovtMSP appears
   * etcdraft metadata present

If any error appears:
STOP and print full error.

---

# 🚫 OUT OF SCOPE

* Do NOT start orderer
* Do NOT create docker compose yet
* Do NOT create application channel
* Do NOT modify peer configuration

This phase only generates genesis block.

---

# 🎯 EXPECTED FINAL STRUCTURE

```
network/
├── configtx/
│   └── configtx.yaml
├── system-genesis-block/
│   └── genesis.block
```

---

# 🧠 IMPORTANT

Do not assume defaults.
Do not use sampleconfig from fabric-samples.
Do not auto-generate MSP IDs.
Use exactly the MSP folders already created.

---

Proceed step-by-step and print outputs clearly.

Stop immediately if configtxgen fails.