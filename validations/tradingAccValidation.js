import { body, param, query } from "express-validator";
import { validateEncryptedPasswordFormat } from "../utils/commonUtils.js";

export const createTradeAccValidationRules = () => {
  return [
    body("pass")
      .isString()
      .withMessage("Password must be in the correct encrypted format"),
    body("leverage")
      .isNumeric()
      .withMessage("Leverage must be provided")
      .custom((value) => value <= 2000)
      .withMessage("Leverage must be less than or equal to 2000"),
    //body("balance").isNumeric().withMessage("balance must be provided"),
    body("groupId").isString().withMessage("groupId must be provided"),
  ];
};
export const setBalanceValidationRules = () => {
  return [
    body("login").notEmpty().withMessage("Login is required"),
    body("sum").notEmpty().withMessage("Sum is required"),
  ];
};

const ClientStatus = {
  UNREGISTERED: "UNREGISTERED",
  REGISTERED: "REGISTERED",
  APPROVED: "APPROVED",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  CLOSED: "CLOSED",
  TERMINATED: "TERMINATED",
};

const ClientType = {
  UNDEFINED: "UNDEFINED",
  INDIVIDUAL: "INDIVIDUAL",
  CORPORATE: "CORPORATE",
  FUND: "FUND",
  FIRST: "FIRST",
  LAST: "LAST",
};

const ClientOrigin = {
  MANUAL: "MANUAL",
  DEMO: "DEMO",
  CONTEST: "CONTEST",
  PRELIMINARY: "PRELIMINARY",
  REAL: "REAL",
};

const PersonEmployment = {
  NONE: "NONE",
  AGRICULTURE: "AGRICULTURE",
  CONSTRUCTION: "CONSTRUCTION",
  MANAGEMENT: "MANAGEMENT",
  COMMUNICATION: "COMMUNICATION",
  EDUCATION: "EDUCATION",
  GOVERNMENT: "GOVERNMENT",
  HEALTHCARE: "HEALTHCARE",
  TOURISM: "TOURISM",
  IT: "IT",
  SECURITY: "SECURITY",
  MANUFACTURING: "MANUFACTURING",
  MARKETING: "MARKETING",
  SCIENCE: "SCIENCE",
  ENGINEERING: "ENGINEERING",
  TRANSPORT: "TRANSPORT",
  OTHER: "OTHER",
};

export const createClientValidationRules = () => {
  return [
    body("ClientStatus")
      .isString()
      .notEmpty()
      .withMessage("ClientStatus is required")
      .isIn(Object.values(ClientStatus))
      .withMessage(
        `ClientStatus must be one of: ${Object.values(ClientStatus).join(", ")}`
      ),

    body("ClientType")
      .isString()
      .notEmpty()
      .withMessage("ClientType is required")
      .isIn(Object.values(ClientType))
      .withMessage(
        `ClientType must be one of: ${Object.values(ClientType).join(", ")}`
      ),

    body("ClientOrigin")
      .isString()
      .notEmpty()
      .withMessage("ClientOrigin is required")
      .isIn(Object.values(ClientOrigin))
      .withMessage(
        `ClientOrigin must be one of: ${Object.values(ClientOrigin).join(", ")}`
      ),

    body("PersonEmployment")
      .isString()
      .notEmpty()
      .withMessage("PersonEmployment is required")
      .isIn(Object.values(PersonEmployment))
      .withMessage(
        `PersonEmployment must be one of: ${Object.values(PersonEmployment).join(", ")}`
      ),
  ];
};
export const validateArchiveAccount = () => {
  return [
    body("login")
      .notEmpty()
      .withMessage("Login is required in the request body"),
  ];
};
export const validateInitiateMT5PasswordChange = () => {
  return [
    body("accountType")
      .notEmpty()
      .withMessage("Account type is required")
      .isIn(["Demo", "Real"])
      .withMessage("Invalid account type. Must be 'Demo' or 'Real'"),
    body("passwordType")
      .isString()
      .withMessage("Password type must be a string")
      .isIn(["main", "investor"])
      .withMessage("Password type must be either 'main' or 'investor'"),

    body("newPassword").notEmpty().withMessage("New password is required"),

    body("loginId").notEmpty().withMessage("Login ID is required"),
  ];
};
export const validateVerifyAndChangeMT5Password = () => {
  return [
    body("otp").notEmpty().withMessage("OTP is required"),

    body("tempToken").notEmpty().withMessage("Temporary token is required"),
  ];
};

export const updLeverageValidationRules = () => {
  return [
    body("leverage")
      .isNumeric()
      .withMessage("Leverage should be valid Number")
      .notEmpty()
      .withMessage("Leverage is required")
      .custom((value) => value <= 2000)
      .withMessage("Leverage must be less than or equal to 2000"),

    body("tAccountNo")
      .isString()
      .withMessage("Trading Account should be valid String")
      .notEmpty()
      .withMessage("Temporary token is required"),
  ];
};

export const increaseLimitValidationRules = () => {
  return [
    body("increaseLimit")
      .isNumeric()
      .withMessage("Limit should be valid Number")
      .notEmpty()
      .withMessage("Limit is required"),
    body("reason")
      .isString()
      .withMessage("Reason should be valid String")
      .notEmpty()
      .withMessage("Reason is required"),
  ];
};

export const getTrAccountInfoRules = () => {
  return [
    query("loginId")
      .notEmpty()
      .withMessage("loginId is required")
      .isString()
      .withMessage("loginId must be a string")
      .trim()
      .isLength({ min: 3 })
      .withMessage("loginId must be at least 3 characters long"),
  ];
};

export const renameTrAccountRules = () => {
  return [
    body("loginId")
      .notEmpty()
      .withMessage("loginId is required")
      .isString()
      .withMessage("loginId must be a string")
      .trim(),

    body("newAccName")
      .notEmpty()
      .withMessage("newAccName is required")
      .isString()
      .withMessage("newAccName must be a string")
      .trim()
      .isLength({ min: 3, max: 50 })
      .withMessage("newAccName must be between 3 and 50 characters"),
  ];
};
