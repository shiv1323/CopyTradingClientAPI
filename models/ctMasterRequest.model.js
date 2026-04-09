import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const CtMasterRequestSchema = new Schema(
  {
    masterLogin: {
      type: String,
      required: true,
      trim: true,
    },
    whiteLabel: {
      type: Types.ObjectId,
      ref: "WhiteLabel",
      required: true,
    },
    masterId: {
      type: Types.ObjectId,
      ref: "Client",
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELATION", "CANCELLED"],
      default: "PENDING",
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedOn: {
      type: Date,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["mark", "unmark"],
      required: true,
    },
  },
  {
    collection: "CTMasterRequest",
  }
);
CtMasterRequestSchema.index(
  { masterLogin: 1, masterId: 1, whiteLabel: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["APPROVED", "PENDING"] },
    },
  }
);

CtMasterRequestSchema.index(
  { masterLogin: 1, masterId: 1, whiteLabel: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "CANCELATION",
    },
  }
);
const CtMasterRequest = model("ctmasterRequest", CtMasterRequestSchema);

export default CtMasterRequest;
