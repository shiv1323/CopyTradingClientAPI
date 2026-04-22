import { body } from 'express-validator';

export const generateJWTLoginValidation = [
  body('token')
    .notEmpty()
    .withMessage('JWT token is required')
    .isString()
    .withMessage('token must be a string'),
  body('domain')
    .notEmpty()
    .withMessage('domain is required')
    .isString()
    .withMessage('domain must be a string'),
];
export const validateLoginRequest = () => {
  return [
    body("email")
      .optional()
      .isEmail()
      .withMessage("Valid email is required if provided"),
    body("userId")
      .optional()
      .isString()
      .withMessage("User ID must be a valid string"),
    body("password").notEmpty().withMessage("Password is required"),
    body("otpCode")
      .optional()
      .isString()
      .withMessage("OTP code must be a string"),
  ];
};