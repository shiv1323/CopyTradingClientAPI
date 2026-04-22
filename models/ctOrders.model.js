import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const CtOrderSchema = new Schema(
  {
    masterLogin: {
      type: String,
      required: true,
      trim: true,
    },
    whiteLabel: {
      type: Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },
    followerLogin: {
      type: String,
      required: true,
      trim: true,
    },
    positionId: {
      type: Number,
      required: true,
    },
    masterPosId: {
      type: Number,
      required: true,
    },
    orderType: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
    collection: "ctOrders",
  }
);


// CtOrderSchema.index({ followerLogin: 1, positionId: 1 }, { unique: true });

const CtOrders = model("ctOrders", CtOrderSchema);

export default CtOrders;