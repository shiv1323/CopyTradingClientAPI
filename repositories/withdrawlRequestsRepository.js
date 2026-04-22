import { MongoClient, ObjectId } from "mongodb";
import WithdrawRequest from "../models/clientFund/withdrawlRequest.model.js";

class withdrawRequestRepository {
  async getWithdrawRequestByWhiteLabel(clientId, whiteLabelId) {
    return await WithdrawRequest.find({
      client: clientId,
      whiteLabel: whiteLabelId,
    }).lean();
  }

  async getWhitelabelByWebsite(website) {
    return await WithdrawRequest.findOne({ website: website }).lean();
  }

  async getWithdrawRequestByWhiteLabel(clientId, whiteLabelId) {
    return await WithdrawRequest.find({
      client: clientId,
      whiteLabel: whiteLabelId,
    }).lean();
  }

  async insertWithdrawRequest(withdrawData) {
    const newWithdrawRequest = new WithdrawRequest(withdrawData);
    const savedRequest = await newWithdrawRequest.save();
    return savedRequest;
  }

  
}

export default new withdrawRequestRepository();
