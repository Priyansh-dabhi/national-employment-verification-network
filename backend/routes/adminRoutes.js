import express from 'express';
import { adminLogin } from '../controllers/adminAuthController.js';
import { getReviewDocuments, getDocumentById, adminAction } from '../controllers/adminReviewController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);

router.get('/review-documents', authMiddleware, authorizeRoles('admin'), getReviewDocuments);
router.get('/document/:id', authMiddleware, authorizeRoles('admin'), getDocumentById);
router.post('/action', authMiddleware, authorizeRoles('admin'), adminAction);

export default router;
