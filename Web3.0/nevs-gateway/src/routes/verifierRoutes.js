const express = require('express');
const router = express.Router();
const verifierController = require('../controllers/verifierController');

// Verification Operations
router.post('/verify', verifierController.verifyEmployment);
router.get('/record/:id', verifierController.getVerificationRecord);
router.get('/history/:employeeId', verifierController.getEmploymentHistory);
router.get('/proof/:employmentId', verifierController.generateVerificationProof);

module.exports = router;
