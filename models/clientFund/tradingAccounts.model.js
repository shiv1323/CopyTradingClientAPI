import mongoose from "mongoose";
import { getUTCTime } from "../../utils/commonUtils.js";

const { Schema } = mongoose;

// Client trading account schema
const clientTradingAccountSchema = new Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
      required: true,
    },
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "forexGroups",
      required: true,
    },
    login: { type: String, default: null },
    group: { type: String, default: null },
    password: { type: String, default: null },
    investorPassword: { type: String, default: null },
    certSerialNumber: { type: String, default: null },
    rights: { type: String, default: null },
    registration: { type: String, default: null },
    lastAccess: { type: String, default: null },
    lastIp: { type: String, default: null },
    lastPassChange: { type: String, default: null },
    name: { type: String, default: null },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    middleName: { type: String, default: null },
    company: { type: String, default: null },
    account: { type: String, default: null },
    country: { type: String, default: null },
    language: { type: String, default: null },
    City: { type: String, default: null },
    state: { type: String, default: null },
    zipCode: { type: String, default: null },
    Address: { type: String, default: null },
    phone: { type: String, default: null },
    email: { type: String, default: null },
    id: { type: String, default: null },
    status: { type: String, default: null },
    Comment: { type: String, default: null },
    color: { type: String, default: null },
    phonePassword: { type: String, default: null },
    leverage: { type: String, default: null },
    agent: { type: String, default: null },
    balance: { type: String, default: null },
    credit: { type: String, default: null },
    interestRate: { type: String, default: null },
    commissionDaily: { type: String, default: null },
    commissionMonthly: { type: String, default: null },
    commissionAgentDaily: { type: String, default: null },
    commissionAgentMonthly: { type: String, default: null },
    balancePrevDay: { type: String, default: null },
    balancePrevMonth: { type: String, default: null },
    equityPrevDay: { type: String, default: null },
    equityPrevMonth: { type: String, default: null },
    MQID: { type: String, default: null },
    tradeAccounts: { type: String, default: null },
    currency: { type: String, default: "USD" },
    apiData: [
      {
        appId: { type: Number, default: null },
        id: { type: Number, default: null },
        valueInt: { type: Number, default: null },
        valueUInt: { type: Number, default: null },
        valueDouble: { type: Number, default: null },
      },
    ],
    leadCampaign: { type: String, default: null },
    leadSource: { type: String, default: null },
    limitOrders: { type: Number, default: null },
    limitPositions: { type: Number, default: null },

    // Trade account specific fields
    currencyDigits: { type: Number, default: null },
    margin: { type: Number, default: null },
    marginFree: { type: Number, default: null },
    marginLevel: { type: Number, default: null },
    marginLeverage: { type: Number, default: null },
    marginInitial: { type: Number, default: null },
    marginMaintenance: { type: Number, default: null },
    profit: { type: Number, default: null },
    storage: { type: Number, default: null },
    floating: { type: Number, default: null },
    equity: { type: Number, default: null },
    soActivation: { type: Number, default: null },
    sotime: { type: Number, default: null },
    soLevel: { type: Number, default: null },
    soEquity: { type: Number, default: null },
    somargin: { type: Number, default: null },
    blockedCommission: { type: Number, default: null },
    blockedProfit: { type: Number, default: null },
    assets: { type: Number, default: null },
    liabilities: { type: Number, default: null },
    accountType: { type: String, default: "DEMO" },
    isBinded: { type: Boolean, default: false },
    managerType: {
      type: String,
      default: "real",
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
    },
    createdAt: {
      type: Date,
      default: getUTCTime,
    },
    updatedAt: {
      type: Date,
      default: getUTCTime,
    },
    isMasterAccount: { type: Boolean, default: false },
    isFollowerAccount: { type: Boolean, default: false },
    becomeMasterOn: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    collection: "clientTradingAccounts",
  }
);

clientTradingAccountSchema.index({ login: -1 });

// Trading account model
const TradingAccount = mongoose.model(
  "clientTradingAccounts",
  clientTradingAccountSchema
);

export default TradingAccount;
