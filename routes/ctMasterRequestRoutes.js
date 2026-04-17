import express from "express";
import { authHandler } from "../middlewares/authHandler.js";;
import { raiseRequestCtMaster, unMarkasMasterRequest} from "../controllers/copyTradingController/masterRequestController.js"

const router = express.Router();

router.get("/becomeMaster/request", authHandler, raiseRequestCtMaster);
router.post("/unmarkMaster/request", authHandler, unMarkasMasterRequest);

export default router;
