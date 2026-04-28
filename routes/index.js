import express from 'express';
import { healthCheck } from '../controllers/healthController.js';
import authRoutes from './authRoutes.js';
import tradingAccountRoutes from './tradingAccountRoutes.js';
import forexGroupRoutes from './forexGroupRoutes.js';
import clientReportRoutes from './clientReportRoutes.js';
import profileRoutes from './profileRoutes.js';
import ctMasterRequestRoutes from './ctMasterRequestRoutes.js';
import paymentRoutes from './paymentGetwayRoutes.js';
import masterRoutes from './copyTradingRequestRoutes.js';
import selfMasterRoutes from "./copyTradingSelfMasterRequestRoutes.js";
import ctTradeExecutionLogsRoutes from "./ctTradeExecutionLogsRoutes.js";
import manualDepositRoutes from "./manualDepositRoutes.js";
import paymentGetwayRoutes from "./paymentGetwayRoutes.js";
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
router.use('/payment',paymentRoutes);
router.use('/ctMasterRequest', ctMasterRequestRoutes);
router.use('/ct/master', masterRoutes)
router.use('/ct/selfMaster', selfMasterRoutes)
router.use('/ctTradeExecutionLogs', ctTradeExecutionLogsRoutes);
router.use('/manualDeposit', manualDepositRoutes);
router.use('/paymentGetway', paymentGetwayRoutes);
router.use('/wallet', walletRoutes);
export default router;
