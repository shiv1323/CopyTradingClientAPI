import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { callBackTransactionProcess, depositeAmountGatewayProcess, GetPaymentMethods, getPaymentMethodsListDynamic, submitTransactionProcess} from "../controllers/paymentGatewayController.js";
import { validateReq } from "../validations/index.js";
import { depositAmountRules,submitTransactionRules } from "../validations/paymentGatewayValidation.js";




const router = express.Router();
router.use(authHandler);
router.get('/getPaymentMethods', GetPaymentMethods); // checked
router.get('/getPaymentMethodsTypes', getPaymentMethodsListDynamic);
router.post('/initiatepayment',depositAmountRules(),validateReq, depositeAmountGatewayProcess); // checked
router.post('/submit-transaction',submitTransactionRules(),validateReq, submitTransactionProcess);
router.post('/payment-callback', callBackTransactionProcess);

export default router;