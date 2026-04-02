/**
 * peerMonitorService.js
 * 
 * Queries each peer's block height via qscc (Query System Chaincode)
 * and computes deterministic sync status using block height comparison.
 * 
 * Sync States:
 *   SYNCED      — height == networkHeight
 *   CATCHING_UP — height < networkHeight
 *   OFFLINE     — peer unreachable
 */

const fabricService = require('./fabricService');
const { common } = require('fabric-protos');

// The peers we monitor — must match connection-profile.json
const MONITORED_PEERS = [
    'peer0.central.govt',
    'peer1.central.govt'
];

/**
 * Queries qscc GetChainInfo on a specific peer and returns the block height.
 * Uses the low-level fabric-common Channel API for deterministic peer targeting.
 * 
 * @param {string} peerName - The endorser name (e.g. 'peer0.central.govt')
 * @returns {Promise<{height: number|null, error: string|null}>}
 */
async function queryPeerHeight(peerName) {
    try {
        const network = fabricService.getNetwork();
        const gateway = fabricService.getGateway();
        const channel = network.getChannel();

        // Get the specific endorser (peer) by name
        const endorser = channel.getEndorser(peerName);
        if (!endorser) {
            return { height: null, error: `Endorser ${peerName} not found in channel` };
        }

        // Check if the endorser's internal gRPC connection is ready.
        // If it's not connected, try to connect once.
        if (!endorser.connected) {
            try {
                await endorser.connect();
            } catch (connectErr) {
                // If connection physically fails, destroy the broken socket to prevent exponential backoff locking in the gRPC layer
                endorser.disconnect();
                // The SDK sometimes complains it is already connected even when .connected is false.
                if (!connectErr.message.includes('has an active grpc service connection')) {
                    return { height: null, error: `Connection failed: ${connectErr.message}` };
                }
            }
        }

        const identityContext = gateway.identityContext;
        const query = channel.newQuery('qscc');

        query.build(identityContext, {
            fcn: 'GetChainInfo',
            args: ['nevs-channel']
        });
        query.sign(identityContext);

        try {
            // Send the query to the specific peer only
            const response = await query.send({ targets: [endorser], requestTimeout: 3000 });

            // Validate the response
            if (!response || !response.responses || response.responses.length === 0) {
                return { height: null, error: 'Empty response from peer' };
            }

            const peerResponse = response.responses[0];

            if (peerResponse.response && peerResponse.response.status === 200) {
                const payload = peerResponse.response.payload;
                const blockchainInfo = common.BlockchainInfo.decode(payload);

                const height = blockchainInfo.height.toNumber
                    ? blockchainInfo.height.toNumber()
                    : Number(blockchainInfo.height);

                return { height, error: null };
            } else {
                return { height: null, error: `Peer returned status ${peerResponse.response?.status}` };
            }
        } catch (queryErr) {
            // If the query physically fails (timeout, connection reset by peer due to container stop)
            // We must explicitly disconnect the endorser so the SDK knows it's dead and cleans up the broken socket.
            // Next tick, the !endorser.connected check will try to recreate the socket.
            endorser.disconnect();
            return { height: null, error: `Query failed: ${queryErr.message}` };
        }
    } catch (error) {
        return { height: null, error: error.message };
    }
}

/**
 * Queries all monitored peers and computes the sync state machine.
 * 
 * @returns {Promise<{networkHeight: number, peers: Array<{name, status, height, error?}>}>}
 */
async function getSyncStatus() {
    const results = [];

    // Query all peers in parallel
    const queries = MONITORED_PEERS.map(async (peerName) => {
        const { height, error } = await queryPeerHeight(peerName);
        return { name: peerName, height, error };
    });

    const peerResults = await Promise.all(queries);

    // Compute the maximum network height from all responding peers
    const heights = peerResults
        .filter(p => p.height !== null)
        .map(p => p.height);

    const networkHeight = heights.length > 0 ? Math.max(...heights) : 0;

    // Classify each peer using the state machine
    for (const peer of peerResults) {
        const entry = {
            name: peer.name,
            status: 'OFFLINE',
            height: peer.height
        };

        if (peer.height === null) {
            entry.status = 'OFFLINE';
            entry.error = peer.error;
        } else if (peer.height >= networkHeight) {
            entry.status = 'SYNCED';
        } else {
            entry.status = 'CATCHING_UP';
        }

        results.push(entry);
    }

    return {
        networkHeight,
        peers: results
    };
}

module.exports = { getSyncStatus, queryPeerHeight, MONITORED_PEERS };
