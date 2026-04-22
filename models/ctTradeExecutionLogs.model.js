import mongoose from 'mongoose';
import {
  TRADE_EXEC_FINAL_STATUS_ENUM,
  TRADE_EXEC_STAGE_STATUS_ENUM,
  TRADE_EXEC_TYPE_ENUM,
} from '../utils/constant.js';

const StageLogSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    status: {
      type: String,
      enum: TRADE_EXEC_STAGE_STATUS_ENUM,
      required: true,
    },
    details: { type: mongoose.Schema.Types.Mixed },
    inputs: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TradeExecutionLogSchema = new mongoose.Schema(
  {
    whiteLabel: { type: mongoose.Schema.Types.ObjectId, ref: 'whiteLabel' },
    masterClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'clientProfile' },
    subscriberClientId: { type: mongoose.Schema.Types.ObjectId, ref: 'clientProfile' },
    recordId: { type: String, default: null },
    transactionId: { type: String, required: true, unique: true },
    master: { type: String, index: true },
    subscriber: { type: String, index: true },
    SYMBOL: { type: String, required: true },
    type: {
      type: String,
      enum: TRADE_EXEC_TYPE_ENUM,
      required: true,
    },
    stages: [StageLogSchema],
    finalStatus: {
      type: String,
      enum: TRADE_EXEC_FINAL_STATUS_ENUM,
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    rawTrade: { type: mongoose.Schema.Types.Mixed },
    rawTicker: { type: mongoose.Schema.Types.Mixed },
    extra: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: 'ctTradeExecutionLogs', timestamps: true }
);

TradeExecutionLogSchema.index({ subscriberClientId: 1 });
TradeExecutionLogSchema.index({ transactionId: 1 }, { unique: true });
TradeExecutionLogSchema.index({ finalStatus: 1 });
TradeExecutionLogSchema.index({ symbol: 1 });
TradeExecutionLogSchema.index({ subscriberClientId: 1, masterClientId: 1 });
TradeExecutionLogSchema.index({ startedAt: 1, completedAt: 1 });
TradeExecutionLogSchema.index({
  'stages.details': 'text',
  details: 'text',
  transactionId: 'text',
});

export default mongoose.model('ctTradeExecutionLogs', TradeExecutionLogSchema);
