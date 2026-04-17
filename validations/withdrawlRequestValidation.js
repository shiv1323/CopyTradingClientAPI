import { body } from "express-validator";

export const validateWithdrawlRequestBody = () => {
  return [
    body("paymentMethod")
      .exists()
      .withMessage("Payment Method field must exist")
      .notEmpty()
      .withMessage("Payment Method is required")
      .trim(),

    body("requestType")
      .exists()
      .withMessage("requestType field must exist")
      .notEmpty()
      .withMessage("requestType is required")
      .trim()
      .isIn(["UPI", "BANK", "CRYPTO", "CASH"])
      .withMessage("requestType must be one of: UPI, BANK, or CRYPTO"),

    body("amount")
      .exists()
      .withMessage("Amount field must exist")
      .notEmpty()
      .withMessage("Amount is required")
      .isNumeric()
      .withMessage("Amount must be a valid number"),

    body("bankName")
      .if(body("requestType").equals("BANK"))
      .notEmpty()
      .withMessage("bankName is required when requestType is BANK"),

    body("accNumber")
      .if(body("requestType").equals("BANK"))
      .notEmpty()
      .withMessage("accNumber is required when requestType is BANK"),

    body("accHolderName")
      .if(body("requestType").equals("BANK"))
      .notEmpty()
      .withMessage(
        "accHolderName is required when requestType is BANK"
      ),

    body("bankIdentifier")
      .if(body("requestType").equals("BANK"))
      .isArray({ min: 1 })
      .withMessage(
        "bankIdentifier must be a non-empty array when requestType is BANK"
      ),

    // Conditional: UpiAccount
    body("upiId")
      .if(body("requestType").equals("UPI"))
      .notEmpty()
      .withMessage("upiId is required when requestType is UPI"),

    body("accHolderName")
      .if(body("requestType").equals("UPI"))
      .notEmpty()
      .withMessage(
        "accHolderName is required when requestType is UPI"
      ),

    // Conditional: Cash
    body("receiverName")
      .if(body("requestType").equals("CASH"))
      .notEmpty()
      .withMessage(
        "receiverName is required when requestType is CASH"
      ),

    // Conditional: Crypto
    body("walletAddress")
      .if(body("requestType").equals("CRYPTO"))
      .notEmpty()
      .withMessage("walletAddress is required when requestType is CRYPTO"),

    body("currency")
      .if(body("requestType").equals("CRYPTO"))
      .notEmpty()
      .withMessage("currency is required when requestType is CRYPTO"),
  ];
};
