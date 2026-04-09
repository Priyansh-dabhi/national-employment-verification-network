import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
    proposeHire,
    consentEmployment,
    confirmEmployment,
    terminateEmployment,
    getMyEmploymentRecords,
    getCompanyHires
} from '../controllers/hiringController.js';

const router = express.Router();

// Employer-only routes
router.post('/propose', authMiddleware, authorizeRoles('EMPLOYER'), proposeHire);
router.get('/company-records', authMiddleware, authorizeRoles('EMPLOYER'), getCompanyHires);
router.post('/terminate/:id', authMiddleware, authorizeRoles('EMPLOYER', 'admin'), terminateEmployment);

// Employee-only routes
router.post('/consent', authMiddleware, authorizeRoles('employee'), consentEmployment);
router.get('/my-records', authMiddleware, authorizeRoles('employee'), getMyEmploymentRecords);

// Admin-only routes
router.post('/confirm/:id', authMiddleware, authorizeRoles('admin'), confirmEmployment);

export default router;
