import express from "express";
import { authHandler } from "../middlewares/authHandler.js";;
import { getDashClientInfo} from "../controllers/clientsDash.js"

const router = express.Router();

router.get("/getinfo", authHandler,getDashClientInfo);

export default router;
