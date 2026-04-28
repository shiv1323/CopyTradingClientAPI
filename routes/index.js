import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import tradingAccountRoutes from './tradingAccountRoutes.js';
import forexGroupRoutes from './forexGroupRoutes.js';
import clientReportRoutes from './tradesHistoryRoutes.js';
import profileRoutes from './profileRoutes.js';
import paymentRoutes from './paymentGetwayRoutes.js';
import ctTradeExecutionRoutes from './ctTradeExecutionLogsRoutes.js';
import performanceSummaryRoutes from './performanceSummaryRoutes.js';
import masterRoutes from './ctMasterRequestRoutes.js';
import selfMasterRoutes from './copyTradingSelfMasterRequestRoutes.js';
import becomeMasterRoutes from './ctBecomeMasterRequestRoutes.js';
import manualDepositRoutes from './manualDepositRoutes.js';
import walletRoutes from './walletRoutes.js';
const router = express.Router();
// Health check
router.get('/health', healthCheck);

// auth routes
router.use('/auth', authRoutes);
router.use("/tradingaccount", tradingAccountRoutes);
router.use("/forexGroupConfig", forexGroupRoutes);
router.use("/tradeHistory", clientReportRoutes);
router.use('/profile',profileRoutes);
router.use('/pay',paymentRoutes);
router.use('/performance_summary',performanceSummaryRoutes);
router.use('/ct/master', masterRoutes)
router.use('/ct/selfMaster', selfMasterRoutes)
router.use('/ct/raise', becomeMasterRoutes)
router.use('/manualDeposit', manualDepositRoutes)
router.use('/wallet', walletRoutes)
router.use('/ct', ctTradeExecutionRoutes)
export default router;
