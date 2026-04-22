import mongoose from "mongoose";
const { Schema, model } = mongoose;

const withdrawalCurrency = new Schema(
  {
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "whiteLabel",
    },
    type: {
      type: String,
      enum: ["CRYPTO", "NON_CRYPTO"],
      required: true
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "",
    },
    minWithdrawalLimit: { type: Number, required: true, default: 100 },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "withdrawalCurrency",
  }
);

export default mongoose.model("withdrawalCurrency", withdrawalCurrency);
