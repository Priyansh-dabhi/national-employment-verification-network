import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import {
    getProfile,
    uploadCompanyDocument,
    getCompanyDocuments,
    applyForVerification,
    getVerificationStatus,
    requestEmployeeVerification,
    getVerificationRequests,
    getVerifiedEmployees,
    getCompanyEmployees,
    markEmployeeLeft,
} from '../controllers/employerController.js';

const router = express.Router();

// All routes require JWT + EMPLOYER role
router.use(authMiddleware, authorizeRoles('EMPLOYER'));

// Profile
router.get('/profile', getProfile);

// Company Documents
router.post('/documents/upload', upload.single('document'), uploadCompanyDocument);
router.get('/documents', getCompanyDocuments);

// Company Verification
router.post('/verification/apply', applyForVerification);
router.get('/verification/status', getVerificationStatus);

// Employee Verification Requests
router.post('/request-verification', requestEmployeeVerification);
router.get('/verification-requests', getVerificationRequests);

// Employee Management
router.get('/verified-employees', getVerifiedEmployees);
router.get('/employees', getCompanyEmployees);
router.post('/employees/:id/leave', markEmployeeLeft);

export default router;
