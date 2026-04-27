import express from "express";
import { archiveAccount, createTradingAccount,getTradingAccount, setBalance,getAndUpdateTAccountInfo, createClient,restoreArchivedAccount, updateTrAccountLeverage, checkRequest, raiseIncreaseRequest,renameTradingAcc } from "../controllers/tradingAccountController.js";
import { renameTrAccountRules,createTradeAccValidationRules,validateReq,getTrAccountInfoRules,setBalanceValidationRules, createClientValidationRules,validateArchiveAccount,validateInitiateMT5PasswordChange,validateVerifyAndChangeMT5Password, updLeverageValidationRules, increaseLimitValidationRules } from "../validations/index.js";
import { authHandler } from "../middlewares/authHandler.js";
import { initiateMT5PasswordChange,getTrAccountLimitForClient, verifyAndChangeMT5Password } from "../controllers/tradingAccountController.js";


const router = express.Router();

router.use(authHandler);
router.post('/createTradingAccount',createTradeAccValidationRules(),validateReq,createTradingAccount);
router.get('/getClientTradingAccounts',getTradingAccount);  // checked
router.post('/setBalance',setBalanceValidationRules(),validateReq,setBalance);
router.post('/initiateMT5AccountPasswordChange',validateInitiateMT5PasswordChange(),validateReq,initiateMT5PasswordChange);
router.post('/verifyMT5AccountPasswordChange',validateVerifyAndChangeMT5Password(),validateReq,verifyAndChangeMT5Password);
router.get('/get_t_accountinfo',getTrAccountInfoRules(), validateReq, getAndUpdateTAccountInfo)
router.post('/createClient',createClientValidationRules(),validateReq,createClient);
router.post('/updateLeverage',updLeverageValidationRules(),validateReq,updateTrAccountLeverage)
router.post("/getT_accountLimitStats", getTrAccountLimitForClient);
router.get('/getIncreaseRequests',checkRequest);
router.post('/raiseRequest_IncTrAcc',increaseLimitValidationRules(),validateReq,raiseIncreaseRequest);
router.post('/renameTradingAccname',renameTrAccountRules(), validateReq, renameTradingAcc)

export default router;
