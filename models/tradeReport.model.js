import mongoose from "mongoose";

const { Schema, model } = mongoose;

const TradeReportSchema = new Schema(
  {
    clientId:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
    },
    accountId: {
      type: String,
      required: true,
    },
    whiteLabel: {
      type: Schema.Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },
    order: {
      type: String,
      required: true,
    //   index: { unique: true },
    },
    symbol: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    volume: {
      type: Number,
      required: true,
    },
    openPrice: {
      type: Number,
      required: true,
    },
    closePrice: {
      type: Number,
      required: true,
    },
    profit: {
      type: Number,
      required: true,
    },
    positionID: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      enum: ["CLOSED"],
      default: "CLOSED",
    },
    openingTime: {
      type: Date,
      required: true,
    },
    closingTime: {
      type: Date,
      required: true,
    },
    swap : {
      type: Number,
    },
    commission : {
      type: Number,
    },
    comment: {
      type: String,
      default: "No Comment",
    },
    managerId : {
      type: mongoose.Schema.Types.ObjectId,
      ref : "whiteLabel"
    },
    managerType : {
      type : String,
      default:"real"
    },
    accountType : {
      type : String
    },
    commissionAdded : {
      type : Boolean,
      default : false
    },
    fullyClosed : {
      type : Boolean,
      default : true
    }
  },
  {
    collection: "allOrderReport",
    timestamps : true
  }
);
 
TradeReportSchema.index({ accountId:1,positionID:1,order:1 }, { unique: true });

// TradeReportSchema.index({ PositionID: 1, Order: 1 }, { unique: true });

const OrderTradeReport = model("allOrderReport", TradeReportSchema);

export default OrderTradeReport;
