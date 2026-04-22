import { body, query } from "express-validator";
export const getOrderValidationRules = () => {
    return [
      query("tAccountNo")
        .notEmpty()
        .withMessage("Account Number is required")
        .isString()
        .withMessage("Invalid Account Number format")
    ];
  };

export const getClosedOrderValidationRules = ()=>{
    return [
        query("tAccountNo")
          .notEmpty()
          .withMessage("Account Number is required")
          .isString()
          .withMessage("Invalid Account Number format"),
          query("fromDate")
          .notEmpty()
          .withMessage("From Date is required")
          .matches(/^\d{2}\.\d{2}\.\d{4}$/)
        .withMessage('Date must be in the format DD.MM.YYYY'),
          query("toDate")
          .notEmpty()
          .withMessage("From Date is required")
          .matches(/^\d{2}\.\d{2}\.\d{4}$/)
        .withMessage('Date must be in the format DD.MM.YYYY'),
    ];
}


export const getReportOverviewValidationRules = ()=>{
  return [
        query("fromDate")
        .notEmpty()
        .withMessage("From Date is required")
        .matches(/^\d{2}\.\d{2}\.\d{4}$/)
      .withMessage('Date must be in the format DD.MM.YYYY'),
        query("toDate")
        .notEmpty()
        .withMessage("From Date is required")
        .matches(/^\d{2}\.\d{2}\.\d{4}$/)
      .withMessage('Date must be in the format DD.MM.YYYY'),
  ];
}

export const getClosedOrderDetailsValidationRules = () => {
  return [
    query("tAccountNo")
      .notEmpty()
      .withMessage("Account Number is required")
      .isString()
      .withMessage("Invalid Account Number format"),
      query("positionID")
      .notEmpty()
      .withMessage("positionID is required")
      .isString()
      .withMessage("Invalid positionID format")
  ];
};