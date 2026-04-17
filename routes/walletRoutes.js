import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import {
  depositeAmountProcess,
  getClientOverAllFund,
  withDrawlAmountProcess,
  getTransactionHistory,
  withdrawamountToPersonalWallet,
  getCurrencyList,
  getMinimumDepositeByGroupId,
  getPaymentCurrencyList,
  checkPaymentMethodStatus
} from "../controllers/clientFundController/clientInvestentWalletController.js";
import { validateWithdrawlRequestBody } from "../validations/withdrawlRequestValidation.js";
import { getTransactionHistoryValidationRules } from "../validations/walletTransactionValidation.js";
import { validateReq } from "../validations/index.js";
import { kycCheckHandler } from "../middlewares/kycCheckHandler.js";

const router = express.Router();

router.post("/deposite=/amount-to-wallet", authHandler,kycCheckHandler, depositeAmountProcess);
router.post("/withdrawlProcess-request", authHandler,kycCheckHandler, withDrawlAmountProcess);
router.post("/getTransactionHistory",getTransactionHistoryValidationRules(),validateReq,authHandler,getTransactionHistory);
router.post("/getTotalClientFund", authHandler, getClientOverAllFund);
router.get("/getMinimumDepoInfo", authHandler, getMinimumDepositeByGroupId);

// withdraw to personal account
router.post("/withdrawlrequest_process",validateWithdrawlRequestBody(),validateReq,authHandler,kycCheckHandler,withdrawamountToPersonalWallet);
router.get("/getCurrencyList", authHandler, getCurrencyList);
router.get("/getPaymentCurrencyList", authHandler, getPaymentCurrencyList);
router.get("/checkPaymentMethodStatus", authHandler, checkPaymentMethodStatus);

export default router;
