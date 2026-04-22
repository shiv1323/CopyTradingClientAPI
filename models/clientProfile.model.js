import mongoose from "mongoose";
import {
  getUTCTime,
} from "../utils/commonUtils.js";
import { sendCustomEmail } from "../utils/commonUtils.js";
import { decrypt, encrypt } from "../utils/authUtils.js";

const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
    },
    countryCode: {
      type: String,
      default: null,
    },
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
      default: null,
    },
    country: {
      type: String,
    },
    password: {
      type: String,
      required: false,
    },
    tokens: {
      web: {
        refreshToken: {
          token: { type: String },
          expiresAt: { type: Date },
        },
        currentSessionId: {
          type: String,
          default: null,
        },
        subSessionId: {
          type: String,
          default: null,
        },
        lastLogoutAt: {
          type: Date,
          default: null,
        },
      },
    
      mobile: {
        refreshToken: {
          token: { type: String },
          expiresAt: { type: Date },
        },
        currentSessionId: {
          type: String,
          default: null,
        },
        subSessionId: {
          type: String,
          default: null,
        },
        deviceId: {
          type: String,
          default: null,
        },
        lastLogoutAt: {
          type: Date,
          default: null,
        },
      },
    },
    name: {
      type: String,
      required: false,
      default: null,
    },
    email: {
      type: String,
      unique: true,
      default: null,
    },
    phoneNo: {
      type: String,
      required: false,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended", "blocked"],
      default: "active",
    },
    tradingAccLimit: {
      type: Number,
      default: 3,
    },
    createdAt: {
      type: Date,
      default: getUTCTime,
    },
    TwoFactorCompletion: {
      emailOTP: {
        type: String,
        default: null,
      },
      emailOTPExpiresAt: {
        type: Date,
        default: null,
      },
      otpSecret: {
        type: String,
        default: null,
      },
      otpExpiresAt: {
        type: Date,
        default: null,
      },
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null,
      },
      firstTimeLogin: {
        type: Number,
        default: 1,
      },
    },
  { collection: "clientProfile" }
);

clientSchema.statics.generateOTP = function () {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};
clientSchema.methods.sendEmailOTP = async function (email) {
  try {
    const otp = this.constructor.generateOTP();
    console.log("otp", otp);
    const encryptedOTP = encrypt(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    this.TwoFactorCompletion.otpSecret = encryptedOTP;
    this.TwoFactorCompletion.otpExpiresAt = otpExpiresAt;
    await this.save();
    const emailAddress = email;
    if (!emailAddress) {
      throw new Error("Email address is not set");
    }
    const whitelabel = this.whiteLabel;
    const variables = {
      otp: otp,
      userName: this.name || "User",
      expiryTime: "10 minutes",
    };
    const defaultTemplateData = {
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #333;">Verification OTP</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hello %userName%,</p>
            <p>Your verification OTP is: <strong style="font-size: 18px; color: #007bff;">%otp%</strong></p>
            <p>This OTP will expire in %expiryTime%.</p>
            <p>If you did not request this OTP, please ignore this email or contact support.</p>
          </div>
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      `,
      from: "Security Team",
    };
    const response = await sendCustomEmail(
      whitelabel,
      "OTP_VERIFICATION",
      emailAddress,
      variables,
      "no-reply",
      defaultTemplateData
    );
    // console.log(response);
    if (response) {
      return {
        status: true,
        message: "OTP sent successfully",
      };
    }
    throw new Error("OTP NOT SENT!");
  } catch (error) {
    console.error("Error sending Email OTP:", error);
    return false;
  }
};

clientSchema.methods.generateAndSendOTP = async function () {
  try {
    const otp = this.constructor.generateOTP();
    const encryptedOTP = encrypt(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    this.TwoFactorCompletion.otpSecret = encryptedOTP;
    this.TwoFactorCompletion.otpExpiresAt = otpExpiresAt;
    await this.save();
    return await this.sendEmailOTP(this.email);
  } catch (error) {
    console.error("Error generating and sending OTP:", error);
    throw error;
  }
};

clientSchema.methods.validateOTP = function (inputOTP) {
  if (!this.TwoFactorCompletion.otpSecret) return false;
  const currentTime = new Date();
  if (currentTime > this.TwoFactorCompletion.otpExpiresAt) {
    return false;
  }
  return inputOTP === decrypt(this.TwoFactorCompletion.otpSecret);
};

export default mongoose.model("clientProfile", clientSchema);
