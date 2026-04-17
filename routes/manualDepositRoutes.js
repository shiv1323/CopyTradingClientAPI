import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { createDepositRequest, getBankAccountsList, getUpiAccountsList } from "../controllers/manualDepositController.js";
import { handleUpload } from "./clientDocUploadRoutes.js";

const router = express.Router();

router.get('/getBankAccounts',authHandler, getBankAccountsList);
router.get('/getUpiAccounts',authHandler, getUpiAccountsList);
router.post('/raiseDepositReq',handleUpload,(req, res, next) => {next()}, authHandler, createDepositRequest);

export default router;