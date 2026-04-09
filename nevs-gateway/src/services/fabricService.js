const { Gateway, Wallets, DefaultEventHandlerStrategies } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class FabricService extends EventEmitter {
    constructor() {
        super();
        this.gateway = null;
        this.network = null;
        this.contract = null;
        this.isReady = false;
    }

    /**
     * Waits until the SDK's discovery service has populated at least one
     * connected endorser. After a fresh Docker start the peer's gossip layer
     * may not be ready when the Gateway first connects, causing submitTransaction
     * to fail while evaluateTransaction works fine.
     *
     * This helper disconnects and reconnects with exponential back-off so the
     * SDK re-runs discovery on each attempt.
     */
    async _waitForDiscovery(ccp, wallet, adminUser, channelName, isLocal, maxRetries = 5) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const channel = this.network.getChannel();
            const endorsers = channel.getEndorsers();
            const connectedEndorsers = endorsers.filter(e => e.connected);

            if (connectedEndorsers.length > 0) {
                console.log(`✅ Discovery ready: ${connectedEndorsers.length} endorser(s) connected.`);
                this.isReady = true;
                this.emit('ready', { isReady: true });
                return; // Good to go
            }

            const delaySec = attempt * 3; // 3s, 6s, 9s, 12s, 15s
            console.log(`⏳ Discovery attempt ${attempt}/${maxRetries}: No connected endorsers yet. Retrying in ${delaySec}s...`);

            // Tear down the stale connection
            this.isReady = false;
            this.emit('disconnected', { isReady: false });
            this.gateway.disconnect();
            this.gateway = null;
            this.network = null;
            this.contract = null;

            await new Promise(resolve => setTimeout(resolve, delaySec * 1000));

            // Reconnect
            this.gateway = new Gateway();
            await this.gateway.connect(ccp, {
                wallet,
                identity: adminUser,
                discovery: { enabled: true, asLocalhost: isLocal },
                eventHandlerOptions: {
                    commitTimeout: 30,
                    strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
                }
            });
            this.network = await this.gateway.getNetwork(channelName);
            this.contract = this.network.getContract(process.env.CHAINCODE_NAME || 'employment');
        }

        // Final check after all retries
        const channel = this.network.getChannel();
        const endorsers = channel.getEndorsers().filter(e => e.connected);
        if (endorsers.length === 0) {
            throw new Error('Discovery failed: No connected endorsers found after maximum retries. Ensure peers are fully started.');
        }
    }

    async initConnection() {
        try {
            this.isReady = false;
            this.emit('disconnected', { isReady: false });
            const mspId = process.env.MSPID || 'CentralGovtMSP';
            const adminUser = process.env.ADMIN_USER || 'Admin@central.govt';
            const channelName = process.env.CHANNEL_NAME || 'nevs-channel';
            const chaincodeName = process.env.CHAINCODE_NAME || 'employment';

            // Paths inside the Docker container
            const walletPath = process.env.WALLET_PATH || path.join(__dirname, '..', '..', 'wallet');
            const ccpPath = process.env.CONNECTION_PROFILE_PATH || path.join(__dirname, '..', '..', 'config', 'connection-profile.json');

            // Setup Wallet
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            const identity = await wallet.get(adminUser);

            // Determine if running locally or in Docker
            const isLocal = !process.env.WALLET_PATH;
            const localOrgPath = path.join(__dirname, '..', '..', '..', 'nevs-ledger', 'network', 'organizations');

            // Provision admin identity if missing
            if (!identity) {
                console.log(`Identity ${adminUser} not found in wallet, provisioning...`);
                // When containerized, /organizations is mounted directly to the root
                let adminCredsPath = '/organizations/peerOrganizations/central.govt/users/Admin@central.govt/msp';

                if (isLocal) {
                    adminCredsPath = path.join(localOrgPath, 'peerOrganizations', 'central.govt', 'users', 'Admin@central.govt', 'msp');
                }

                const certPath = path.join(adminCredsPath, 'signcerts', 'cert.pem');
                // The private key filename can change dynamically, so we must find it
                const keystorePath = path.join(adminCredsPath, 'keystore');
                if (!fs.existsSync(certPath) || !fs.existsSync(keystorePath)) {
                    throw new Error(`Admin certificates not found at ${adminCredsPath}. Check volume mounts or local paths.`);
                }

                const files = fs.readdirSync(keystorePath);
                const keyFile = files.find(file => file.endsWith('_sk'));
                if (!keyFile) throw new Error('Private key not found in keystore');
                const keyPath = path.join(keystorePath, keyFile);

                const cert = fs.readFileSync(certPath).toString();
                const key = fs.readFileSync(keyPath).toString();

                const x509Identity = {
                    credentials: {
                        certificate: cert,
                        privateKey: key,
                    },
                    mspId: mspId,
                    type: 'X.509',
                };

                await wallet.put(adminUser, x509Identity);
                console.log(`Stored ${adminUser} in memory wallet`);
            }

            // Read connection profile
            let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Rewrite paths if running locally
            if (isLocal) {
                console.log('Running locally, rewriting connection profile paths...');
                if (ccp.orderers && ccp.orderers['orderer.nevs.gov'] && ccp.orderers['orderer.nevs.gov'].tlsCACerts) {
                    const originalPath = ccp.orderers['orderer.nevs.gov'].tlsCACerts.path;
                    ccp.orderers['orderer.nevs.gov'].tlsCACerts.path = originalPath.replace('/organizations', localOrgPath.replace(/\\/g, '/'));
                    // Use 127.0.0.1 instead of docker hostname to avoid IPv6 localhost resolution mismatch
                    ccp.orderers['orderer.nevs.gov'].url = "grpcs://127.0.0.1:7050";
                }
                if (ccp.peers && ccp.peers['peer0.central.govt'] && ccp.peers['peer0.central.govt'].tlsCACerts) {
                    const originalPath = ccp.peers['peer0.central.govt'].tlsCACerts.path;
                    ccp.peers['peer0.central.govt'].tlsCACerts.path = originalPath.replace('/organizations', localOrgPath.replace(/\\/g, '/'));
                    // Use 127.0.0.1 instead of docker hostname to avoid IPv6 localhost resolution mismatch
                    ccp.peers['peer0.central.govt'].url = "grpcs://127.0.0.1:7051";
                }
                if (ccp.peers && ccp.peers['peer1.central.govt'] && ccp.peers['peer1.central.govt'].tlsCACerts) {
                    const originalPath = ccp.peers['peer1.central.govt'].tlsCACerts.path;
                    ccp.peers['peer1.central.govt'].tlsCACerts.path = originalPath.replace('/organizations', localOrgPath.replace(/\\/g, '/'));
                    // Use 127.0.0.1 instead of docker hostname to avoid IPv6 localhost resolution mismatch
                    ccp.peers['peer1.central.govt'].url = "grpcs://127.0.0.1:8051";
                }
                if (ccp.peers && ccp.peers['peer0.company.org'] && ccp.peers['peer0.company.org'].tlsCACerts) {
                    const originalPath = ccp.peers['peer0.company.org'].tlsCACerts.path;
                    ccp.peers['peer0.company.org'].tlsCACerts.path = originalPath.replace('/organizations', localOrgPath.replace(/\\/g, '/'));
                    // Use 127.0.0.1 instead of docker hostname
                    ccp.peers['peer0.company.org'].url = "grpcs://127.0.0.1:9051";
                }
            }

            // Setup Gateway
            this.gateway = new Gateway();
            await this.gateway.connect(ccp, {
                wallet,
                identity: adminUser,
                discovery: { enabled: true, asLocalhost: isLocal },
                eventHandlerOptions: {
                    commitTimeout: 30, // seconds
                    strategy: DefaultEventHandlerStrategies.MSPID_SCOPE_ANYFORTX
                }
            });

            // Get Network and Contract
            this.network = await this.gateway.getNetwork(channelName);
            this.contract = this.network.getContract(chaincodeName);

            // Wait for discovery to populate connected endorsers before serving requests
            await this._waitForDiscovery(ccp, wallet, adminUser, channelName, isLocal);

            return true;

        } catch (error) {
            console.error(`Error connecting to Fabric: ${error.message}`);
            throw error;
        }
    }

    getContract() {
        if (!this.contract) {
            throw new Error('Fabric connection not initialized');
        }
        return this.contract;
    }

    /**
     * Returns a named contract from the new Phase 2 chaincode.
     */
    getContractV2(contractName) {
        if (!this.network) {
            throw new Error('Fabric connection not initialized');
        }
        const chaincodeName = process.env.CHAINCODE_NAME_V2 || 'employment';
        return this.network.getContract(chaincodeName, contractName);
    }

    /**
     * Returns the list of peers known to the current channel from the connection profile.
     * Useful for the frontend to show which peers handled a request.
     */
    getConnectedPeers() {
        if (!this.network) return [];
        try {
            const channel = this.network.getChannel();
            const endorsers = channel.getEndorsers();
            return endorsers.map(e => ({
                name: e.name,
                url: e.endpoint.url,
                connected: e.connected
            }));
        } catch (e) {
            return [];
        }
    }

    /**
     * Returns the raw Network object for low-level channel access (e.g. qscc queries).
     */
    getNetwork() {
        if (!this.network) {
            throw new Error('Fabric connection not initialized');
        }
        return this.network;
    }

    /**
     * Returns the raw Gateway object for identity context access.
     */
    getGateway() {
        if (!this.gateway) {
            throw new Error('Fabric connection not initialized');
        }
        return this.gateway;
    }

    async disconnect() {
        if (this.gateway) {
            this.isReady = false;
            this.emit('disconnected', { isReady: false });
            this.gateway.disconnect();
        }
    }
}

module.exports = new FabricService();
