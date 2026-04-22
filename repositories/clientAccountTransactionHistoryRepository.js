import accountTransactionModel from "../models/clientFund/accountTransactions.model.js";
import mongoose from "mongoose";

class accountTransRepository {
  async createaccountTransaction(accountTransactionData) {
    const accountTransaction = new accountTransactionModel(
      accountTransactionData
    );
    // if (!accountTransaction.userId) {
    //   accountTransaction.userId = await accountTransactionModel.generateUserName();
    // }
    return await accountTransaction.save();
  }

  async createAccountTransactionWithSession(accountTransactionData, session = null) {
    const accountTransaction = new accountTransactionModel(
      accountTransactionData
    );

    if (session) {
      return await accountTransaction.save({ session });
    }
    return await accountTransaction.save();
  }

  async getaccountTransactionById(accountTransactionId) {
    return await accountTransactionModel.findById(accountTransactionId);
  }

  async getaccountTransactionByUniqueKey(key, value) {
    const filter = { [key]: value };
    return await accountTransactionModel.findOne(filter);
  }

  async getAccountTransactionHistoryByUniqueKey(
    key,
    value,
    fields,
    filterQuery = {}
  ) {
    const baseFilter = { [key]: value };
    const query = { ...baseFilter, ...filterQuery };

    return await accountTransactionModel
      .find(query)
      .select(fields.join(" "))
      .lean()
      .sort({ createdAt: -1 });
  }
  async getAllaccountTransactions(selectFields = "") {
    return await accountTransactionModel.find({}).select(selectFields);
  }
  async findaccountTransactionByEmail(userIdOrEmail) {
    const isNumber = !isNaN(userIdOrEmail);
    return await accountTransactionModel.findOne({
      $or: [
        { userId: isNumber ? Number(userIdOrEmail) : null },
        { email: isNumber ? null : userIdOrEmail.toLowerCase() },
      ].filter(Boolean),
    });
  }

  async updateaccountTransactionById(accountTransactionId, updates) {
    return await accountTransactionModel.findByIdAndUpdate(
      accountTransactionId,
      updates,
      {
        new: true,
      }
    );
  }

  async deleteaccountTransactionById(accountTransactionId) {
    return await accountTransactionModel.findByIdAndDelete(
      accountTransactionId
    );
  }

  async updateDocumentByField(fieldName, fieldValue, updateData) {
    const filter = { [fieldName]: fieldValue };
    return await accountTransactionModel.updateOne(filter, {
      $set: updateData,
    });
  }

  async getPaginatedaccountTransactions(filter, skip, limit, select = "") {
    return await accountTransactionModel
      .find(filter)
      .select(select)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async getaccountTransactionsCount(filter) {
    return await accountTransactionModel.countDocuments(filter).exec();
  }

  async getFilteredAllaccountTransactions(
    selectFields = "",
    sortField = "createdAt",
    sortOrder = 1
  ) {
    return await accountTransactionModel
      .find({})
      .select(selectFields)
      .sort({ [sortField]: sortOrder });
  }

  async getaccountTransactionsByAccountType(accountType, selectFields = "") {
    return await accountTransactionModel
      .find({ accountType })
      .select(selectFields);
  }


  async getaccountTransactionIdByEmail(emailId) {
    try {
      return await accountTransactionModel.findOne({ email: emailId });
    } catch (error) {
      console.log("Error in finding user by email");
      return null;
    }
  }
  async findaccountTransactionsByEmailPattern(emailPattern) {
    return await accountTransactionModel
      .find({ email: { $regex: emailPattern } }, { email: 1, _id: 0 })
      .limit(10);
  }
  async getAggregate(options) {
    return await accountTransactionModel.aggregate(options);
  }
  async getTransByOptions(
    options,
    selectFields,
    sort = {},
    skip = 0,
    limit = 0
  ) {
    return await accountTransactionModel
      .find(options)
      .select(selectFields)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async countTransactions(options) {
    return await accountTransactionModel.countDocuments(options);
  }
  async aggregateTransactions(pipeline) {
    return await accountTransactionModel.aggregate(pipeline);
  }

  async aggregateTransactionsCount(pipeline) {
    const countPipeline = [...pipeline, { $count: "total" }];
    const result = await accountTransactionModel.aggregate(countPipeline);
    return result[0]?.total || 0;
  }
}

export default new accountTransRepository();
