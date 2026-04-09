import express from 'express';
import { registerEmployee, registerEmployer, login, refreshAccessToken, logout, getMe } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register/employee', registerEmployee);
router.post('/register/employer', registerEmployer);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);

export default router;
