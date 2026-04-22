import { MongoClient, ObjectId } from "mongodb";
import mongoose from "mongoose";
import paymentMethod from "../models/clientFund/paymentMethod.model.js";
class paymentGetwayRepository {


  async getPaymentMethods(whiteLabel, type) {
    try {
      const collection = await paymentMethod.find({ whiteLabel: whiteLabel, type: type, status: true }).lean();  
      return collection;
    } catch (error) {
     throw new Error(error.message);
    }
  }
  async getPaymentMethodsTypes(whiteLabel) {
    try {
      const collection = await this.connectToCollection("currencies_list");
      return await collection.find({ whiteLabel: whiteLabel }).toArray();
    } catch (error) {
      console.error("Error fetching payment methods tyes:", error);
      throw new Error("Failed to fetch payment methods types.");
    }
  }

  async getPaymentMethodsByFilter(filter) {
    try {
      return await paymentMethod.findOne(filter).lean();
    } catch (error) {
      console.error("Error fetching payment methods tyes:", error);
      throw new Error("Failed to fetch payment methods types.");
    }
  }
}

export default new paymentGetwayRepository();
