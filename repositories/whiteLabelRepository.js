import { MongoClient, ObjectId } from "mongodb";
import WhiteLabel from "../models/whiteLabel.model.js";


class whiteLabelRepository {
  constructor() {
    const mongoUri = process.env.MONGODB_URI || process.env.DEV_DB_URI;
    if (!mongoUri) {
      throw new Error(
        "MongoDB connection string missing. Set MONGODB_URI (preferred) or DEV_DB_URI in .env."
      );
    }

    this.client = new MongoClient(mongoUri);
    this.databaseName =
      process.env.MONGO_DB_NAME ||
      // e.g. mongodb+srv://.../Shogun?retryWrites=true...
      mongoUri.match(/\/([^/?]+)(\?|$)/)?.[1];

    if (!this.databaseName) {
      throw new Error(
        "MongoDB database name missing. Set MONGO_DB_NAME in .env or include it in MONGODB_URI."
      );
    }

    this._connected = false;
  }

  async connectToCollection(collectionName) {
    if (!this._connected) {
      await this.client.connect();
      this._connected = true;
    }
    return this.client.db(this.databaseName).collection(collectionName);
  }

  async getWhitelabelByWebsite(website) {
    return await WhiteLabel.findOne({ website: website });
  }

  async findWhiteLabelById(whiteLabelId) {
    // Ensure whiteLabelId is converted to ObjectId if it's a string
    const id =
      typeof whiteLabelId === "string"
        ? new ObjectId(whiteLabelId)
        : whiteLabelId;

    const collection = await this.connectToCollection("WhiteLabel");
    return await collection.findOne({ _id: id });
  }

  async findWhiteLabelByIdSelected(whiteLabelId, selectFields = "") {
    const id =
      typeof whiteLabelId === "string"
        ? new ObjectId(whiteLabelId)
        : whiteLabelId;
    const collection = await this.connectToCollection("WhiteLabel");
    let projection = {};
    if (selectFields) {
      selectFields.split(" ").forEach((field) => {
        projection[field] = 1;
      });
    }

    return await collection.findOne({ _id: id }, { projection });
  }

  async findWhiteLabelByIdSelectedField(whiteLevelId, selectFields = "") {
    return await WhiteLabel.findById({ _id: whiteLevelId })
      .select(selectFields)
      .lean();
  }
}

export default new whiteLabelRepository();
