import { body, validationResult } from "express-validator";
import { validateEncryptedPasswordFormat } from "../utils/commonUtils.js";
import whiteLabelRepository from "../repositories/whiteLabelRepository.js";
import mongoose from "mongoose";

export const validateCreateUserRequestBody = () => {
  return [
    body("company").isString().withMessage("Company is required").optional(),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isString()
      .custom(validateEncryptedPasswordFormat)
      .withMessage("Password must be in the correct encrypted format"),
    body("confirmPassword")
      .isString()
      .custom(validateEncryptedPasswordFormat)
      .withMessage("Password must be in the correct encrypted format"),
    body("status")
      .isIn(["active", "suspended", "blocked"])
      .withMessage("Status must be either active or suspended"),
    body("role")
      .optional()
      .isIn(["Administrator", "Sub-Administrator"])
      .withMessage("Role must be either Administrator or Sub-Administrator"),
    body("whiteLabel")
      .optional()
      .isMongoId()
      .withMessage("WhiteLabel ID must be a valid MongoDB ObjectId"),
    // body("partnerId")
    //   .optional()
    //   .isMongoId()
    //   .withMessage("Partner ID must be a valid MongoDB ObjectId"),
    body("rolePermission")
      .optional()
      .isString()
      .withMessage("Role permission must be a string"),
  ];
};

export const validateSignUpClientUserRequest = () => {
  return [
    body("country").notEmpty().withMessage("Country is required"),
    body("countryCode").notEmpty().withMessage("Country code is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isString()
      .custom(validateEncryptedPasswordFormat)
      .withMessage("Password must be in the correct encrypted format"),
    //body("baseUrl").notEmpty().withMessage("Base URL is required"),
    body("referralCode")
      .optional()
      .isString()
      .withMessage("Referral code must be a string"),
    body("isTaxResident")
      .isBoolean()
      .withMessage("Tax residency status must be explicitly specified"),
  ];
};

export const validateReferralCodeRule = () => {
  return [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isString()
      .custom(validateEncryptedPasswordFormat)
      .withMessage("Password must be in the correct encrypted format"),
    body("agentReferralCode")
      .optional()
      .isString()
      .withMessage("Agent Referral Code must be a string"),

    body("referralCode")
      .optional()
      .isString()
      .withMessage("Referral Code must be a string"),

    body().custom((value) => {
      const { agentReferralCode, referralCode } = value;

      if (!agentReferralCode && !referralCode) {
        throw new Error(
          "Either agentReferralCode or referralCode is required"
        );
      }

      if (agentReferralCode && referralCode) {
        throw new Error(
          "Only one of agentReferralCode or referralCode is allowed"
        );
      }

      return true;
    }),

    body("isTaxResident")
      .isBoolean()
      .withMessage("isTaxResident must be a boolean")
      .custom((value) => value === false)
      .withMessage("Account creation is not allowed for tax residents"),
  ];
};

export const validateUpdateNumber = () => {
  return [
    body("number")
      .notEmpty()
      .withMessage("Number is required to make this request"),

    body("countryCode")
      .notEmpty()
      .withMessage("countryCode is required to make this request"),
  ];
};
export const validateLoginRequest = () => {
  return [
    body("email")
      .optional()
      .isEmail()
      .withMessage("Valid email is required if provided"),
    body("userId")
      .optional()
      .isString()
      .withMessage("User ID must be a valid string"),
    body("password").notEmpty().withMessage("Password is required"),
    body("otpCode")
      .optional()
      .isString()
      .withMessage("OTP code must be a string"),
  ];
};
export const validateOTPRequest = () => {
  return [
    body("otpCode").optional().isString().withMessage("OTP must be a string"),
    body("tempToken")
      .optional()
      .isString()
      .withMessage("tempCode must be a string"),
  ];
};
export const validateVerifyPhoneRequest = () => {
  return [
    body("phoneNo")
      .notEmpty()
      .withMessage("Phone number is required")
      .isString()
      .withMessage("Phone number must be a string"),
  ];
};
export const validateEmailRequest = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
  ];
};
export const validateChooseOTPDeliveryMethodRequest = () => {
  return [
    body("otpGenerationMethod")
      .notEmpty()
      .withMessage("OTP generation method is required")
      .isIn(["email", "phone"])
      .withMessage("OTP generation method must be either 'email' or 'phone'"),
  ];
};

const partialValidations = [
  body("firstName").notEmpty().withMessage("First name is required"),
  body("lastName").notEmpty().withMessage("Last name is required"),
  body("dob")
    .notEmpty()
    .withMessage("Date of birth is required")
    .isISO8601()
    .withMessage("Date of birth must be in ISO8601 format"),
  body("region").notEmpty().withMessage("Region is required"),
  body("address").notEmpty().withMessage("Address is required"),
  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["male", "female", "others"])
    .withMessage("Gender must be 'male', 'female', or 'others'"),
];

const extendedValidation = [
  body("purpose").notEmpty().withMessage("Purpose is required"),
  body("employmentStatus")
    .notEmpty()
    .withMessage("Employment status is required")
    .isIn([
      "student",
      "unemployed",
      "retired",
      "employedFullTime",
      "employedPartTime",
      "selfEmployed",
      "businessOwner",
    ])
    .withMessage("Invalid employment status"),
  body("employerDetails")
    .if(body("employmentStatus").isIn(["employedFullTime", "employedPartTime"]))
    .notEmpty()
    .withMessage("Employer details are required for employed status"),
  body("businessName")
    .if(body("employmentStatus").isIn(["selfEmployed", "businessOwner"]))
    .notEmpty()
    .withMessage(
      "Business name is required for self-employed or business owner status",
    ),
  body("totalWealth").notEmpty().withMessage("Total wealth is required"),
  body("yearlyIncome").notEmpty().withMessage("Yearly income is required"),
  body("cfdTradingExperience")
    .notEmpty()
    .withMessage("CFD trading experience is required"),
  body("marketAnalysisTime")
    .notEmpty()
    .withMessage("Market analysis time is required"),
  body("incomePercentageToInvest")
    .notEmpty()
    .withMessage("Income percentage to invest is required"),
  body("cfdAssociateExperience")
    .notEmpty()
    .withMessage("CFD associate experience is required")
    .isBoolean()
    .withMessage("CFD associate experience must be a boolean"),
  body("incomeSource").isArray().withMessage("Income source must be an array"),
];

// Final exported middleware
export const validateQuestionnaireRequest = async (req, res, next) => {
  let whiteLabel = req?.user?.whiteLabel;
  whiteLabel = new mongoose.Types.ObjectId(whiteLabel);
  const whiteLabelData =
    await whiteLabelRepository.findWhiteLabelByIdSelectedField(
      whiteLabel,
      "configDetails.partialQuestionnaire",
    );

  const partialQuestionnaire =
    whiteLabelData.configDetails.partialQuestionnaire || false;

  const selectedValidation = partialQuestionnaire
    ? partialValidations
    : [...partialValidations, ...extendedValidation];

  return Promise.all(
    selectedValidation.map((validation) => validation.run(req)),
  )
    .then(() => next())
    .catch(next);
};

export const validateResetPasswordRequest = () => {
  return [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isString()
      .withMessage("New password must be a string")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("Confirm password is required")
      .isString()
      .withMessage("Confirm password must be a string")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("New password and confirm password do not match");
        }
        return true;
      }),
  ];
};
export const validateId = () => {
  return [
    body("_id")
      .notEmpty()
      .withMessage("Client ID is required")
      .isString()
      .withMessage("Client ID must be a string"),
  ];
};
