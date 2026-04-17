import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { raiseRequest,getRequestList,requestClientAction, getMasterTrAccountDropDown,getMasteruserIdSearch,markMasterTradingAccountEligible} from "../controllers/copyTradingController/copyTradeMasterController.js";
import { raiseCTFollowRequest } from "../validations/copyTradingRequestValidation.js";
import { validateReq } from "../validations/index.js";
import { getSelfRequestListAsMaster,actionOnSelfMasterRequest,getListOfOwnFollowers,getListOfOwnMasterLogins,getCTModuleCount } from "../controllers/copyTradingController/myRequestsController.js";



const router = express.Router();

router.get("/receivedRequests",authHandler, getSelfRequestListAsMaster);
router.post("/receivedRequests/performAction",authHandler,actionOnSelfMasterRequest)

router.get("/getOwnMasterDropDown",authHandler,getListOfOwnMasterLogins);
router.post("/getOwnFollowers", authHandler, getListOfOwnFollowers);
router.get("/getModulesCount", authHandler, getCTModuleCount);


export default router;
