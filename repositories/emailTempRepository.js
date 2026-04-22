import emailTempModal from "../models/emailTemp.model.js";

class emailTempRepository {
  async getAllRecords(selectFields = "") {
    return await emailTempModal.find({}).select(selectFields);
  }

  async getRecordsByOptions(
    options,
    selectFields,
    sort = {},
    skip = 0,
    limit = 0
  ) {
    try {
      return await emailTempModal
        .find(options)
        .select(selectFields)
        .sort(sort)
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.log(error);
    }
  }

  async countRecord(options) {
    return await emailTempModal.countDocuments(options);
  }

  async updateOneRecord(filter, update) {
    return await emailTempModal.updateOne(filter, update);
  }
  async getAggregate(options) {
    return await emailTempModal.aggregate(options);
  }

  async createRecord(newRecord) {
    const limitRecord = new emailTempModal(newRecord);
    return await limitRecord.save();
  }

  async getMaxLimitForTrAccounts(clientId) {
    const limitRecord = await emailTempModal
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

export default new emailTempRepository();
