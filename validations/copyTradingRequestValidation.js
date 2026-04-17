import { body } from "express-validator";

export const raiseCTFollowRequest = () => {
  return [
    body("masterUserId")
      .notEmpty()
      .withMessage("masterUserId is required")
      .isMongoId()
      .withMessage("masterUserId must be a valid MongoId"),

    body("masterTrAccout")
      .notEmpty()
      .withMessage("masterTrAccout is required")
      .isString()
      .withMessage("masterTrAccout must be a string"),

    body("slefTrAccount")
      .optional()
      .isString()
      .withMessage("slefTrAccount must be a string"),

    body("tradingCondition")
      .notEmpty()
      .withMessage("tradingCondition is required")
      .isString()
      .withMessage("tradingCondition must be a string")
      .custom((value) => {
        const allowedModes = ["EQUITY", "BALANCE", "FIXED", "VOLUME_PERCENT"];
        if (!allowedModes.includes(value.toUpperCase())) {
          throw new Error(
            `Invalid tradingCondition. Must be one of: ${allowedModes.join(
              ", ",
            )}`,
          );
        }
        return true;
      }),

    body("ratio")
      .notEmpty()
      .withMessage("ratio is required")
      .isNumeric()
      .withMessage("ratio must be a number")
      .custom((value, { req }) => {
        const mode = req.body.tradingCondition?.toUpperCase();
        if (!mode) return true;

        if (["EQUITY", "BALANCE"].includes(mode)) {
          if (value <= 0) {
            throw new Error("Ratio must be greater than 0 for EQUITY/BALANCE");
          }
        } else if (mode === "FIXED") {
          if (value <= 0) {
            throw new Error("Ratio must be greater than 0 for FIXED mode");
          }
        } else if (mode === "VOLUME_PERCENT") {
          if (value <= 0 || value > 100) {
            throw new Error(
              "Ratio must be between 0 and 100 for VOLUME_PERCENT mode",
            );
          }
        }

        return true;
      }),
  ];
};

