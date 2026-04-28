import { body,check } from "express-validator";
import { VerificationStatus } from "../models/clientDoc.model.js";
import mongoose from "mongoose";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/pdf",
  "image/heic",
];

export const documentBodyValidator = () => {
  return [
    body("clientId").isMongoId().withMessage("Invalid userId format"),

    body("documentType")
      .isIn(Object.values(DocumentType))
      .withMessage(
        `documentType must be one of: ${Object.values(DocumentType).join(", ")}`
      ),
    body("documentNumber")
      .isString()
      .withMessage("documentNumber must be a string")
      .notEmpty()
      .withMessage("documentNumber is required"),

    body("documentName")
      .isIn(Object.values(DocumentName))
      .withMessage(
        `documentName must be one of: ${Object.values(DocumentName).join(", ")}`
      ),

    body("fileDetails.originalName")
      .isString()
      .withMessage("originalName must be a string")
      .notEmpty()
      .withMessage("originalName is required"),

    body("fileDetails.fileName")
      .isString()
      .withMessage("fileName must be a string")
      .notEmpty()
      .withMessage("fileName is required"),

    body("fileDetails.fileType")
      .isString()
      .withMessage("fileType must be a string")
      .notEmpty()
      .withMessage("fileType is required"),

    // body("fileDetails.fileSize")
    //   .isNumeric()
    //   .withMessage("fileSize must be a number")
    //   .notEmpty()
    //   .withMessage("fileSize is required"),

    body("fileDetails.path")
      .isString()
      .withMessage("path must be a string")
      .notEmpty()
      .withMessage("path is required"),

    body("fileDetails.mimeType")
      .isString()
      .withMessage("mimeType must be a string")
      .notEmpty()
      .withMessage("mimeType is required"),

    body("status")
      .optional()
      .isIn(Object.values(VerificationStatus))
      .withMessage(
        `status must be one of: ${Object.values(VerificationStatus).join(", ")}`
      ),

    body("verificationDetails.verifiedBy")
      .optional()
      .isMongoId()
      .withMessage("Invalid verifiedBy ID format"),

    body("verificationDetails.verifiedAt")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("verifiedAt must be a valid date"),

    body("verificationDetails.remarks")
      .optional()
      .isString()
      .withMessage("remarks must be a string"),

    body("verificationDetails.rejectionReason")
      .optional()
      .isString()
      .withMessage("rejectionReason must be a string"),
  ];
};
const DocumentType = {
  IDENTITY_PROOF: "IDENTITY_PROOF",
  ADDRESS_PROOF: "ADDRESS_PROOF",
};

const DocumentName = {
  PASSPORT: "PASSPORT",
  DRIVING_LICENSE: "DRIVER_LICENSE",
  NATIONAL_ID: "NATIONAL_ID",
  UTILITY_BILL: "UTILITY_BILL",
  BANK_STATEMENT: "BANK_STATEMENT",
  RENTAL_AGREEMENT: "RENTAL_AGREEMENT",
};
export const validateUploadDocFiles = () => {
  return [
    body("documentType")
      .exists()
      .withMessage("DocumentType is required")
      .notEmpty()
      .withMessage("DocumentType cannot be empty")
      .isIn(Object.values(DocumentType))
      .withMessage(
        `documentType must be one of: ${Object.values(DocumentType).join(", ")}`
      ),

    body("documentName")
      .exists()
      .withMessage("documentName is required")
      .notEmpty()
      .withMessage("documentName cannot be empty")
      .isIn(Object.values(DocumentName))
      .withMessage(
        `documentName must be one of: ${Object.values(DocumentName).join(", ")}`
      ),

    // body("permission")
    //   .exists()
    //   .withMessage("Permission is required")
    //   .isBoolean()
    //   .withMessage("Permission must be a boolean value"),

    // body("documents")
    //   .exists()
    //   .withMessage("Documents are required")
    //   .isArray()
    //   .withMessage("Documents must be an array")
    //   .notEmpty()
    //   .withMessage("Documents array cannot be empty"),
  ];
};
