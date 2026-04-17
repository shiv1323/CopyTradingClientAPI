import mongoose from 'mongoose';
import { generateUniqueNumericId, getUTCTime, sendCustomEmail } from '../utils/commonUtils.js';
export const USER_ROLES = {
  SU: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
};

// Mongoose enum helpers
export const USER_STATUS_ENUM = ['active', 'suspended'];
export const USER_ROLE_NAME_ENUM = [USER_ROLES.SU, USER_ROLES.ADMIN, USER_ROLES.MANAGER];

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Number,
      default: null,
      unique: true,
    },
    email: {
      type: String,
      required: [false],
      unique: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
      default: null,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
    },
    status: {
      type: String,
      required: true,
      enum: USER_STATUS_ENUM,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLE_NAME_ENUM),
      required: true,
      index: true,
    },
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'whiteLabel',
      default: null,
    },
    rolePermission: {
      type: String,
      default: null,
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
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: getUTCTime(),
    },
    lastUpdatedBy: {
      type: String,
      default: null,
    },
  },
  { collection: 'users' }
);
userSchema.index({ company: 1, email: 1 }, { unique: true });
userSchema.statics.generateUserName = async function () {
  return generateUniqueNumericId(this, { field: 'userId', digits: 10 });
};

//******************************MFA MEATHODS*******************************//

userSchema.statics.generateOTP = function () {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

userSchema.methods.send2FAEmailOTP = async function (email) {
  try {
    const otp = this.constructor.generateOTP();
    const encryptedOTP = encrypt(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    this.TwoFactorCompletion.otpSecret = encryptedOTP;
    this.TwoFactorCompletion.otpExpiresAt = otpExpiresAt;
    (this.TwoFactorCompletion.emailOTP = otp),
      (this.TwoFactorCompletion.emailOTPExpiresAt = otpExpiresAt),
      // (this.KYCVerification.verifiyEmail = false),
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

userSchema.methods.validateOTP = function (inputOTP) {
  if (!this.TwoFactorCompletion.otpSecret) return false;
  const currentTime = new Date();
  if (currentTime > this.TwoFactorCompletion.otpExpiresAt) {
    return false;
  }
  return inputOTP === decrypt(this.TwoFactorCompletion.otpSecret);
};

export default mongoose.model('user', userSchema);
