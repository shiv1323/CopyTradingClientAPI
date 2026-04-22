import mongoose from "mongoose";

const identifierSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "IFSC", // India
        "MICR", // India
        "ROUTING", // USA
        "IBAN", // EU, UAE, etc.
        "SWIFT", // Global
        "SORTCODE", // UK
        "BSB", // Australia
        "CLABE", // Mexico
        "TRANSIT", // Canada
        "CNAPS", // China
        "BRSTN", // Philippines
      ],
      required: true,
    },
    value: { type: String, required: true },
  },
  { _id: false }
);

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: Number,
      required: true,
    },
    bankIdentifier: {
      type: [identifierSchema],
      default: [],
    },
  },
  { _id: false }
);

const upiAccountSchema = new mongoose.Schema(
  {
    upiId: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const cashDataSchema = new mongoose.Schema(
  {
    receiverName: {
      type: String,
      required: true,
    }
  },
  { _id: false }
);

const CRYPTO_CURRENCIES = Object.freeze({
  BTC: "BTC",
  ETH: "ETH",
  USDT: "USDT",
  XRP: "XRP",
  BNB: "BNB",
  LTC: "LTC",
  TRX: "TRX",
  MATIC: "MATIC",
  NA: "N/A",
});

const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

const WithdrawRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      default: null,
    },
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    cryptoCurrency: {
      type: String,
      // required: true,
      enum: Object.values(CRYPTO_CURRENCIES),
    },
    walletAddress: {
      type: String,
      // required: true,
    },
    bankAccount: {
      type: [bankAccountSchema],
      default: [],
      required: function () {
        return this.paymentMethod === "BankAccount";
      },
    },
    upiAccount: {
      type: [upiAccountSchema],
      default: [],
      required: function () {
        return this.paymentMethod === "UpiAccount";
      },
    },
    cashTransactionData: {
      type: [cashDataSchema],
      default: [],
      required: function () {
        return this.paymentMethod === "Cash";
      },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: "PENDING",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      //   ref: "Admin",
      default: null,
    },
    approvalTimestamp: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { collection: "withdrawlRequests", timestamps: true }
);

const WithdrawRequest = mongoose.model(
  "withdrawlRequest",
  WithdrawRequestSchema
);
export default WithdrawRequest;
