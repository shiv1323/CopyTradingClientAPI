import CTTradeExecutionLogs from "../models/ctTradeExecutionLogs.model.js";

class TradeExecutionLogRepository {
  /**
   * Create a new log entry
   */
  async createLog(data) {
    const log = new CTTradeExecutionLogs(data);
    return await log.save();
  }

  async searchQuery(filter = {}, searchTerm = "", options = {}) {
    const {
      sort = { createdAt: -1 },
      skip = 0,
      limit = 20,
      lean = true,
    } = options;

    if (searchTerm) {
      filter.$or = [
        { transactionId: { $regex: searchTerm, $options: "i" } },
        { "stages.details": { $regex: searchTerm, $options: "i" } },
        { "stages.stage": { $regex: searchTerm, $options: "i" } },
        { "stages.details.Symbol": { $regex: searchTerm, $options: "i" } },
        { "stages.inputs.positionId": { $regex: searchTerm, $options: "i" } },
        { symbol: { $regex: searchTerm, $options: "i" } },
        { master: { $regex: searchTerm, $options: "i" } },
        { subscriber: { $regex: searchTerm, $options: "i" } },
      ];
      // console.log(filter);
    }

    let query = CTTradeExecutionLogs.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (lean) query = query.lean();

    return query.exec();
  }

  async queryLogs(filter = {}, options = {}) {
    const {
      sort = { createdAt: -1 },
      skip = 0,
      limit = 20,
      lean = true,
    } = options;

    let query = CTTradeExecutionLogs.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (lean) query = query.lean();
    return query.exec();
  }

  async countDocuments(filter = {}) {
    return CTTradeExecutionLogs.countDocuments(filter).exec();
  }

  async findOne(filter = {}, lean = true) {
    let query = CTTradeExecutionLogs.findOne(filter);
    if (lean) query = query.lean();
    return query.exec();
  }

  async updateById(id, update, options = { new: true }) {
    return CTTradeExecutionLogs.findByIdAndUpdate(id, update, options).exec();
  }

  async findById(id, lean = true) {
    let query = CTTradeExecutionLogs.findById(id);
    if (lean) query = query.lean();
    return query.exec();
  }

  /**
   * Append a stage log to an existing transaction
   */
  async addStage(transactionId, stageLog) {
    return await CTTradeExecutionLogs.findOneAndUpdate(
      { transactionId },
      { $push: { stages: stageLog } },
      { new: true }
    );
  }

  /**
   * Update the final status and completedAt timestamp
   */
  async completeLog(transactionId, finalStatus, extra = {}) {
    return await CTTradeExecutionLogs.findOneAndUpdate(
      { transactionId },
      {
        $set: {
          finalStatus,
          completedAt: new Date(),
          ...(Object.keys(extra).length > 0 ? { extra } : {}),
        },
      },
      { new: true }
    );
  }

  /**
   * Find by transactionId
   */
  async findByTransactionId(transactionId) {
    return await CTTradeExecutionLogs.findOne({ transactionId }).lean();
  }

  /**
   * Find all logs for a subscriber within a time range
   */
  async findBySubscriber(subscriber, { from, to }) {
    return await CTTradeExecutionLogs.find({
      subscriber,
      startedAt: { $gte: from, $lte: to },
    }).sort({ startedAt: -1 });
  }

  /**
   * Find all failed logs in last N hours
   */
  async findRecentFailures(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await CTTradeExecutionLogs.find({
      finalStatus: { $ne: "SUCCESS" },
      startedAt: { $gte: since },
    }).sort({ startedAt: -1 });
  }
}

export default new TradeExecutionLogRepository();
