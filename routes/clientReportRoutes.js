import express from "express";
import { getClosedOrderDetailsValidationRules, getClosedOrderValidationRules, getOrderValidationRules, getReportOverviewValidationRules } from "../validations/clientTradesValidation.js";
import { validateReq } from "../validations/index.js";
import { authHandler } from "../middlewares/authHandler.js";
import { getClosedOrders, getClosedOrdersDetails, getOpenOrders, getReportOverview } from "../controllers/clientReportController.js";


const router = express.Router();


router.post('/getOpenOrders',getOrderValidationRules(),validateReq,authHandler,getOpenOrders)
router.post('/getClosedOrders',authHandler,getClosedOrders)
router.post('/getClosedOrders/details',getClosedOrderDetailsValidationRules(),validateReq,authHandler,getClosedOrdersDetails)
router.post('/getReportOverview',getReportOverviewValidationRules(),validateReq,authHandler,getReportOverview)

// getClosedOrderValidationRules(),validateReq,
export default router;