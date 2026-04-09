const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const lifecycleController = require('../controllers/lifecycleController');

// Company Registration & Management
router.post('/companies', companyController.registerCompany);
router.get('/companies', companyController.getAllCompanies);
router.get('/companies/:id', companyController.getCompany);
router.get('/companies/status/:status', companyController.getCompaniesByStatus);
router.put('/companies/:id/approve', companyController.approveCompany);
router.put('/companies/:id/suspend', companyController.suspendCompany);
router.put('/companies/:id/reject', companyController.rejectCompany);

// Employment Lifecycle - Govt Actions
router.put('/employment/:id/confirm', lifecycleController.confirmEmployment);

module.exports = router;
