import { body } from "express-validator";
export const getOrderValidationRules = () => {
    return [
      body("tAccountNo")
        .notEmpty()
        .withMessage("Account Number is required")
        .isString()
        .withMessage("Invalid Account Number format")
    ];
  };

export const getClosedOrderValidationRules = ()=>{
    return [
        body("tAccountNo")
          .notEmpty()
          .withMessage("Account Number is required")
          .isString()
          .withMessage("Invalid Account Number format"),
          body("fromDate")
          .notEmpty()
          .withMessage("From Date is required")
          .matches(/^\d{2}\.\d{2}\.\d{4}$/)
        .withMessage('Date must be in the format DD.MM.YYYY'),
          body("toDate")
          .notEmpty()
          .withMessage("From Date is required")
          .matches(/^\d{2}\.\d{2}\.\d{4}$/)
        .withMessage('Date must be in the format DD.MM.YYYY'),
    ];
}


export const getReportOverviewValidationRules = ()=>{
  return [
        body("fromDate")
        .notEmpty()
        .withMessage("From Date is required")
        .matches(/^\d{2}\.\d{2}\.\d{4}$/)
      .withMessage('Date must be in the format DD.MM.YYYY'),
        body("toDate")
        .notEmpty()
        .withMessage("From Date is required")
        .matches(/^\d{2}\.\d{2}\.\d{4}$/)
      .withMessage('Date must be in the format DD.MM.YYYY'),
  ];
}

export const getClosedOrderDetailsValidationRules = () => {
  return [
    body("tAccountNo")
      .notEmpty()
      .withMessage("Account Number is required")
      .isString()
      .withMessage("Invalid Account Number format"),
      body("positionID")
      .notEmpty()
      .withMessage("positionID is required")
      .isString()
      .withMessage("Invalid positionID format")
  ];
};