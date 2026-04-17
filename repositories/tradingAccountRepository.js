import mongoose from "mongoose";
import TradingAccountModel from "../models/clientFund/tradingAccounts.model.js";

class TradingAccountRepository {
  // Create a new client
  async createTradingAccount(clientData) {
    const client = new TradingAccountModel(clientData);
    return await client.save();
  }
  async getTradingAccountById(clientId) {
    return await TradingAccountModel.findById(clientId);
  }
  async getTradingAccountByField(query) {
    // const fields = field.join(" ");
    return await TradingAccountModel.find(query).lean();
  }

  async getTradingAccountByFieldWithCTMaster(query) {
    return await TradingAccountModel.find(query)
      .populate({ path: "WhiteLabel", select: "configDetails" })
      .lean();
  }
  async getTradingAccountByFieldWithCT(id) {
    return await TradingAccountModel.aggregate([
      {
        $match: {
          ClientId: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "CTMasterRequest",
          let: {
            login: "$Login",
            wl: "$WhiteLabel",
            client: "$ClientId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$masterLogin", "$$login"] },
                    { $eq: ["$whiteLabel", "$$wl"] },
                    { $eq: ["$masterId", "$$client"] },
                  ],
                },
              },
            },
            { $sort: { requestedAt: -1 } },
            { $limit: 1 },
          ],
          as: "requestStatus",
        },
      },
      {
        $unwind: {
          path: "$requestStatus",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "WhiteLabel",
          localField: "WhiteLabel",
          foreignField: "_id",
          as: "WhiteLabel",
        },
      },
      {
        $unwind: {
          path: "$WhiteLabel",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          Login: 1,
          Name: 1,
          Leverage: 1,
          Balance: 1,
          Currency: 1,
          Status: 1,
          Equity: 1,
          Credit: 1,
          MarginFree: 1,
          Registration: 1,
          Group: 1,
          ManagerType: 1,
          ServerName: 1,
          IsMasterAccount: 1,
          AccountType: 1,
          AdminId: 1,
          WhiteLabel: {
            configDetails: "$WhiteLabel.configDetails",
          },
          requestStatus: 1,
        },
      },
    ]);
  }
  async getOneTradingAccountByField(query, field = {}) {
    const fields = field.join(" ");
    return await TradingAccountModel.find(query).select(fields).lean();
  }
  async getTrAccByFilter(filter,select) {
    return await TradingAccountModel.findOne(filter).select(select).lean();
  }
  async getOneMasterTradingAccountByField(query) {
    return await TradingAccountModel.findOne(query, {
      _id: 1,
      GroupId: 1,
    }).lean();
  }
  async getOneFollowerTradingAccountByField(query) {
    return await TradingAccountModel.findOne(query, {
      _id: 1,
      GroupId: 1,
    }).lean();
  }

  async fetchTradingAccountFund(query) {
    return await TradingAccountModel.find(query)
      .select({ Equity: 1, Balance: 1 })
      .lean();
  }

  async getOneSelfTradingAccountByField(query) {
    return await TradingAccountModel.findOne(query, { limit: 1 });
  }
  async getTradingAccountByUniqueKey(key, value, field) {
    const filter = { [key]: value };
    const fields = field.join(" ");
    return await TradingAccountModel.findOne(filter).select(fields).lean();
  }
  async getAllTradingAccountsByUniqueKey(key, value, fields) {
    const filter = { [key]: value };
    const selectFields = fields.join(" ");
    return await TradingAccountModel.find(filter).select(selectFields).lean();
  }
  async getAllTradingAccount(selectFields = "") {
    return await TradingAccountModel.find({}).select(selectFields);
  }
  async findTradingAccountByField(userId, bankAccountNumber) {
    let query = {
      userId: new mongoose.Types.ObjectId(userId),
    };
    if (bankAccountNumber) {
      query.bankAccountNumber = bankAccountNumber;
    }
    // console.log(query);
    return await TradingAccountModel.find(query);
  }
  async updateTradingAccountById(clientId, updates) {
    return await TradingAccountModel.findByIdAndUpdate(clientId, updates, {
      new: true,
    });
  }
  async updateTradingAccountByLogin(LoginId, updates) {
    return await TradingAccountModel.findByIdAndUpdate(LoginId, updates, {
      new: true,
    });
  }
  async updateTradingAccountByTAccountId(taccountId, updates) {
    return await TradingAccountModel.findOneAndUpdate(
      { Login: taccountId },
      updates,
      { new: true }
    );
  }
  async deleteTradingAccountById(clientId) {
    return await TradingAccountModel.findByIdAndDelete(clientId);
  }
  async updateTradingAccountByField(fieldName, fieldValue, updateData) {
    const filter = { [fieldName]: fieldValue };
    return await TradingAccountModel.updateOne(filter, { $set: updateData });
  }
  async updateTrAccountByFields(filter, updateData) {
    return await TradingAccountModel.updateOne(filter, { $set: updateData });
  }
  async getPaginatedTradingAccount(filter, skip, limit, select = "") {
    return await TradingAccountModel.find(filter)
      .select(select)
      .skip(skip)
      .limit(limit)
      .lean();
  }
  async getClientsTradingAccountCount(filter) {
    return await TradingAccountModel.countDocuments(filter).exec();
  }
  async getFilteredAllTradingAccount(
    selectFields = "",
    sortField = "RegisteredDate",
    sortOrder = 1
  ) {
    return await TradingAccountModel.find({})
      .select(selectFields)
      .sort({ [sortField]: sortOrder });
  }
  async getTradingAccountByAccountType(accountType, selectFields = "") {
    return await TradingAccountModel.find({ accountType }).select(selectFields);
  }
  async updateAccountBalance(loginId, newBalance) {
    return await TradingAccountModel.findOneAndUpdate(
      { Login: loginId },
      { $set: { Balance: newBalance } },
      { new: true }
    );
  }
  async updateManyRecord(filter, update) {
    return await TradingAccountModel.updateMany(filter, update);
  }

  async getAccByOptions(options, selectFields) {
    return await TradingAccountModel.find(options).select(selectFields);
  }

  async countRecords(options) {
    return await TradingAccountModel.countDocuments(options);
  }

  async getAggregate(options) {
    return await TradingAccountModel.aggregate(options);
  }
  async getTradingAccUponWhiteLabel(whiteLabel) {
    return await TradingAccountModel.find({
      WhiteLabel: whiteLabel,
      ManagerType: "real",
    }).select("_id ClientId Login Group AccountType WhiteLabel");
  }
  async getTradingAccountByClientId(whiteLabel, clientId) {
    return await TradingAccountModel.find({
      WhiteLabel: whiteLabel,
      AccountType: "REAL",
      ManagerType: "real",
      ClientId: clientId,
    })
      .select(
        "_id ClientId Login Group AccountType Balance Equity Credit MarginFree"
      )
      .lean();
  }

  async updateTradingAccountMasterEligible(query, value) {
    return await TradingAccountModel.updateOne(query, {
      IsMasterAccount: value,
    });
  }
  async updateTradingAccountOnBecomeFollower(query, value) {
    return await TradingAccountModel.updateOne(query, {
      IsFollowerAccount: value,
    });
  }

  async getTradingAccountsOfMaster(whiteLabel, masterId) {
    return await TradingAccountModel.find({
      WhiteLabel: whiteLabel,
      ClientId: masterId,
      IsMasterAccount: true,
    }).select("Login Name ClientId");
  }

  async getTradingAccountsOfEligibleFollowers(whiteLabel, clietId) {
    return await TradingAccountModel.find({
      WhiteLabel: whiteLabel,
      ClientId: clietId,
      IsMasterAccount: false,
      IsFollowerAccount: false,
      ManagerType: "real",
      AccountType: "REAL",
    }).select("Login Name ClientId");
  }

  async updateMasterTradingAccount(whiteLabel, clietId, loginId, value) {
    return await TradingAccountModel.updateOne(
      {
        WhiteLabel: whiteLabel,
        ClientId: clietId,
        Login: loginId,
      },
      { IsMasterAccount: value }
    );
  }
}

export default new TradingAccountRepository();
