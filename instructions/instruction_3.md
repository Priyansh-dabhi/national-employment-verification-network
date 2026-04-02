# 📌 MASTER PROMPT — START ORDERER SAFELY

You can give this to the agent.

---

You are now starting the Orderer node for the NEVS Hyperledger Fabric network.

⚠️ Context:

* Genesis block has already been generated at:
  `network/system-genesis-block/genesis.block`
* Orderer Org MSP is located at:
  `network/organizations/ordererOrganizations/nevs.gov/msp`
* Orderer Node MSP is located at:
  `network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/msp`
* Orderer TLS folder exists at:
  `network/organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls`

We are NOT starting peers.
We are ONLY starting the orderer container.

---

# 🎯 OBJECTIVE

1. Create `network/docker/docker-compose-orderer.yaml`
2. Properly configure environment variables
3. Mount genesis block
4. Mount MSP and TLS directories
5. Start orderer container
6. Verify successful startup

---

# 🧱 DOCKER SERVICE CONFIGURATION

Service name:

```
orderer.nevs.gov
```

Image:

```
hyperledger/fabric-orderer:2.4
```

Container name:

```
orderer.nevs.gov
```

---

# 🔑 REQUIRED ENV VARIABLES

```
ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
ORDERER_GENERAL_LISTENPORT=7050
ORDERER_GENERAL_GENESISMETHOD=file
ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/genesis.block
ORDERER_GENERAL_LOCALMSPID=OrdererMSP
ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp

ORDERER_GENERAL_TLS_ENABLED=true
ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]

ORDERER_CHANNELPARTICIPATION_ENABLED=true
ORDERER_ADMIN_TLS_ENABLED=true
ORDERER_ADMIN_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
ORDERER_ADMIN_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
ORDERER_ADMIN_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]

ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:7053
```

---

# 📦 VOLUME MOUNTS

Mount:

```
../system-genesis-block/genesis.block
→ /var/hyperledger/orderer/genesis.block

../organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/msp
→ /var/hyperledger/orderer/msp

../organizations/ordererOrganizations/nevs.gov/orderers/orderer.nevs.gov/tls
→ /var/hyperledger/orderer/tls
```

---

# 🌐 PORTS

Expose:

```
7050:7050
7053:7053
```

---

# 🚀 START COMMAND

From `network/docker`:

```
docker-compose -f docker-compose-orderer.yaml up -d
```

---

# 🔍 VERIFICATION

Run:

```
docker ps
```

Then:

```
docker logs orderer.nevs.gov
```

Look for:

```
Starting orderer
Starting raft node
Beginning to serve requests
Created system channel
```

There must be NO MSP validation errors.
NO TLS errors.
NO missing genesis errors.

Stop immediately if any occur.

---

# 🧠 What Success Looks Like

If successful:

* Orderer container is running
* Port 7050 is listening
* System channel ledger is created
* No crash loop

At this moment:

NEVS blockchain is alive.