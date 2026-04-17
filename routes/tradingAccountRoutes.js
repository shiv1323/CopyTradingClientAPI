import express from "express";
import { archiveAccount, createTradingAccount,getTradingAccount, setBalance,getAndUpdateTAccountInfo, createClient,restoreArchivedAccount, updateTrAccountLeverage, checkRequest, raiseIncreaseRequest,renameTradingAcc } from "../controllers/tradingAccountController.js";
import { renameTrAccountRules,createTradeAccValidationRules,validateReq,getTrAccountInfoRules,setBalanceValidationRules, createClientValidationRules,validateArchiveAccount,validateInitiateMT5PasswordChange,validateVerifyAndChangeMT5Password, updLeverageValidationRules, increaseLimitValidationRules } from "../validations/index.js";
import { authHandler } from "../middlewares/authHandler.js";
import { initiateMT5PasswordChange,getTrAccountLimitForClient, verifyAndChangeMT5Password } from "../controllers/tradingAccountController.js";


const router = express.Router();

router.post('/createTradingAccount',createTradeAccValidationRules(),validateReq,authHandler,createTradingAccount);
router.post('/getClientTradingAccounts',authHandler,getTradingAccount);
router.post('/setBalance',setBalanceValidationRules(),validateReq,authHandler,setBalance);
router.post('/archiveAccount',validateArchiveAccount(),validateReq,authHandler,archiveAccount);
router.post('/restoreArchivedAccount',authHandler,restoreArchivedAccount);
router.post('/initiateMT5AccountPasswordChange',validateInitiateMT5PasswordChange(),validateReq,authHandler,initiateMT5PasswordChange);
router.post('/verifyMT5AccountPasswordChange',validateVerifyAndChangeMT5Password(),validateReq,authHandler,verifyAndChangeMT5Password);
router.post('/get_t_accountinfo',getTrAccountInfoRules(), validateReq, authHandler,getAndUpdateTAccountInfo)
router.post('/createClient',createClientValidationRules(),validateReq,authHandler,createClient);
router.post('/updateLeverage',updLeverageValidationRules(),validateReq,authHandler,updateTrAccountLeverage)
router.post("/getT_accountLimitStats", authHandler, getTrAccountLimitForClient);
router.get('/getIncreaseRequests',authHandler,checkRequest);
router.post('/raiseRequest_IncTrAcc',increaseLimitValidationRules(),validateReq,authHandler,raiseIncreaseRequest);
router.post('/renameTradingAccname',renameTrAccountRules(), validateReq, authHandler,renameTradingAcc)

export default router;
