import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { raiseRequest,getRequestList,requestClientAction, getMasterTrAccountDropDown,getMasteruserIdSearch,markMasterTradingAccountEligible} from "../controllers/copyTradingController/copyTradeMasterController.js";
import { raiseCTFollowRequest } from "../validations/copyTradingRequestValidation.js";
import { validateReq } from "../validations/index.js";
import { getSelfRequestListAsMaster,actionOnSelfMasterRequest,getListOfOwnFollowers,getListOfOwnMasterLogins,getCTModuleCount } from "../controllers/copyTradingController/myRequestsController.js";



const router = express.Router();

router.get("/receivedRequests",authHandler, getSelfRequestListAsMaster); // checked
router.post("/receivedRequests/performAction",authHandler,actionOnSelfMasterRequest)

router.get("/getOwnMasterDropDown",authHandler,getListOfOwnMasterLogins); // checked
router.post("/getOwnFollowers", authHandler, getListOfOwnFollowers); // checked
router.get("/getModulesCount", authHandler, getCTModuleCount); // checked


export default router;
