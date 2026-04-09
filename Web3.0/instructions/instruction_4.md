# 📌 MASTER PROMPT — APPLICATION CHANNEL + PEER BOOTSTRAP

Give this entire instruction block to the agent.

---

You are now setting up the first application channel for the NEVS Fabric network and starting the first peer (CentralGovt).

⚠️ Current State:

* Orderer container is running and healthy.
* Genesis block exists.
* MSPs and TLS for Orderer and CentralGovt are already created.
* We are NOT modifying Orderer setup.
* We are creating the first application channel.

---

# 🎯 OBJECTIVES

1. Add new channel profile to configtx.yaml
2. Generate channel creation transaction
3. Create docker-compose for peer
4. Start peer container
5. Create channel
6. Join peer to channel
7. Set anchor peer
8. Verify ledger creation

---

# 🧱 STEP 1 — Add Channel Profile

Modify:

```
network/configtx/configtx.yaml
```

Add under Profiles:

```
NEVSChannel:
  Consortium: NEVSConsortium
  <<: *ChannelDefaults
  Application:
    <<: *ApplicationDefaults
    Organizations:
      - *CentralGovt
    Capabilities:
      <<: *ApplicationCapabilities
```

Do NOT modify genesis profile.

---

# 🧱 STEP 2 — Generate Channel Creation Transaction

From:

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
-profile NEVSChannel \
-channelID nevs-channel \
-outputCreateChannelTx ../channel-artifacts/nevs-channel.tx
```

If `channel-artifacts` does not exist, create it.

Verify the file exists.

---

# 🧱 STEP 3 — Create Peer Docker Compose

Create:

```
network/docker/docker-compose-peer.yaml
```

Service name:

```
peer0.central.govt
```

Image:

```
hyperledger/fabric-peer:2.4
```

Environment:

```
CORE_PEER_ID=peer0.central.govt
CORE_PEER_ADDRESS=peer0.central.govt:7051
CORE_PEER_LISTENADDRESS=0.0.0.0:7051
CORE_PEER_CHAINCODEADDRESS=peer0.central.govt:7052
CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
CORE_PEER_LOCALMSPID=CentralGovtMSP
CORE_PEER_MSPCONFIGPATH=/var/hyperledger/peer/msp

CORE_PEER_TLS_ENABLED=true
CORE_PEER_TLS_CERT_FILE=/var/hyperledger/peer/tls/server.crt
CORE_PEER_TLS_KEY_FILE=/var/hyperledger/peer/tls/server.key
CORE_PEER_TLS_ROOTCERT_FILE=/var/hyperledger/peer/tls/ca.crt

CORE_PEER_GOSSIP_BOOTSTRAP=peer0.central.govt:7051
CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.central.govt:7051
```

Volumes:

```
../organizations/peerOrganizations/central.govt/peers/peer0.central.govt/msp
→ /var/hyperledger/peer/msp

../organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls
→ /var/hyperledger/peer/tls
```

Expose:

```
7051:7051
```

---

# 🧱 STEP 4 — Start Peer

From `network/docker`:

```
docker-compose -f docker-compose-peer.yaml up -d
```

Verify container is running.

Check logs:

```
docker logs peer0.central.govt
```

Ensure no MSP or TLS errors.

---

# 🧱 STEP 5 — Create Channel

Set environment for CLI:

```
CORE_PEER_LOCALMSPID=CentralGovtMSP
CORE_PEER_MSPCONFIGPATH=organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp
CORE_PEER_ADDRESS=localhost:7051
CORE_PEER_TLS_ROOTCERT_FILE=organizations/peerOrganizations/central.govt/peers/peer0.central.govt/tls/ca.crt
```

Then run:

```
peer channel create \
-o localhost:7050 \
-c nevs-channel \
-f channel-artifacts/nevs-channel.tx \
--outputBlock channel-artifacts/nevs-channel.block \
--tls \
--cafile organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt
```

---

# 🧱 STEP 6 — Join Peer to Channel

```
peer channel join \
-b channel-artifacts/nevs-channel.block
```

---

# 🧱 STEP 7 — Set Anchor Peer

Generate anchor update:

```
configtxgen \
-profile NEVSChannel \
-outputAnchorPeersUpdate ../channel-artifacts/CentralGovtMSPanchors.tx \
-channelID nevs-channel \
-asOrg CentralGovtMSP
```

Submit update:

```
peer channel update \
-o localhost:7050 \
-c nevs-channel \
-f channel-artifacts/CentralGovtMSPanchors.tx \
--tls \
--cafile organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls/ca.crt
```

---

# 🔍 VERIFICATION

Run:

```
peer channel list
```

Should show:

```
nevs-channel
```

Check peer logs for:

* Ledger created
* Joined channel successfully
* Gossip initialized

---

# 🎯 EXPECTED FINAL STATE

```
Orderer running
Peer running
Channel exists
Peer joined channel
Ledger initialized
```

At this moment:

NEVS blockchain is operational.

---

After this, we move to:

➜ Deploy first chaincode (Employment Registry)

---

Execute step-by-step.
Stop if any TLS or MSP error appears.
