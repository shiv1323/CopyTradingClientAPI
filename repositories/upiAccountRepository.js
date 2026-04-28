import { UpiAccount } from "../models/clientFund/upiAccountModal.js";

class UpiAccountRepository {
  async updateOneRecord(filter, update) {
    return await UpiAccount.updateOne(filter, update);
  }

  async updateManyRecords(filter, update) {
    return await UpiAccount.updateMany(filter, update);
  }
  async createUpiAcc(accData) {
    const upiDoc = new UpiAccount(accData);

    return await upiDoc.save();
  }

  async getUpiById(id) {
    return await UpiAccount.findById(id);
  }

  async getUpiByFilter(filter) {
    return await UpiAccount.findOne(filter);
  }

  async getUpiAccList(filter, select = "") {
    return await UpiAccount.find(filter).select(select);
  }

  async deleteById(id) {
    return UpiAccount.findByIdAndDelete(id);
  }

  async getPaginatedAccounts(filter, skip, limit, select = "", sortOrder = -1) {
    return await UpiAccount.find(filter)
      .skip(skip)
      .limit(limit)
      .select(select)
      .sort({ createdAt: sortOrder })
      .lean();
  }

  // Get the count of clients matching a filter
  async getAccCount(filter) {
    return await UpiAccount.countDocuments(filter).exec();
  }
}

export default new UpiAccountRepository();
