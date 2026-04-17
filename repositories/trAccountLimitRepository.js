import clientTradingAccountLimit from "../models/clientTradingAccountLimit.modal.js";

class tradeOrderRepository {
  async getAllTrans(selectFields = "") {
    return await clientTradingAccountLimit.find({}).select(selectFields);
  }

  async getTransByOptions(
    options,
    selectFields,
    sort = {},
    skip = 0,
    limit = 0
  ) {
    return await clientTradingAccountLimit
      .find(options)
      .select(selectFields)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async countTransactions(options) {
    return await clientTradingAccountLimit.countDocuments(options);
  }

  async updateOneRecord(filter, update) {
    return await clientTradingAccountLimit.updateOne(filter, update);
  }
  async getAggregate(options) {
    return await clientTradingAccountLimit.aggregate(options);
  }

  async createTradingAccountLimit(newRecord) {
    const limitRecord = new clientTradingAccountLimit(newRecord);
    return await limitRecord.save();
  }

  async getMaxLimitForTrAccounts(clientId) {
    const limitRecord = await clientTradingAccountLimit
      .findOne(
        { clientId },
        {
          approvedMaxAccounts: 1,
          currentAccounts: 1,
          _id: 0,
        }
      )
      .lean();
    return limitRecord;
  }
}

export default new tradeOrderRepository();