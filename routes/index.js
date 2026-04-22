import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import tradingAccountRoutes from './tradingAccountRoutes.js';
import forexGroupRoutes from './forexGroupRoutes.js';
import clientReportRoutes from './clientReportRoutes.js';
import profileRoutes from './profileRoutes.js';
import paymentRoutes from './paymentGetwayRoutes.js';
const router = express.Router();
// Health check
router.get('/health', healthCheck);

// auth routes
router.use('/auth', authRoutes);
router.use("/tradingaccount", tradingAccountRoutes);
router.use("/forexGroupConfig", forexGroupRoutes);
router.use("/tradeHistory", clientReportRoutes);
router.use('/profile',profileRoutes);
router.use('/payment',paymentRoutes);
export default router;
