import mongoose from "mongoose";
import { getUTCTime } from "../utils/commonUtils.js";
 
const { Schema, model, Types } = mongoose;
 
const CTFollowRequestSchema = new Schema(
  {
    whiteLabel: {
      type: Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },
    followerAccount: {
      type: Types.ObjectId,
      required: true,
      ref: "clientProfile",
    },
    groupId:{
      type: Types.ObjectId,
      ref: 'forexGroups',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {type: String, default: null},
    leverage: { type: String, default: null },
    currency: { type: String, default: "USD" },
    masterAccount: {
      type: Types.ObjectId,
      required: true,
      ref: "clientProfile",
    },
    followerTradingMId: {
      type: String,
      required: true,
    },
    masterTradingMId: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
      enum: [0, 1, 2, 3, 4, 5], // 0: PENDING, 1: Approved by Master, 2: Approved by Admin, 3:Rejected By Master, 4: Rejected By Admin, 5: Invalidated Request
      default: 0,
    },
    requestedAt: {
      type: Date,
      default: getUTCTime(),
    },
    masterActionAt: {
      type: Date,
      default: null,
    },
    adminActionAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    tradingCondition: {
      type: String,
      enum: ["EQUITY", "BALANCE", "FIXED", "VOLUME_PERCENT"],
      required: true,
    },
    ratio: {
      type: String,
      default: "100",
    },
    remark: {
      type: String,
      default: null,
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  { collection: "ctFollowRequests" }
);
CTFollowRequestSchema.index(
  {
    followerAccount: 1,
    masterAccount: 1,
    followerTradingMId: 1,
    masterTradingMId: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [0, 1, 2] },
    },
  }
);
 
export default model("ctFollowRequests", CTFollowRequestSchema);