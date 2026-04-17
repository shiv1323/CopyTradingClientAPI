import { body } from 'express-validator';

export const validateCreateTicket = () => {
    return [
      body('title')
        .exists()
        .withMessage('Title field must exist')
        .notEmpty()
        .withMessage('Title is required')
        .trim(),
      
      body('description')
        .exists()
        .withMessage('Description field must exist')
        .notEmpty()
        .withMessage('Description is required')
        .trim(),
      
      body('category')
        .exists()
        .withMessage('Category field must exist')
        .notEmpty()
        .withMessage('Category is required')
        .trim(),
      
      body('subcategory')
        .exists()
        .withMessage('Subcategory field must exist')
        .notEmpty()
        .withMessage('Subcategory is required')
        .trim(),
      
      body('files')
        .optional()
        .isArray()
        .withMessage('Files must be an array')
    ];
  };
export const validateUpdateTicket = () => {
    return [
      body('ticketId')
        .notEmpty()
        .withMessage('Ticket ID is required'),
  
      body('title')
        .optional()
        .notEmpty()
        .withMessage('Title cannot be empty'),
  
      body('description')
        .optional()
        .notEmpty()
        .withMessage('Description cannot be empty'),
  
      body('category')
        .optional()
        .notEmpty()
        .withMessage('Category cannot be empty'),
  
      body('subcategory')
        .optional()
        .notEmpty()
        .withMessage('Subcategory cannot be empty'),
  
      body('files')
        .optional()
        .isArray()
        .withMessage('Files must be an array'),
      
      body('message')
        .optional()
        .notEmpty()
        .withMessage('Message cannot be empty'),
    ];
  };
  