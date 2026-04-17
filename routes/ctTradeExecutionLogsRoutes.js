import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { getTradeExecutionLogs,executionTradeLogDropDowns } from "../controllers/copyTradingController/ctTradeExecutionLogsController.js"



const router = express.Router();

router.get("/ctTradeExecutionActivity", authHandler, getTradeExecutionLogs);
router.get("/getDropDowns", authHandler, executionTradeLogDropDowns);

export default router;