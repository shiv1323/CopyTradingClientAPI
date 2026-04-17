import { MongoClient, ObjectId } from "mongodb";
import whiteLabel from "../models/whiteLabel.model.js";

class whiteLabelRepository {
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

  async findByDomain(domain) {
    return await whiteLabel.findOne({
      website: domain,
      isActive: true,
    });
  }
}

export default new whiteLabelRepository();
