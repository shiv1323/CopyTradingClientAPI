import mongoose from "mongoose";

const { Schema } = mongoose;

const clientTradingAccountSchema = new Schema(
  {
    ClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    WhiteLabel : {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WhiteLabel",
      required: true,
    },
    Login: { type: String, default: null },
    Group: { type: String, default: null },
    Password: {type: String, default: null},
    CertSerialNumber: { type: String, default: null },
    Rights: { type: String, default: null },
    Registration: { type: String, default: null },
    LastAccess: { type: String, default: null },
    LastIP: { type: String, default: null },
    LastPassChange: { type: String, default: null },
    Name: { type: String, default: null },
    FirstName: { type: String, default: null },
    LastName: { type: String, default: null },
    MiddleName: { type: String, default: null },
    Company: { type: String, default: null },
    Account: { type: String, default: null },
    Country: { type: String, default: null },
    Language: { type: String, default: null },
    City: { type: String, default: null },
    State: { type: String, default: null },
    ZIPCode: { type: String, default: null },
    Address: { type: String, default: null },
    Phone: { type: String, default: null },
    Email: { type: String, default: null },
    ID: { type: String, default: null },
    Status: { type: String, default: null },
    Comment: { type: String, default: null },
    Color: { type: String, default: null },
    PhonePassword: { type: String, default: null },
    Leverage: { type: String, default: null },
    Agent: { type: String, default: null },
    Balance: { type: String, default: null },
    Credit: { type: String, default: null },
    InterestRate: { type: String, default: null },
    CommissionDaily: { type: String, default: null },
    CommissionMonthly: { type: String, default: null },
    CommissionAgentDaily: { type: String, default: null },
    CommissionAgentMonthly: { type: String, default: null },
    BalancePrevDay: { type: String, default: null },
    BalancePrevMonth: { type: String, default: null },
    EquityPrevDay: { type: String, default: null },
    EquityPrevMonth: { type: String, default: null },
    MQID: { type: String, default: null },
    TradeAccounts: { type: String, default: null },
    Currency: {type: String, default: "USD"},
    ApiData: [
      {
        AppID: { type: Number, default: null },
        ID: { type: Number, default: null },
        ValueInt: { type: Number, default: null },
        ValueUInt: { type: Number, default: null },
        ValueDouble: { type: Number, default: null },
      },
    ],
    LeadCampaign: { type: String, default: null },
    LeadSource: { type: String, default: null },
    LimitOrders: { type: Number, default: null },
    LimitPositions: { type: Number, default: null },

    // Trade account specific fields
    CurrencyDigits: { type: Number, default: null },
    Margin: { type: Number, default: null },
    MarginFree: { type: Number, default: null },
    MarginLevel: { type: Number, default: null },
    MarginLeverage: { type: Number, default: null },
    MarginInitial: { type: Number, default: null },
    MarginMaintenance: { type: Number, default: null },
    Profit: { type: Number, default: null },
    Storage: { type: Number, default: null },
    Floating: { type: Number, default: null },
    Equity: { type: Number, default: null },
    SOActivation: { type: Number, default: null },
    SOTime: { type: Number, default: null },
    SOLevel: { type: Number, default: null },
    SOEquity: { type: Number, default: null },
    SOMargin: { type: Number, default: null },
    BlockedCommission: { type: Number, default: null },
    BlockedProfit: { type: Number, default: null },
    Assets: { type: Number, default: null },
    Liabilities: { type: Number, default: null },
    AccountType : {type : String , default : "DEMO"},
    IsBinded : {type : Boolean , default : false},
    IsMasterAccount: { type: Boolean, default: false },
    BecomeMasterOn: { type: Date, default: null },
    IsFollowerAccount: { type: Boolean, default: false },
    ManagerId : {
      type: mongoose.Schema.Types.ObjectId,
      ref : "WhiteLabel"
    },
    ManagerType : {
      type : String,
      default:"real"
    },
    ServerName : {
      type : String,
      default:""
    }
  },
  {
    timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
    collection: "ClientTradingAccounts",
  }
);

clientTradingAccountSchema.index({ Login: -1 });

const TradeAccount = mongoose.model(
  "ClientTradingAccount",
  clientTradingAccountSchema
);

export default TradeAccount;
