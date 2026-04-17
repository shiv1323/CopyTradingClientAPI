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
