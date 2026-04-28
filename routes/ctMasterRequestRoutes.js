import express from "express";
import { authHandler } from "../middlewares/authHandler.js";;
import { raiseRequestCtMaster} from "../controllers/copyTradingController/masterRequestController.js"

const router = express.Router();

router.post("/becomeMaster/request", authHandler, raiseRequestCtMaster);  // to be tested
// router.post("/unmarkMaster/request", authHandler, unMarkasMasterRequest);

export default router;
