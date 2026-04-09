import express from 'express';
import {
    createJob,
    getAllJobs,
    applyForJob,
    getEmployerJobs,
    getJobApplicants,
    getEmployeeApplications
} from '../controllers/jobController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { requireVerified } from '../middleware/verificationMiddleware.js';

const router = express.Router();

// All job routes require authentication and a verified account_status
router.use(authMiddleware);
router.use(requireVerified);

// 1. Create Job (Employer Only)
router.post('/', authorizeRoles('EMPLOYER'), createJob);

// 2. Get All Jobs (Employee)
router.get('/', authorizeRoles('EMPLOYEE'), getAllJobs);

// 3. Apply for Job (Employee Only)
router.post('/:jobId/apply', authorizeRoles('EMPLOYEE'), applyForJob);

// 4. Get Employer Jobs (Employer Only)
router.get('/employer', authorizeRoles('EMPLOYER'), getEmployerJobs);

// 5. Get Applicants for Job (Employer Only)
router.get('/:jobId/applicants', authorizeRoles('EMPLOYER'), getJobApplicants);

// 6. Get Employee Applications (Employee Only)
router.get('/employee', authorizeRoles('EMPLOYEE'), getEmployeeApplications);

// Phase 5 Hiring Routes
router.get('/pending-offers', authorizeRoles('EMPLOYEE'), getPendingOffers);
router.post('/consent-hire', authorizeRoles('EMPLOYEE'), consentHire);

export default router;
