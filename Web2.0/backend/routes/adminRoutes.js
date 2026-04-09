import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { getReviewDocuments, getDocumentById, adminAction, getAuditTimeline, getEmploymentStats, getAllEmploymentRecords } from '../controllers/adminReviewController.js';
import { confirmEmployment } from '../controllers/hiringController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);

router.get('/review-documents', authMiddleware, authorizeRoles('admin'), getReviewDocuments);
router.get('/document/:id', authMiddleware, authorizeRoles('admin'), getDocumentById);
router.post('/action', authMiddleware, authorizeRoles('admin'), adminAction);

// Phase 5: Audit Timeline & Employment Management
router.get('/audit-timeline', authMiddleware, authorizeRoles('admin'), getAuditTimeline);
router.get('/employment-stats', authMiddleware, authorizeRoles('admin'), getEmploymentStats);
router.get('/employment-records', authMiddleware, authorizeRoles('admin'), getAllEmploymentRecords);
router.post('/confirm-hire/:id', authMiddleware, authorizeRoles('admin'), confirmEmployment);

export default router;
