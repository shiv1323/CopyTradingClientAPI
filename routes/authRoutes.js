import express from 'express';
const router = express.Router();
import { generateJWTAndLogin, login, refreshAccessToken, authenticateOtp } from '../controllers/authController.js';
import { validateWhiteLabel, verifyRSAToken } from '../middlewares/auth.js';
import { generateJWTLoginValidation, validateLoginRequest } from '../validations/authValidation.js';
import { handleValidationErrors } from '../middlewares/validation.js';
import { validateReq } from '../validations/index.js';
import { authHandler } from '../middlewares/authHandler.js';

router.post('/generate-jwt-login', generateJWTLoginValidation, handleValidationErrors,validateWhiteLabel,verifyRSAToken, generateJWTAndLogin);
// User Login
router.post("/clientlogin", validateLoginRequest(), validateReq, login);
// Refresh Access Token
router.post("/refresh-token", refreshAccessToken);
router.post("/otpaauthentication",authHandler,authenticateOtp); // checked
router.post("/validateotpauth",authHandler,authenticateOtpValidate); // checked
export default router;