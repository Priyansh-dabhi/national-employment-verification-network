# 📌 MASTER PROMPT — IMPLEMENT PEER SYNC MONITOR (FABRIC v2.5 + CCaaS)

We are extending the existing **nevs-gateway God Mode backend**.

Current system state:

* Hyperledger Fabric v2.5
* CCaaS chaincode
* Channel: `nevs-channel`
* Chaincode: `employment`
* MSP: `CentralGovtMSP`
* Two peers:

  * `peer0.central.govt`
  * `peer1.central.govt`
* etcdraft (Raft)
* TLS enabled
* Service discovery enabled
* Gateway container inside same Docker network
* Docker socket mounted
* Chaos APIs already exist:

  * GET `/api/godmode/network/status`
  * POST `/api/godmode/peer/stop`
  * POST `/api/godmode/peer/start`

Backend is fully functional.

We now want to implement **deterministic Peer Sync Monitoring**.

---

# 🎯 OBJECTIVE

When a peer:

* Is manually stopped and restarted via God Mode

We want to detect:

1. When it comes back online
2. Whether it is catching up
3. When it has fully synchronized
4. If synchronization fails

We must NOT rely on logs manually.
We must implement programmatic detection.

---

# 🚨 IMPORTANT ARCHITECTURAL TRUTH

Fabric does NOT broadcast sync completion.

There is:

* No webhook
* No “SYNC COMPLETE” event
* No cluster health push

Sync must be inferred from:

→ Ledger block height comparison

World state sync is deterministic via block replay.

Therefore:

If block height matches highest network height → peer is synced.

This is the ONLY authoritative check.

---

# 🧠 IMPLEMENTATION STRATEGY

We will implement:

## 1️⃣ Block Height Retrieval Per Peer

Using Fabric system chaincode:

`qscc`

Invoke:

```
GetChainInfo
```

Parameters:

```
channel name: nevs-channel
```

We must target specific peers.

IMPORTANT:

You must NOT assume service discovery.
You must explicitly target:

* peer0.central.govt
* peer1.central.govt

Use:

```js
contract.evaluateTransaction(...)
```

OR lower-level query handler if needed.

If necessary, configure gateway to allow targeting peers explicitly.

Do NOT modify Fabric network.

---

## 2️⃣ Determine Max Network Height

Compute:

```
maxHeight = highest block height among active peers
```

---

## 3️⃣ Sync State Machine

For each peer, compute status:

If container not running:

```
OFFLINE
```

If running AND height < maxHeight:

```
CATCHING_UP
```

If running AND height == maxHeight:

```
SYNCED
```

If running BUT height does not increase over configurable timeout:

```
SYNC_STALLED
```

---

## 4️⃣ New API Endpoint

Implement:

### GET `/api/godmode/peers/sync-status`

Return structured response:

```json
{
  "networkHeight": 42,
  "peers": [
    {
      "name": "peer0.central.govt",
      "status": "SYNCED",
      "height": 42
    },
    {
      "name": "peer1.central.govt",
      "status": "CATCHING_UP",
      "height": 38
    }
  ]
}
```

Response must include:

* Timestamp
* Success flag
* No unstructured raw output

---

# 🛑 CONSTRAINTS

You MUST NOT:

* Modify nevs-ledger folder
* Modify docker-compose files
* Recreate channel
* Touch CCaaS deployment
* Change MSP IDs
* Disable TLS
* Add CouchDB
* Change endorsement policy
* Repackage chaincode
* Use CLI shell commands unless absolutely required
* Parse container logs for sync detection

All sync detection must be block-height-based.

---

# 🔍 IMPLEMENTATION REQUIREMENTS

Proceed in phases.

---

## PHASE 1 — Technical Plan

Before writing code:

Explain:

1. How you will query qscc
2. How you will target specific peers
3. How gateway connection will be reused
4. How you will avoid conflicting with existing fabricService
5. How you will compute sync state
6. What files you will modify/add
7. Any new dependencies (if required)

STOP after planning.
Wait for approval.

---

## PHASE 2 — Implementation

Provide:

* New service module (e.g. `peerMonitorService.js`)
* Integration into existing godmode routes
* Clean error handling
* Deterministic JSON responses
* No pseudo code
* No placeholders
* No assumptions

All code must be runnable.

---

## PHASE 3 — Testing Guide

Provide:

* How to test via Postman
* Expected response when:

  * Both peers online
  * One peer offline
  * Peer catching up
* Example output

---

# 🏆 DEMO GOAL

After implementation, we should be able to:

1. Stop peer0.
2. Create multiple employment records.
3. Restart peer0.
4. Call `/api/godmode/peers/sync-status`.
5. See:

```
CATCHING_UP (height 38 / 42)
```

6. After a few seconds:

```
SYNCED (42 / 42)
```

This must work deterministically.

---

# ⚠️ NO HALLUCINATION POLICY

If:

* Access to qscc fails
* Peer targeting requires adjustment
* Gateway configuration needs clarification

You MUST ask.

Do NOT invent behavior.

---

# 🎯 START NOW

Begin with:

## PHASE 1 — TECHNICAL PLAN

Do not write implementation yet.
Wait for my approval before coding.