import mongoose from "mongoose";
import { getUTCTime } from "../../utils/commonUtils.js";
import {
  ACCOUNT_TYPE,
  PAYMENT_STATUS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  VerificationStatus, 
} from "../../utils/constant.js";


const transactionSchema = new mongoose.Schema(
  {
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
    },
    transactionId: {
      type: String,
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
    transactionHash: {
      type: String,
      default: null,
    },
    previousBal: {
      type: Number,
      required: false,
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

const Transaction = mongoose.model("clientLedger", transactionSchema);

export default Transaction;
