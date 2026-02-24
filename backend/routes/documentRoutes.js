import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadDocument, viewDocument, getMyDocuments } from '../controllers/documentController.js';

const router = express.Router();

// Upload requires authentication and must be an 'employee'
router.post(
    '/upload',
    authMiddleware,
    authorizeRoles('employee'),
    upload.single('file'),
    uploadDocument
);

// Viewing requests a signed URL, accessible by document owner or admin
router.get(
    '/:id/view',
    authMiddleware,
    viewDocument
);

// Fetch all documents for the logged in user
router.get(
    '/',
    authMiddleware,
    authorizeRoles('employee'),
    getMyDocuments
);

export default router;
