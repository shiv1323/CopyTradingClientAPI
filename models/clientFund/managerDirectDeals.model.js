import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';
const { Schema, model } = mongoose;

const apiDataSchema = new Schema(
  {
    Key: { type: String },
    Value: { type: String },
  },
  { _id: false }
);

const managerDirectDealsSchema = new Schema(
  {
    operation: { type: String, default: null },
    transactionId: { type: String, default: uuidv4 },
    whiteLabel: { type: Schema.Types.ObjectId, required: true },
    clientId: { type: Schema.Types.ObjectId, required: true },
    deal: { type: String, unique: true },
    externalId: { type: String },
    login: { type: String },
    dealer: { type: String },
    order: { type: String },
    action: { type: String },
    entry: { type: String },
    reason: { type: String },
    isInternalTransfer: { type: Boolean, default: false },
    digits: { type: String },
    digitsCurrency: { type: String },
    contractSize: { type: String },
    time: { type: String },
    timeMsc: { type: String },
    symbol: { type: String },
    price: { type: String },
    volume: { type: String },
    volumeExt: { type: String },
    profit: { type: String },
    storage: { type: String },
    commission: { type: String },
    fee: { type: String },
    rateProfit: { type: String },
    rateMargin: { type: String },
    expertId: { type: String },
    positionId: { type: String },
    comment: { type: String },
    profitRaw: { type: String },
    pricePosition: { type: String },
    priceSl: { type: String },
    priceTp: { type: String },
    volumeClosed: { type: String },
    volumeClosedExt: { type: String },
    tickValue: { type: String },
    tickSize: { type: String },
    flags: { type: String },
    gateway: { type: String },
    priceGateway: { type: String },
    modifyFlags: { type: String },
    value: { type: String },
    apiData: [apiDataSchema],
    marketBid: { type: String },
    marketAsk: { type: String },
    marketLast: { type: String },
    picked: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "managerDirectDeals" }
);

const ManagerDirectDeals = model(
  "managerDirectDeals",
  managerDirectDealsSchema
);

export default ManagerDirectDeals;
