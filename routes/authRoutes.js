import express from 'express';
const router = express.Router();
import { generateJWTAndLogin } from '../controllers/authController.js';
import { validateWhiteLabel, verifyRSAToken } from '../middlewares/auth.js';
import { generateJWTLoginValidation } from '../validations/authValidation.js';
import { handleValidationErrors } from '../middlewares/validation.js';

router.post('/generate-jwt-login', generateJWTLoginValidation, handleValidationErrors,validateWhiteLabel,verifyRSAToken, generateJWTAndLogin);