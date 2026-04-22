import mongoose from 'mongoose';
import { COPY_MODE_ENUM, COPY_REASON_ENUM } from '../utils/constant.js';

const RuleSchema = new mongoose.Schema({
  symbols: {
    type: [String],
    default: [],
  },
  inverseCopy: {
    type: Boolean,
    default: false,
  },
  copyReason: {
    type: [String],
    default: [],
    enum: COPY_REASON_ENUM,
  },
  minVolume: {
    type: Number,
    default: null,
  },
  maxSlippage: {
    type: Number,
    default: null,
  },
  maxDelay: {
    type: Number,
    default: null,
  },
  minEquityPercent: {
    type: Number,
    default: null,
  },
  fixedVolume: {
    type: Number,
    default: null,
  },
  symbolInverse: {
    type: [String],
    default: [],
  },
  commentsMatch: {
    type: [String],
    default: [],
  },
  volumeRule: {
    mode: {
      type: String,
      enum: COPY_MODE_ENUM,
      default: null,
    },
    value: {
      type: Number,
      default: null,
    },
  },
  stopLossRule: {
    type: Number,
    default: null,
  },
  takeProfitRule: {
    type: Number,
    default: null,
  },
});

const FollowerSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clientProfile',
  },
  loginId: {
    type: String,
    required: true,
  },
  multiplier: {
    type: Number,
    default: null,
  },
  rules: {
    type: RuleSchema,
    default: () => ({}),
  },
  status: {
    type: Boolean,
    default: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
});

const MasterSchema = new mongoose.Schema(
  {
    // _id: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: true,
    // },
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'whiteLabel',
    },
    masterAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'clientProfile',
    },
    loginId: {
      type: String,
      required: true,
    },
    followers: {
      type: [FollowerSchema],
      default: [],
    },
    masterSL: {
      type: Number,
      default: null,
    },
    masterTP: {
      type: Number,
      default: null,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  { collection: 'ctMaster' }
);

export default mongoose.model('ctMaster', MasterSchema);
