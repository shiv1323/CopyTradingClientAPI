import mongoose from "mongoose";
import { getUTCTime } from "../../utils/commonUtils.js";
import { v4 as uuidv4 } from "uuid";

export const VerificationStatus = Object.freeze({
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
});

export const PAYMENT_STATUS = Object.freeze({
  DEPOSITE: "DEPOSIT",
  WITHDRAWL: "WITHDRAWAL",
  INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
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

const TRANSACTION_STATUSES = Object.freeze({
  INITIATED: "INITIATED",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
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
    transactionId: {
      type: String,
      // default: uuidv4,
      required: true,
    },
    parentTransactionId: {
      type: String,
      default: null,
    },
    externalReferenceId: {
      type: String,
      default: null,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
      required: true,
      index: true,
    },
    accountType: {
      type: String,
      enum: Object.values(ACCOUNT_TYPE),
      default: null,
    },
    fromAccount: {
      type: {
        type: String,
        required: true,
      },
      id: {
        type: String, 
        required: true,
      },
    },
    toAccount: {
      type: {
        type: String, 
        required: true,
      },
      id: {
        type: String, 
        required: true,
      },
    },
    externalDestination: {
      type: String, 
      default: null,
      maxlength: 100,
    },
    transactionHash:{
      type: String,
      default: null,
    },
    previousBal: {
      type: Number,
      required: false,
      // min: [0.0, "Amount must be greater than zero"],
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currentBal: {
      type: Number,
      required: false,
      default: null,
    },
    transactionType: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    review: {
      type: String,
      maxlength: 500,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUSES),
      default: TRANSACTION_STATUSES.INITIATED,
    },
    initiatedAt: {
      type: Date,
      default: getUTCTime,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "clientLedger",
    timestamps: true,
    versionKey: false,
  }
);
transactionSchema.pre("save", function (next) {
  //   if (!this.destinationAccountId && !this.externalDestination) {
  //     return next(
  //       new Error('Either destinationAccountId or externalDestination must be provided.')
  //     );
  //   }

  //   if (this.destinationAccountId && this.externalDestination) {
  //     return next(
  //       new Error('Only one of destinationAccountId or externalDestination can be provided.')
  //     );
  //   }
  // if (!this.transactionId) {
  //   this.transactionId = crypto.randomBytes(8).toString("hex").toUpperCase();
  // }
  next();
});

const Transaction = mongoose.model("clientLedger", transactionSchema);

export default Transaction;
