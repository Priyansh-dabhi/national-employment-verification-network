/**
 * internalRoutes.js
 * Routes for internal gateway API communication with Web2
 */
const express = require('express');
const router = express.Router();
const internalAuth = require('../middleware/internalAuth');
const identityController = require('../controllers/identityController');

// Apply internal authentication to all routes in this router
router.use(internalAuth);

// Identity Minting Endpoints
router.post('/mint-identity', identityController.mintIdentity.bind(identityController));
router.post('/mint-company-identity', identityController.mintCompanyIdentity.bind(identityController));
router.get('/identity/:employeeID/status', identityController.getIdentityStatus.bind(identityController));

module.exports = router;
