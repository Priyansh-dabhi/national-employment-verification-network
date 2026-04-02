const express = require('express');
const router = express.Router();
const employmentController = require('../controllers/employmentController');

// Get all employment records
router.get('/', employmentController.getAllEmploymentRecords);

// Create a new employment record
router.post('/', employmentController.createEmployment);

// Get all employment records for a specific employee
router.get('/employee/:employeeId', employmentController.getEmploymentHistory);

// Get a specific employment record by employeeId and recordId
router.get('/record/:employeeId/:recordId', employmentController.getEmploymentRecord);

// Update employment status
router.put('/:employeeId/:recordId/status', employmentController.updateStatus);

// Get private employment data (salary, compensation) from PDC
router.get('/private/:recordId', employmentController.getPrivateEmploymentData);

module.exports = router;
