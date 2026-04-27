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

const router = express.Router();

router.post("/deposite=/amount-to-wallet", authHandler, depositeAmountProcess);
router.post("/withdrawlProcess-request", authHandler, withDrawlAmountProcess); // checked
router.post("/getTransactionHistory",getTransactionHistoryValidationRules(),validateReq,authHandler,getTransactionHistory); // checked
router.post("/getTotalClientFund", authHandler, getClientOverAllFund); // checked
router.get("/getMinimumDepoInfo", authHandler, getMinimumDepositeByGroupId);

// withdraw to personal account
router.post("/withdrawlrequest_process",validateWithdrawlRequestBody(),validateReq,authHandler,withdrawamountToPersonalWallet); // checked
router.get("/getCurrencyList", authHandler, getCurrencyList);
router.get("/getPaymentCurrencyList", authHandler, getPaymentCurrencyList); // checked
router.get("/checkPaymentMethodStatus", authHandler, checkPaymentMethodStatus); // checked

export default router;
