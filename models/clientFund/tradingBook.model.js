import mongoose from "mongoose";
import { getUTCTime } from "../../utils/commonUtils";

const tradeSchema = new mongoose.Schema(
  {
    tradingAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
    },
    market: { type: String, required: true },
    lots: { type: Number, required: true },
    tradeType: { type: String, enum: ["Buy", "Sell"], required: true },
    tradeAmount: { type: Number, required: true },
    profitLoss: { type: Number, default: 0 },
    tradeTime: { type: Date, default: Date.now },
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
    createdAt: { type: Date, default: getUTCTime },
  },
  { collection: "TradingBook" }
);

export const Trade = mongoose.model("TradingBook", tradeSchema);
