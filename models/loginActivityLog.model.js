import mongoose, { Schema } from 'mongoose';
import { getUTCTime } from "../utils/commonUtils.js";


const POSSIBLE_STATUSES = {
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  LOGOUT: "LOGOUT",
  EXPIRED: "EXPIRED",
  BLOCKED: "BLOCKED",
  IN_PROGRESS: "IN_PROGRESS"
};

export const AUTHENTICATION_METHODS = {
  PASSWORD: "PASSWORD",
  SSO: "SSO",
  OAUTH: "OAUTH",
  TWO_FA: "2FA",
  TWO_FA:"TWO_FA"
};

const deviceSchema = new Schema(
  {
    type: { type: String,default:'DESKTOP' },
    browser: { type: String, default: null },
    browserVersion: { type: String,default: null },
    isMobile: { type: Boolean, default: false },
    deviceId : {type : String,default : null}
  },
  { _id: false }
);

const locationSchema = new Schema(
  {
    country: { type: String,default: null },
    city: { type: String,default: null },
    region: { type: String,default: null },
    postalCode: { type: String,default: null },
    latitude: { type: Number,default: null },
    longitude: { type: Number,default: null },
    timezone: { type: String,default: null },
  },
  { _id: false }
);

const loginActivitySchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "clientProfile",                                                              
      required: false,
      // index: true,
    },
    // WhiteLabel:{
    //   type: Schema.Types.ObjectId,
    //   ref: "WhiteLabel",                                                              
    //   required: false,
    // },
    clientType : {
      type : String,
      default : "WEB",
      enum : ["WEB","MOBILE"],
      index: true,
    },
    loginTimestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    logoutTimestamp: {
      type: Date,
      default: null,
    },
    sessionDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    deviceDetails: {
      type: deviceSchema,
      default: {},
    },
    location: {
      type: locationSchema,
      default: {},
    },
    status: {
      type: String,
      enum: Object.values(POSSIBLE_STATUSES),
      default: POSSIBLE_STATUSES.SUCCESS,
    },
    failureReason: {
      type: String,
      default: null,
    },
    failureCode: {
      type: Number,
      default: null,
    },
    authenticationMethod: {
      type: String,
      enum: Object.values(AUTHENTICATION_METHODS),
      default: AUTHENTICATION_METHODS.SSO,
    },
    securityFlags: {
      isVpnDetected: { type: Boolean, default: false },
      isSuspiciousActivity: { type: Boolean, default: false },
      riskScore: { type: Number, min: 0, max: 100, default: 0 },
    },
    createdAt: {
      type: Date,
      default: getUTCTime
    }
  },
  {
    collection: "clientLoginActivities",
  }
);
loginActivitySchema.statics.POSSIBLE_STATUSES = POSSIBLE_STATUSES;
loginActivitySchema.statics.AUTHENTICATION_METHODS = AUTHENTICATION_METHODS;
loginActivitySchema.methods.calculateSessionDuration = function () {
  if (this.logoutTimestamp && this.loginTimestamp) {
    this.sessionDuration = Math.floor(
      (this.logoutTimestamp - this.loginTimestamp) / 1000
    );
  }
  return this.sessionDuration;
};

loginActivitySchema.statics.getActiveSessionsCount = function () {
  return this.countDocuments({
    logoutTimestamp: null,
    status: this.POSSIBLE_STATUSES.SUCCESS,
  });
};

loginActivitySchema.virtual("isActive").get(function () {
  return (
    !this.logoutTimestamp &&
    this.status === loginActivitySchema.statics.POSSIBLE_STATUSES.SUCCESS
  );
});

loginActivitySchema.pre("save", async function (next) {
  if (this.isModified("logoutTimestamp")) {
    this.calculateSessionDuration();
  }
  next();
});

export default mongoose.model("loginActivity", loginActivitySchema);
