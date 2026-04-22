import moment from "moment";
import mongoose from "mongoose";
const TRANSACTION_STATUSES = Object.freeze({
  INITIATED: "INITIATED",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
});
const TRANSACTION_TYPES = Object.freeze({
  DEPOSIT: "DEPOSIT",
  WITHDRAWAL: "WITHDRAWAL",
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
  TRANSFER: "TRANSFER",
  BONUS: "BONUS",
  CORRECTION: "CORRECTION",
  REVERSAL: "REVERSAL",
});

const ACCOUNT_TYPE = Object.freeze({
  WALLET: "WALLET",
  TRADING_ACCOUNT: "TRADING",
});

const transactionSchema = new mongoose.Schema(
  {
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
      required: true,
      index: true,
    },
    userAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
    },
    applicationId: {
      type: String,
      required: true,
    },
    networkId: {
      type: String,
      required: false,
    },
    cryptoAmount: {
      type: String,
      required: true,
    },
    transfer_reference_id: {
      type: String,
      default: null,
    },
    blockchain: {
      type: String,
      default: null,
    },
    walletAddress: {
      type: String,
      default: null,
    },
    tokenAddress: {
      type: String,
      default: null,
    },
    transactionHash: {
      type: String,
      default: null,
    },
    transactionType: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    toAccount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUSES),
      default: TRANSACTION_STATUSES.INITIATED,
    },
    initiatedAt: {
      type: Date,
      default: moment.utc().format(),
      required: true,
    },
    completedAt: {
      type: Date,
      default: moment.utc().format(),
      default: null,
    },
  },
  {
    collection: "paymentGatewayRecords",
    timestamps: true,
    versionKey: false,
  }
);

const paymentGateway = mongoose.model(
  "paymentGatewayRecords",
  transactionSchema
);

export default paymentGateway;
