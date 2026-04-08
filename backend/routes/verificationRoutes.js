import express from 'express';
import {
    uploadAndVerifyDocument,
    getVerificationStatus,
    applyForEmployeeVerification
} from '../controllers/verificationEngineController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply for automated verification using document
router.post('/upload-document', authMiddleware, authorizeRoles('employee'), upload.single('document'), uploadAndVerifyDocument);

// Submit a manual verification request after uploading identity docs
router.post('/apply', authMiddleware, authorizeRoles('employee'), applyForEmployeeVerification);

// Get latest verification status log
router.get('/status/:userId', authMiddleware, getVerificationStatus);

export default router;
