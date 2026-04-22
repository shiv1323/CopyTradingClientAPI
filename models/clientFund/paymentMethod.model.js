import mongoose from "mongoose";
import { getUTCTime } from "../../utils/commonUtils.js";

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Deposit", "Withdrawal"],
      required: true
    },
    status: {
      type: Boolean,
      default: true
    },
    configuration: {
      processTime: {
        type: String,
        default: null,
      },
      fee: {
        type: String,
        default: null,
      },
      limit: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        default: null,
      },
      applicationId: {
        type: String,
        default: null,
      },
      baseUrl: {
        type: String,
        default: null,
      },
      appSecret: {
        type: String,
        default: null,
      },
        maxCashLimit: {
        type: Number,
      },
      paymentTypes: {
        type: [
          {
            type: String,
            enum: ["BANK_TRANSFER", "UPI_TRANSFER", "CASH"],
            required: true,
          },
        ],
        default: [],
      },
    },
    createdAt: {
      type: Date,
      default: getUTCTime(),
    },
    updatedAt: {
      type: Date,
      //default: getUTCTime(),
    },
  },
  { collection: "paymentMethods" }
);

const PaymentMethod = mongoose.model("paymentMethods", paymentMethodSchema);

export default PaymentMethod;
