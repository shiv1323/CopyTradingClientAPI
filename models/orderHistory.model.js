import mongoose from "mongoose";

const { Schema, model } = mongoose;

const orderSchema = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    accountId: { type: String, required: true },
    order: { type: String, required: true },
    externalID: { type: String, default: "" },
    login: { type: String, required: true },
    dealer: { type: String, required: true },
    symbol: { type: String, required: true },
    digits: { type: String, required: true },
    digitsCurrency: { type: String, required: true },
    contractSize: { type: String, required: true },
    state: { type: String, required: true },
    reason: { type: String, required: true },
    timeSetup: { type: Date, required: true },
    timeExpiration: { type: String, required: true },
    timeDone: { type: Date, required: true },
    timeSetupMsc: { type: String, required: true },
    timeDoneMsc: { type: String, required: true },
    modifyFlags: { type: String, required: true },
    type: { type: String, required: true },
    typeFill: { type: String, required: true },
    typeTime: { type: String, required: true },
    priceOrder: { type: Number, default: 0.0 }, // Parse to Float
    priceTrigger: { type: Number, default: 0.0 }, // Parse to Float
    priceCurrent: { type: Number, required: true }, // Parse to Float
    priceSL: { type: Number, default: 0.0 }, // Parse to Float
    priceTP: { type: Number, default: 0.0 }, // Parse to Float
    volumeInitial: { type: Number, required: true },
    volumeInitialExt: { type: Number, required: true },
    volumeCurrent: { type: Number, required: true },
    volumeCurrentExt: { type: Number, required: true },
    expertID: { type: String, default: "0" },
    positionID: { type: String, required: true },
    positionByID: { type: String, default: "0" },
    comment: { type: String, default: "" },
    rateMargin: { type: String, required: true },
    activationMode: { type: String, default: "ACTIVATION_NONE" },
    activationTime: { type: String, default: "0" },
    activationPrice: { type: String, default: "0.00000" },
    activationFlags: { type: String, default: "0" },
  },
  { collection: "OrderHistory", timestamps: true }
);

orderSchema.index({ deal: 1 }, { unique: true });
const Order = model("OrderHistory", orderSchema);

export default Order;
