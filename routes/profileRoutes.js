import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { getFullBalance, getUserProfile, updateSdflg } from "../controllers/profileController.js";



const router = express.Router();

router.use(authHandler);
router.get('/getUserProfile',getUserProfile);
router.get('/getBalance',getFullBalance);
router.put('/flipsdswiitch',updateSdflg)

export default router;