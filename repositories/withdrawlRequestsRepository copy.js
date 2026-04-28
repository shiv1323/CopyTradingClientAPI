import { MongoClient, ObjectId } from "mongodb";
import WithdrawRequest from "../models/withdrawlRequest.model.js";

class withdrawRequestRepository {
  constructor() {
    this.client = new MongoClient(process.env.DEV_DB_URI);
    this.databaseName = process.env.MONGO_DB_NAME;
  }
  async connectToCollection(collectionName) {
    if (!this.client.isConnected) {
      await this.client.connect();
    }
    return this.client.db(this.databaseName).collection(collectionName);
  }
  async getWhitelabelByWebsite(website) {
    return await WithdrawRequest.findOne({ website: website });
  }

  async getWithdrawRequestByWhiteLabel(clientId, whiteLabelId) {
    return await WithdrawRequest.find({
      client: clientId,
      whiteLabel: whiteLabelId,
    });
  }

  async insertWithdrawRequest(withdrawData) {
    const newWithdrawRequest = new WithdrawRequest(withdrawData);
    const savedRequest = await newWithdrawRequest.save();
    return savedRequest;
  }

  
}

export default new withdrawRequestRepository();
