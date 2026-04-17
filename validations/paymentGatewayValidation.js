import { body, param, query } from "express-validator";

export const depositAmountRules = () => {
  return [
    body("amount")
      .notEmpty()
      .withMessage("Amount is required")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => value > 0)
      .withMessage("Amount must be greater than 0"),

    body("crypto_currency")
      .notEmpty()
      .withMessage("Crypto currency is required")
      .isString()
      .withMessage("Crypto currency must be a string"),

    body("currency")
      .notEmpty()
      .withMessage("Currency is required")
      .isString()
      .withMessage("Currency must be a string"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),

    body("mobile_number")
      .notEmpty()
      .withMessage("Mobile number is required")
      .isString()
      .withMessage("Mobile number must be a string"),

    body("network_id")
      .notEmpty()
      .withMessage("Network ID is required")
      .isString()
      .withMessage("Network ID must be a string"),

    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .isString()
      .withMessage("Username must be a string"),
  ];
};

export const submitTransactionRules = () => {
  return [
    body("transaction_hash")
      .notEmpty()
      .withMessage("Transaction hash is required")
      .isString()
      .withMessage("Transaction hash must be a string"),

    body("transfer_reference_id")
      .notEmpty()
      .withMessage("Transfer reference ID is required")
      .isString()
      .withMessage("Transfer reference ID must be a string"),

    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .isString()
      .withMessage("Username must be a string"),

    body("tAccount")
      .notEmpty()
      .withMessage("Target account is required")
      .isString()
      .withMessage("Target account must be a string"),

    body("amount")
      .notEmpty()
      .withMessage("Amount is required")
      .isNumeric()
      .withMessage("Amount must be a number")
      .custom((value) => value > 0)
      .withMessage("Amount must be greater than 0"),

    body("block_number")
      .optional()
      .isNumeric()
      .withMessage("Block number must be numeric if provided"),
  ];
};
