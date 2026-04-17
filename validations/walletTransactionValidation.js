import { body } from "express-validator";

const ALLOWED_TRANSACTION_TYPES = {
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  TRANSFER: "TRANSFER",
  TRTOTRTRANSFER: "TRTOTRTRANSFER",
  DIRECTDEPOSITS : "DIRECTDEPOSITS",
  CREDIT : "CREDIT",
  CORRECTION : "CORRECTION",
  CHARGE : "CHARGE", 
  BONUS: "BONUS",
  ALL: "ALL",
};

const ALLOWED_STATUS_TYPES = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
  REJECTED: "REJECTED",
  ALL: "ALL",
};

export const getTransactionHistoryValidationRules = () => {
  return [
    body("transactionType")
      .optional()
      .isString()
      .withMessage("Invalid Transaction Type format")
      .custom((value) => {
        if (!Object.values(ALLOWED_TRANSACTION_TYPES).includes(value)) {
          throw new Error(
            `Invalid Transaction Type. Allowed values: ${Object.values(
              ALLOWED_TRANSACTION_TYPES
            ).join(", ")}`
          );
        }
        return true;
      }),

    body("status")
      .optional()
      .isString()
      .withMessage("Invalid status Type format")
      .custom((value) => {
        if (!Object.values(ALLOWED_STATUS_TYPES).includes(value)) {
          throw new Error(
            `Invalid Status Type. Allowed values: ${Object.values(
              ALLOWED_STATUS_TYPES
            ).join(", ")}`
          );
        }
        return true;
      }),
  ];
};

