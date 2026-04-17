import mongoose from "mongoose";

const trAccLimitSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
      required: true,
    },
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    requestedLimit: {
      type: Number,
      required: true,
    },
    approvedMaxAccounts: {
      type: Number,
    },
    currentAccounts: {
      type: Number,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true, collection: "trAccLimit" }
);

export default mongoose.model("trAccLimit", trAccLimitSchema);
