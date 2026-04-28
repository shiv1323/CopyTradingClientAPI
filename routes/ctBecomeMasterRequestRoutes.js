import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import {
  raiseRequest,
  getRequestList,
  requestClientAction,
  getMasterTrAccountDropDown,
  getMasteruserIdSearch,
  markMasterTradingAccountEligible,
  setSelfFollowingAccountRules,
  getMasterRules,
  setMasterRulesForAllFollowers,
  fetchAppliedRules,
  getCTEligibleFollowerAccounts,
} from "../controllers/copyTradingController/copyTradeMasterController.js";
import {
  raiseCTFollowRequest,
  updateRulesConfig,
  setMasterRulesForAllFollowersValidation,
} from "../validations/copyTradingRequestValidation.js";
import { validateReq } from "../validations/index.js";

const router = express.Router();

router.post(
  "/tradecopy/raiseRequest",
  raiseCTFollowRequest(),
  validateReq,
  authHandler,
  raiseRequest
);

router.get("/tradecopy/getRequests", authHandler, getRequestList);
router.post("/tradecopy/performAction", authHandler, requestClientAction);
router.get(
  "/tradecopy/getMasterTrAccountDropDown",
  authHandler,
  getMasterTrAccountDropDown
);
router.get(
  "/tradecopy/getMasteruserIdSearch",
  authHandler,
  getMasteruserIdSearch
);
router.post(
  "/tradecopy/markMasterTradingAccEligible",
  authHandler,
  markMasterTradingAccountEligible
);
router.post(
  "/tradecopy/updateRulesConfig",
  updateRulesConfig(),
  validateReq,
  authHandler,
  setSelfFollowingAccountRules
);
router.get("/tradecopy/getMasterRules", authHandler, getMasterRules);
router.post(
  "/tradecopy/setMasterRulesForAllFollowers",
  setMasterRulesForAllFollowersValidation(),
  validateReq,
  authHandler,
  setMasterRulesForAllFollowers
);
router.get("/tradecopy/getappliedRules", authHandler, fetchAppliedRules);
router.get(
  "/tradecopy/getCTEligibleFollowerAccounts",
  authHandler,
  getCTEligibleFollowerAccounts
);

export default router;
