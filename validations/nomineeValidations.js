import { body } from 'express-validator';

export const validateCreateNominee = () => {
  return [
    body('fullName')
      .notEmpty()
      .withMessage('Full Name is required')
      .isString()
      .withMessage('Full Name must be a string'),
    body('relationship')
      .notEmpty()
      .withMessage('Relationship is required')
      .isString()
      .withMessage('Relationship must be a string'),
    body('dateOfBirth')
      .notEmpty()
      .withMessage('Date of Birth is required')
      .isDate()
      .withMessage('Date of Birth must be a valid date'),
    body('contactNumber')
      .notEmpty()
      .withMessage('Contact Number is required')
      .isString()
      .withMessage('Contact Number must be a string'),
    body('emailAddress')
      .notEmpty()
      .withMessage('Email Address is required')
      .isEmail()
      .withMessage('Email Address must be a valid email'),
    body('address.street')
      .notEmpty()
      .withMessage('Street Address is required')
      .isString()
      .withMessage('Street must be a string'),
    body('address.city')
      .notEmpty()
      .withMessage('City is required')
      .isString()
      .withMessage('City must be a string'),
    body('address.state')
      .notEmpty()
      .withMessage('State is required')
      .isString()
      .withMessage('State must be a string'),
    body('address.postalCode')
      .notEmpty()
      .withMessage('Postal Code is required')
      .isString()
      .withMessage('Postal Code must be a string'),
    body('address.country')
      .notEmpty()
      .withMessage('Country is required')
      .isString()
      .withMessage('Country must be a string'),
  ];
};

export const validateDeleteNominee = () => {
    return [
      body('nomineeId')
        .notEmpty()
        .withMessage('Nominee ID is required')
        .isMongoId()
        .withMessage('Nominee ID must be a valid MongoDB ObjectId'),
    ];
  };
  export const validateUploadNomineeDocuments = () => {
    return [
      body('nomineeId')
        .notEmpty()
        .withMessage('Nominee ID is required')
        .isMongoId()
        .withMessage('Nominee ID must be a valid MongoDB ObjectId'),
  
      body('documentType')
        .optional()
        .isString()
        .withMessage('Document Type must be a string'),
  
      body('documentNumber')
        .optional()
        .isString()
        .withMessage('Document Number must be a string'),
  
      body('files')
        .custom((value, { req }) => {
          if (!req.files || req.files.length === 0) {
            throw new Error('No files uploaded');
          }
          return true;
        }),
    ];
  };
  