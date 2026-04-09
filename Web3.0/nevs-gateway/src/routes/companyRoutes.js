const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const lifecycleController = require('../controllers/lifecycleController');

// Employee Registration
router.post('/employees', employeeController.registerEmployee);
router.get('/employees', employeeController.getAllEmployees);
router.get('/employees/:id', employeeController.getEmployee);

// Employment Lifecycle - Company Actions
router.post('/employment/propose', lifecycleController.proposeEmployment);
router.put('/employment/:id/terminate', lifecycleController.terminateEmployment);
router.get('/employment/company/:companyId', lifecycleController.getEmploymentsByCompany);

module.exports = router;
