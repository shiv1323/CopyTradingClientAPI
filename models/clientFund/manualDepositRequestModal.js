import mongoose from "mongoose";
import { getUTCTime } from "../utils/commonUtils.js";

const RequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
      required: true,
    },
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },
    type: {
      type: String,
      enum: ["BankAccount", "UPIAccount", "CASH"],
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "type",
      required: function () {
        return this.type !== "CASH";
      },
    },
    transactionId: {
      type: String,
      required: true,
    },
    utrNumber: {
      type: String,
      default: null,
    },
    fileDetails: {
      file: {
        originalName: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: () => getUTCTime(),
        },
        s3Path: {
          type: String,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        s3Tag: {
          type: String,
          required: true,
        },
      },
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },
    remarks: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "manualDepositRequests",
  }
);

const ManualDepositRequest = mongoose.model(
  "manualDepositRequests",
  RequestSchema
);

export default ManualDepositRequest;
