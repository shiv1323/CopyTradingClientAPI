import express from "express";
import { authHandler } from "../middlewares/authHandler.js";
import {getGroupsConfigForWhiteLevels,getGroups} from '../controllers/forexGroups/groupsController.js'

const router = express.Router();

router.post('/getGroups',authHandler,getGroupsConfigForWhiteLevels);
router.get('/getAvailGroups',authHandler,getGroups) // to be tested

export default router;


