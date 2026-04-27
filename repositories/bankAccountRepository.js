import { BankAccountDeposit } from "../models/bankAccountModal.js";

class BankAccountRepository {
  async updateOneRecord(filter, update) {
    return await BankAccountDeposit.updateOne(filter, update);
  }

  async updateManyRecords(filter, update) {
    return await BankAccountDeposit.updateMany(filter, update);
  }
  async createBankAcc(accData) {
    const bankDoc = new BankAccountDeposit(accData);

    return await bankDoc.save();
  }

  async getBankById(id) {
    return await BankAccountDeposit.findById(id);
  }
  
  async getBankByFilter(filter) {
    return await BankAccountDeposit.findOne(filter);
  }

  async getBankAccList(filter, select = "") {
    return await BankAccountDeposit.find(filter).select(select);
  }
  async deleteById(id) {
    return BankAccountDeposit.findByIdAndDelete(id);
  }

  async getPaginatedAccounts(filter, skip, limit, select = "", sortOrder = -1) {
    return await BankAccountDeposit.find(filter)
      .skip(skip)
      .limit(limit)
      .select(select)
      .sort({ createdAt: sortOrder })
      .lean();
  }

  // Get the count of clients matching a filter
  async getAccCount(filter) {
    return await BankAccountDeposit.countDocuments(filter).exec();
  }
}

export default new BankAccountRepository();
