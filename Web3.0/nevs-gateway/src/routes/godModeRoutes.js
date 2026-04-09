const express = require('express');
const router = express.Router();
const godModeController = require('../controllers/godModeController');

// Chaos Monkey Endpoints
router.post('/peer/stop', godModeController.stopPeer);
router.post('/peer/start', godModeController.startPeer);
router.get('/network/status', godModeController.getNetworkStatus);

// Peer Sync Monitor
router.get('/peers/sync-status', godModeController.getSyncStatus);

// Server-Sent Events (SSE) for Fabric Readiness
router.get('/status/stream', godModeController.streamStatus);

module.exports = router;
