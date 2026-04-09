import express from 'express';
import { verifyWebhookSignature } from '../middleware/webhookAuth.js';
import { handleEmployeeRegistered, handleEmploymentProposed } from '../controllers/webhookController.js';

const router = express.Router();

router.use(verifyWebhookSignature);

router.post('/fabric/employee-registered', handleEmployeeRegistered);
router.post('/fabric/employment-proposed', handleEmploymentProposed);

export default router;
