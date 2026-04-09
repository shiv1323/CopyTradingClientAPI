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
      ref: "WhiteLabel",
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
  },
  {
    timestamps: true,
    collection: "CTOrders",
  }
);

CtOrderSchema.index({ followerLogin: 1, positionId: 1 }, { unique: true });

const CtOrders = model("CtOrders", CtOrderSchema);

export default CtOrders;
