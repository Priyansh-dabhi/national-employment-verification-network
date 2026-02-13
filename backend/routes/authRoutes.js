import express from 'express';
import { registerEmployee, registerEmployer, login, getMe } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register/employee', registerEmployee);
router.post('/register/employer', registerEmployer);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

export default router;
