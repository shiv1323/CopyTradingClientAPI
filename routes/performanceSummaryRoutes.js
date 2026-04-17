import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { getTrAccountDdown,getSummaryReport } from "../controllers/performanceSummaryController.js";


const router = express.Router();



router.get("/getClientTrAccounts",authHandler,getTrAccountDdown);
router.post("/getClientOrderSummary",authHandler,getSummaryReport)



export default router;