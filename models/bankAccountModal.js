import mongoose from "mongoose";

const bankAccountSchemaDeposit = new mongoose.Schema(
  {
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WhiteLabel",
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
    limit: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, collection: "BankAccount" }
);

export const BankAccountDeposit = mongoose.model("BankAccountDeposit", bankAccountSchemaDeposit);
