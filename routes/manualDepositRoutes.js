import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { createDepositRequest, getBankAccountsList, getUpiAccountsList } from "../controllers/manualDepositController.js";
import { handleUpload } from "../middlewares/handleDocUpload.js";

const router = express.Router();

router.get('/getBankAccounts',authHandler, getBankAccountsList); // checked
router.get('/getUpiAccounts',authHandler, getUpiAccountsList); // checked
router.post('/raiseDepositReq',handleUpload,(req, res, next) => {next()}, authHandler, createDepositRequest); //checked

export default router;