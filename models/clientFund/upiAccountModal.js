import mongoose from "mongoose";

const upiAccountSchema = new mongoose.Schema(
  {
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    upiId: {
      type: String,
      match: /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}$/, 
      required: true,
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
    maxLimit: { type: Number, required: true },
  },
  { timestamps: true, collection: "upiAccounts" }
);

export const UpiAccount = mongoose.model("upiAccounts", upiAccountSchema);
