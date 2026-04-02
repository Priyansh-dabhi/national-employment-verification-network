const express = require('express');
const router = express.Router();
const lifecycleController = require('../controllers/lifecycleController');

// Employment Lifecycle - Employee Actions
router.put('/employment/:id/consent', lifecycleController.employeeConsent);
router.get('/employment/history/:employeeId', lifecycleController.getEmploymentsByEmployee);
router.get('/employment/:employeeId/:employmentId', lifecycleController.getEmployment);

module.exports = router;
