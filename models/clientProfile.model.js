import mongoose from "mongoose";
import {
  getUTCTime,
} from "../utils/commonUtils.js";

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
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null,
      },
    },
  { collection: "clientProfile" }
);

export default mongoose.model("clientProfile", clientSchema);
