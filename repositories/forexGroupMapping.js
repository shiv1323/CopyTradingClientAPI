import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.DEV_DB_URI);
const databaseName = process.env.MONGO_DB_NAME;

class ForexGroupMapping {
  async connectToCollection(collectionName) {
    if (!client.isConnected) {
      await client.connect();
    }
    return client.db(databaseName).collection(collectionName);
  }

  async getForexGroupMapping(filter = {}, selectFields = "") {
    const mapping = await this.connectToCollection("SubAgentGroupMapping");
    return await mapping.find(filter).select(selectFields);
  }
  async getForexGroupMappingByFilter(filter = {}) {
    const mapping = await this.connectToCollection("SubAgentGroupMapping");
    return await mapping.findOne(filter)
  }

  async updateForexGroupMapping(filter, updatePayload) {
    const mapping = await this.connectToCollection("SubAgentGroupMapping");
    return await mapping.findOneAndUpdate(filter, updatePayload, {
      new: true,
      upsert: true,
      runValidators: true,
    });
  }

  async getForexGroupMappingById(groupId, selectFields = "") {
    const mapping = await this.connectToCollection("SubAgentGroupMapping");
    return await mapping.findById(groupId).select(selectFields);
  }
}

export default new ForexGroupMapping();
