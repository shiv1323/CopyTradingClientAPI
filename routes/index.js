import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
const router = express.Router();
// Health check
router.get('/health', healthCheck);

// auth routes
router.use('/auth', authRoutes);

export default router;
