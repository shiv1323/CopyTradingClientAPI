import express from "express";
import { getClosedOrderDetailsValidationRules, getClosedOrderValidationRules, getOrderValidationRules, getReportOverviewValidationRules } from "../validations/clientTradesValidation.js";
import { validateReq } from "../validations/index.js";
import { authHandler } from "../middlewares/authHandler.js";
import { getClosedOrders, getClosedOrdersDetails, getOpenOrders, getReportOverview } from "../controllers/clientReportController.js";
import { getSummaryReport } from "../controllers/performanceSummaryController.js";


const router = express.Router();

router.use(authHandler);
router.get('/getOpenOrders',getOrderValidationRules(),validateReq,getOpenOrders)  // checked
router.get('/getClosedOrders',getClosedOrders)  //checked
router.get('/getClosedOrders/details',getClosedOrderDetailsValidationRules(),validateReq,getClosedOrdersDetails)
router.get('/getReportOverview',getReportOverviewValidationRules(),validateReq,getReportOverview)
router.get("/getClientOrderSummary",getSummaryReport)  // checked

// getClosedOrderValidationRules(),validateReq,
export default router;