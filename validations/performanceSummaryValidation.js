import { body } from "express-validator";

export const validateGetClientTrRequestBody = () => {
  return [
    body("paymentMethod")
      .exists()
      .withMessage("Payment Method field must exist")
      .notEmpty()
      .withMessage("Payment Method is required")
      .trim(),

    body("currency")
      .exists()
      .withMessage("Currency field must exist")
      .notEmpty()
      .withMessage("Currency is required")
      .trim(),

    body("walletAddress")
      .exists()
      .withMessage("Wallet Address field must exist")
      .notEmpty()
      .withMessage("Wallet Address is required")
      .trim(),

    body("amount")
      .exists()
      .withMessage("Amount field must exist")
      .notEmpty()
      .withMessage("Amount is required")
      .isNumeric()
      .withMessage("Amount must be a valid number"),
  ];
};
