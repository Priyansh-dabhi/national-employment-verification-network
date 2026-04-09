const { exec } = require('child_process');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const peerMonitorService = require('../services/peerMonitorService');

const ALLOWED_CONTAINERS = [
    'peer0.central.govt',
    'peer1.central.govt',
    'orderer.nevs.gov',
    'employment.cc',
    'nevs.cc'
];

const executeDockerCommand = (command, res, successMsg) => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing docker command: ${stderr}`);
            return errorResponse(res, 500, 'Failed to perform Docker action', error.message);
        }
        successResponse(res, { output: stdout.trim() }, { txId: successMsg });
    });
};

exports.stopPeer = (req, res) => {
    const { peer } = req.body;
    if (!peer || !ALLOWED_CONTAINERS.includes(peer)) {
        return errorResponse(res, 400, `Invalid container name. Allowed: ${ALLOWED_CONTAINERS.join(', ')}`);
    }

    console.log(`⚡ GOD MODE: Initiating KILL sequence for ${peer}`);
    executeDockerCommand(`docker stop ${peer}`, res, `Stopped ${peer}`);
};

exports.startPeer = (req, res) => {
    const { peer } = req.body;
    if (!peer || !ALLOWED_CONTAINERS.includes(peer)) {
        return errorResponse(res, 400, `Invalid container name. Allowed: ${ALLOWED_CONTAINERS.join(', ')}`);
    }

    console.log(`⚡ GOD MODE: Initiating START sequence for ${peer}`);
    executeDockerCommand(`docker start ${peer}`, res, `Started ${peer}`);
};

exports.getNetworkStatus = (req, res) => {
    exec('docker ps -a --format \'{"name":"{{.Names}}", "status":"{{.Status}}", "ports":"{{.Ports}}"}\'', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error fetching network status: ${stderr}`);
            return errorResponse(res, 500, 'Failed to retrieve docker network status', error.message);
        }

        const lines = stdout.trim().split('\n');
        const containers = lines.map(line => {
            try {
                const parsed = JSON.parse(line);
                return {
                    name: parsed.name,
                    status: parsed.status,
                    ports: parsed.ports,
                    isUp: parsed.status.startsWith('Up')
                };
            } catch (e) {
                return null;
            }
        }).filter(Boolean);

        // Filter to only show relevant Fabric containers
        const fabricContainers = containers.filter(c =>
            ALLOWED_CONTAINERS.includes(c.name) || c.name === 'nevs-gateway'
        );

        successResponse(res, fabricContainers);
    });
};

/**
 * GET /api/godmode/peers/sync-status
 * Queries each peer's block height via qscc and returns deterministic sync state.
 */
exports.getSyncStatus = async (req, res) => {
    try {
        const syncData = await peerMonitorService.getSyncStatus();
        return successResponse(res, syncData);
    } catch (error) {
        console.error('Error fetching sync status:', error.message);
        return errorResponse(res, 500, 'Failed to retrieve peer sync status', error.message);
    }
};

/**
 * GET /api/godmode/status/stream
 * SSE endpoint to stream Fabric readiness status to the frontend.
 */
exports.streamStatus = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const _fabricService = require('../services/fabricService');

    const sendStatus = () => {
        const isReady = _fabricService.isReady || false;
        res.write(`data: ${JSON.stringify({ isReady })}\n\n`);
    };

    // Send initial status
    sendStatus();

    // Listen to fabricService events
    const onReady = () => sendStatus();
    const onDisconnected = () => sendStatus();

    _fabricService.on('ready', onReady);
    _fabricService.on('disconnected', onDisconnected);

    // Cleanup on client disconnect
    req.on('close', () => {
        _fabricService.removeListener('ready', onReady);
        _fabricService.removeListener('disconnected', onDisconnected);
    });
};
