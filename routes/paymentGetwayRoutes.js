import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { callBackTransactionProcess, depositeAmountGatewayProcess, GetPaymentMethods, getPaymentMethodsList, getPaymentMethodsListDynamic, submitTransactionProcess} from "../controllers/paymentGatewayController.js";
import { kycCheckHandler } from "../middlewares/kycCheckHandler.js";
import { validateReq } from "../validations/index.js";
import { depositAmountRules,submitTransactionRules } from "../validations/paymentGatewayValidation.js";




const router = express.Router();

router.get('/getPaymentMethods',authHandler, GetPaymentMethods);
router.get('/getPaymentMethodsTypes',authHandler, getPaymentMethodsListDynamic);
router.post('/initiatepayment',depositAmountRules(),validateReq, authHandler,kycCheckHandler, depositeAmountGatewayProcess);
router.post('/submit-transaction',submitTransactionRules(),validateReq,authHandler,kycCheckHandler, submitTransactionProcess);
router.post('/payment-callback', callBackTransactionProcess);

export default router;