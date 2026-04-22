import mongoose from 'mongoose';
import { getUTCTime } from '../utils/commonUtils.js';
import { CT_FOLLOW_REQUEST_STATUS_ENUM, TRADING_CONDITION_ENUM } from '../utils/constant.js';

const { Schema, model, Types } = mongoose;

const CTFollowRequestSchema = new Schema(
  {
    whiteLabel: {
      type: Types.ObjectId,
      ref: 'whiteLabel',
      required: true,
    },
    followerAccount: {
      type: Types.ObjectId,
      required: true,
      ref: 'clientProfile',
    },
    masterAccount: {
      type: Types.ObjectId,
      required: true,
      ref: 'clientProfile',
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
      enum: CT_FOLLOW_REQUEST_STATUS_ENUM,
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
      enum: TRADING_CONDITION_ENUM,
      required: true,
    },
    ratio: {
      type: String,
      default: '100',
    },
    remark: {
      type: String,
      default: null,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  { collection: 'ctFollowRequests' }
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

export default model('ctFollowRequests', CTFollowRequestSchema);
