import express from 'express';
const router = express.Router();
import { generateJWTAndLogin, login, refreshAccessToken } from '../controllers/authController.js';
import { validateWhiteLabel, verifyRSAToken } from '../middlewares/auth.js';
import { generateJWTLoginValidation, validateLoginRequest } from '../validations/authValidation.js';
import { handleValidationErrors } from '../middlewares/validation.js';
import { validateReq } from '../validations/index.js';

router.post('/generate-jwt-login', generateJWTLoginValidation, handleValidationErrors,validateWhiteLabel,verifyRSAToken, generateJWTAndLogin);
// User Login
router.post("/clientlogin", validateLoginRequest(), validateReq, login);
// Refresh Access Token
router.post("/refresh-token", refreshAccessToken);

export default router;