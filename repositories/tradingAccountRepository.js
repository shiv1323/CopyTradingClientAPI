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
      .populate({ path: "whiteLabel", select: "configDetails" })
      .lean();
  }
  async getTradingAccountByFieldWithCT(id) {
    return await TradingAccountModel.aggregate([
      {
        $match: {
          clientId: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "ctMasterRequest",
          let: {
            login: "$login",
            wl: "$whiteLabel",
            client: "$clientId",
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
          from: "whiteLabel",
          localField: "whiteLabel",
          foreignField: "_id",
          as: "whiteLabel",
        },
      },
      {
        $unwind: {
          path: "$whiteLabel",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          login: 1,
          name: 1,
          leverage: 1,
          balance: 1,
          currency: 1,
          status: 1,
          equity: 1,
          credit: 1,
          marginFree: 1,
          group: 1,
          managerType: 1,
          serverName: 1,
          registration: 1,
          isMasterAccount: 1,
          accountType: 1,
          whiteLabel: {
            configDetails: "$whiteLabel.configDetails",
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
      groupId: 1,
    }).lean();
  }
  async getOneFollowerTradingAccountByField(query) {
    return await TradingAccountModel.findOne(query, {
      _id: 1,
      groupId: 1,
    }).lean();
  }

  async fetchTradingAccountFund(query) {
    return await TradingAccountModel.find(query)
      .select({ equity: 1, balance: 1 })
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
      { login: taccountId },
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
      { login: loginId },
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
      whiteLabel: whiteLabel,
      managerType: "real",
    }).select("_id clientId login group accountType whiteLabel");
  }
  async getTradingAccountByClientId(whiteLabel, clientId) {
    return await TradingAccountModel.find({
      whiteLabel: whiteLabel,
      accountType: "REAL",
      managerType: "real",
      clientId: clientId,
    })
      .select(
        "_id clientId login group accountType balance equity credit marginFree"
      )
      .lean();
  }

  async updateTradingAccountMasterEligible(query, value) {
    return await TradingAccountModel.updateOne(query, {
      isMasterAccount: value,
    });
  }
  async updateTradingAccountOnBecomeFollower(query, value) {
    return await TradingAccountModel.updateOne(query, {
      isFollowerAccount: value,
    });
  }

  async getTradingAccountsOfMaster(whiteLabel, masterId) {
    return await TradingAccountModel.find({
      whiteLabel: whiteLabel,
      clientId: masterId,
      isMasterAccount: true,
    }).select("login name clientId");
  }

  async getTradingAccountsOfEligibleFollowers(whiteLabel, clietId) {
    return await TradingAccountModel.find({
      whiteLabel: whiteLabel,
      clientId: clietId,
      isMasterAccount: false,
      isFollowerAccount: false,
      managerType: "real",
      accountType: "REAL",
    }).select("login name clientId");
  }

  async updateMasterTradingAccount(whiteLabel, clietId, loginId, value) {
    return await TradingAccountModel.updateOne(
      {
        whiteLabel: whiteLabel,
        clientId: clietId,
        login: loginId,
      },
      { isMasterAccount: value }
    );
  }
  async getGroupsFromTrAccount(query, field) {
    return await TradingAccountModel.find(query).select(field)
    .populate({
        path: "groupId",
        select: "groupName group managerType description linkedGroupIds",
        populate:{
          path: "linkedGroupIds",
          select: "groupName group managerType description"
        }
      })
      .lean();
  }
}

export default new TradingAccountRepository();
