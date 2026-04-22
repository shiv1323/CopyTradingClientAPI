import mongoose from "mongoose";
const { Schema } = mongoose;

const currencyListSchema = new Schema(
  {
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "whiteLabel",
    },
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "paymentMethods",
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["DEPOSIT","WITHDRAWAL"],
      required: true
    },
    currency: {
      type: String,
      default: "",
    },
    minLimit: { type: Number, default: 100 },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "currencyList",
  }
);

export default mongoose.model("currencyList", currencyListSchema);