export const updateRulesConfig = () => {
  return [
    body("masterAccountId")
      .notEmpty()
      .withMessage("masterAccountId is required")
      .isMongoId()
      .withMessage("masterAccountId must be a valid MongoId"),

    body("followerLoginId")
      .notEmpty()
      .withMessage("followerLoginId is required")
      .isString()
      .withMessage("followerLoginId must be a string"),

    body("volumeRule.mode")
      .isIn(["EQUITY", "FIXED", "BALANCE", "VOLUME_PERCENT"])
      .withMessage(
        "volumeRule.mode must be one of: EQUITY, FIXED, BALANCE, VOLUME_PERCENT",
      ),

    body("volumeRule.value")
      .isNumeric()
      .withMessage("volumeRule.value must be a number")
      .custom((value, { req }) => {
        const mode = req.body.volumeRule?.mode;
        if (!mode)
          throw new Error("volumeRule.mode is required to validate value");
        switch (mode.toUpperCase()) {
          case "EQUITY":
          case "BALANCE":
            if (value < 0.01)
              throw new Error(
                `${mode} value must be at least 0.01 (meaningful factor)`,
              );
            break;

          case "FIXED":
            if (value < 0.01)
              throw new Error(
                "FIXED value must be at least 0.01 (minimum lot size)",
              );
            break;

          case "VOLUME_PERCENT":
            if (value < 1 || value > 100)
              throw new Error(
                "VOLUME_PERCENT value must be between 1 and 100 (percent)",
              );
            break;

          default:
            throw new Error(`Invalid volumeRule.mode: ${mode}`);
        }
        return true;
      }),

    // body("volumeRule.value")
    //   .isNumeric()
    //   .withMessage("volumeRule.value must be a number")
    //   .custom((value) => value >= 0)
    //   .withMessage("volumeRule.value must be greater than or equal to 0"),

    body("inverseCopy")
      .optional()
      .isBoolean()
      .withMessage("inverseCopy must be a boolean"),

    body("minVolume")
      .optional()
      .isNumeric()
      .withMessage("minVolume must be a number")
      .custom((value) => value >= 0)
      .withMessage("minVolume must be greater than or equal to 0"),

    body("maxSlippage")
      .optional()
      .isNumeric()
      .withMessage("maxSlippage must be a number")
      .custom((value) => value >= 0)
      .withMessage("maxSlippage must be greater than or equal to 0"),

    body("maxDelay")
      .optional()
      .isNumeric()
      .withMessage("maxDelay must be a number")
      .custom((value) => value >= 0)
      .withMessage("maxDelay must be greater than or equal to 0"),

    body("minEquityPercent")
      .optional()
      .isNumeric()
      .withMessage("minEquityPercent must be a number")
      .custom((value) => value >= 0 && value <= 100)
      .withMessage("minEquityPercent must be between 0 and 100"),

    body("stopLossRule")
      .optional({ nullable: true }) // ✅ allows null + undefined
      .isFloat({ min: 0, max: 100 }) // ✅ only 0%–100%
      .withMessage("stopLossRule must be a percentage between 0 and 100")
      .custom((value) => {
        if (value === 0) return true; // 0 allowed (will convert to null)
        if (value === undefined || value === null) return true;

        // Reject string "null" or invalid types
        if (value === "null" || value === "undefined") {
          throw new Error("stopLossRule must be a valid percentage number");
        }

        const num = Number(value);

        if (Number.isNaN(num)) {
          throw new Error("stopLossRule must be a valid number");
        }

        // Max 2 decimal places (for % precision)
        const valueStr = num.toString();
        const decimalPart = valueStr.split(".")[1] || "";

        if (decimalPart.length > 2) {
          throw new Error("stopLossRule must not exceed 2 decimal places");
        }

        return true;
      }),

    body("takeProfitRule")
      .optional({ nullable: true }) // ✅ allows null + undefined
      .isFloat({ min: 0, max: 100 }) // ✅ only 0%–100%
      .withMessage("takeProfitRule must be a percentage between 0 and 100")
      .custom((value) => {
        if (value === 0) return true; // 0 allowed (will convert to null)
        if (value === undefined || value === null) return true;

        // Reject string "null" or invalid types
        if (value === "null" || value === "undefined") {
          throw new Error("takeProfitRule must be a valid percentage number");
        }

        const num = Number(value);

        if (Number.isNaN(num)) {
          throw new Error("takeProfitRule must be a valid number");
        }

        // Max 2 decimal places (for % precision)
        const valueStr = num.toString();
        const decimalPart = valueStr.split(".")[1] || "";

        if (decimalPart.length > 2) {
          throw new Error("takeProfitRule must not exceed 2 decimal places");
        }

        return true;
      }),
  ];
};

export const setMasterRulesForAllFollowersValidation = () => {
  return [
    body("masterLoginId")
      .notEmpty()
      .withMessage("masterLoginId is required")
      .isString()
      .withMessage("masterLoginId must be a string"),

    body("stopLossRule")
      .optional()
      .isNumeric()
      .withMessage("stopLossRule must be a number")
      .custom((value) => {
        if (value === 0) return true;
        if (value === undefined) return true;
        if (value < 0) {
          throw new Error("stopLossRule must be greater than or equal to 0");
        }
        const valueStr = value.toString();
        const parts = valueStr.split(".");
        const integerPart = parts[0].replace("-", "");
        const decimalPart = parts[1] || "";
        if (integerPart.length > 10) {
          throw new Error("stopLossRule must not exceed 10 digits");
        }
        if (decimalPart.length > 2) {
          throw new Error("stopLossRule must not exceed 2 decimal places");
        }
        return true;
      }),

    body("takeProfitRule")
      .optional()
      .isNumeric()
      .withMessage("takeProfitRule must be a number")
      .custom((value) => {
        if (value === 0) return true;
        if (value === undefined) return true;
        if (value < 0) {
          throw new Error("takeProfitRule must be greater than or equal to 0");
        }
        const valueStr = value.toString();
        const parts = valueStr.split(".");
        const integerPart = parts[0].replace("-", "");
        const decimalPart = parts[1] || "";
        if (integerPart.length > 10) {
          throw new Error("takeProfitRule must not exceed 10 digits");
        }
        if (decimalPart.length > 2) {
          throw new Error("takeProfitRule must not exceed 2 decimal places");
        }
        return true;
      }),

    body().custom((value, { req }) => {
      if (
        req.body.stopLossRule === undefined &&
        req.body.takeProfitRule === undefined
      ) {
        throw new Error(
          "At least one of stopLossRule or takeProfitRule is required",
        );
      }
      return true;
    }),
  ];
};
