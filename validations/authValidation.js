import { body } from 'express-validator';

export const generateJWTLoginValidation = [
  body('token')
    .optional()
    .isString()
    .withMessage('token must be a string'),
  body('domain')
    .optional()
    .isString()
    .withMessage('domain must be a string'),
  body().custom((_, { req }) => {
    const token = req.body?.token ?? req.query?.token;
    if (!token) {
      throw new Error('JWT token is required');
    }
    return true;
  }),
  body().custom((_, { req }) => {
    const domainFromBodyOrQuery = req.body?.domain ?? req.query?.domain;
    if (domainFromBodyOrQuery) return true;

    if (req.headers?.referer) {
      try {
        const refererUrl = new URL(req.headers.referer);
        if (refererUrl.hostname) return true;
      } catch (_error) {
        // Ignore invalid referer and continue to origin check.
      }
    }

    if (req.headers?.origin) {
      try {
        const originUrl = new URL(req.headers.origin);
        if (originUrl.hostname) return true;
      } catch (_error) {
        // Ignore invalid origin URL.
      }
    }

    throw new Error('domain is required');
  }),
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