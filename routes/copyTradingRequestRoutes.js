import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { raiseRequest,getRequestList,requestClientAction, getMasterTrAccountDropDown,getMasteruserIdSearch,markMasterTradingAccountEligible,setSelfFollowingAccountRules,getMasterRules,setMasterRulesForAllFollowers,fetchAppliedRules,getCTEligibleFollowerAccounts} from "../controllers/copyTradingController/copyTradeMasterController.js";
import { raiseCTFollowRequest,updateRulesConfig,setMasterRulesForAllFollowersValidation } from "../validations/copyTradingRequestValidation.js";
import { validateReq } from "../validations/index.js";


const router = express.Router();

router.post(
  "/tradecopy/raiseRequest",
  raiseCTFollowRequest(),
  validateReq,
  authHandler,
  raiseRequest
);  // checked

router.get("/tradecopy/getRequests",authHandler,getRequestList); // checked 
router.post("/tradecopy/performAction",authHandler, requestClientAction);  // checked
router.get("/tradecopy/getMasterTrAccountDropDown", authHandler, getMasterTrAccountDropDown);  // checked
router.get("/tradecopy/getMasteruserIdSearch", authHandler, getMasteruserIdSearch);
router.post("/tradecopy/markMasterTradingAccEligible", authHandler, markMasterTradingAccountEligible);
router.post("/tradecopy/updateRulesConfig",updateRulesConfig(),validateReq, authHandler, setSelfFollowingAccountRules); // checked
router.get("/tradecopy/getMasterRules", authHandler, getMasterRules);
router.post("/tradecopy/setMasterRulesForAllFollowers",setMasterRulesForAllFollowersValidation(),validateReq, authHandler, setMasterRulesForAllFollowers);
router.get("/tradecopy/getappliedRules", authHandler, fetchAppliedRules); // checked
router.get("/tradecopy/getCTEligibleFollowerAccounts", authHandler, getCTEligibleFollowerAccounts); // checked

export default router;
