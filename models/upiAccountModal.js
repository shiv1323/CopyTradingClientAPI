import mongoose from "mongoose";

const upiAccountSchema = new mongoose.Schema(
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
  },
  { timestamps: true, collection: "UpiAccount" }
);

export const UpiAccount = mongoose.model("UpiAccount", upiAccountSchema);
