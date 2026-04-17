import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import { getFullBalance, getUserProfile, updateSdflg } from "../controllers/profileController.js";



const router = express.Router();


router.get('/getUserProfile',authHandler,getUserProfile);
router.get('/getBalance',authHandler,getFullBalance);
router.post('/flipsdswiitch',authHandler,updateSdflg)

export default router;