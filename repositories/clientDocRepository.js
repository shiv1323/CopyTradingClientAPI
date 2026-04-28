import mongoose from "mongoose";
import clientDocModel from "../models/clientDoc.model.js";

class ClientDocRepository {
  async createClientDoc(clientData) {
    const client = new clientDocModel(clientData);
    // if (!client.userId) {
    //   client.userId = await clientModel.generateUserName();
    // }
    return await client.save();
  }

  async createClientDocTran(clientData, session = null) {
    const client = new clientDocModel(clientData);
    if (session) {
      return await client.save({ session });
    }
    return await client.save();
  }
  
  async getClientDocById(clientId) {
    return await clientDocModel.findById(clientId);
  }

  async getDocuments(filter) {
    return await clientDocModel.find(filter);
  }

  async getClientDocByUniqueKey(key, value) {
    const filter = { [key]: value };
    return await clientDocModel.findOne(filter);
  }
  async getAllClientsDoc(selectFields = "") {
    return await clientDocModel.find({}).select(selectFields);
  }
  async findClientDocByField(userId, docNumber) {
    let query = {
      userId: new mongoose.Types.ObjectId(userId),
    };
    if (docNumber) {
      query.documentNumber = docNumber;
    }
    // console.log(query);
    return await clientDocModel.find(query);
  }
  async updateClientDocById(clientId, updates) {
    return await clientDocModel.findByIdAndUpdate(clientId, updates, {
      new: true,
    });
  }
  async deleteClientDocById(DocId) {
    return await clientDocModel.findByIdAndDelete(DocId);
  }
  async updateDocumentDocByField(fieldName, fieldValue, updateData) {
    const filter = { [fieldName]: fieldValue };
    return await clientDocModel.updateOne(filter, { $set: updateData });
  }
  async getPaginatedClientsDoc(filter, skip, limit, select = "") {
    return await clientDocModel
      .find(filter)
      .select(select)
      .skip(skip)
      .limit(limit)
      .lean();
  }
  async getClientsDocCount(filter) {
    return await clientDocModel.countDocuments(filter).exec();
  }
  async getFilteredAllClientsDoc(
    selectFields = "",
    sortField = "RegisteredDate",
    sortOrder = 1
  ) {
    return await clientDocModel
      .find({})
      .select(selectFields)
      .sort({ [sortField]: sortOrder });
  }
  async getClientsDocByAccountType(accountType, selectFields = "") {
    return await clientDocModel.find({ accountType }).select(selectFields);
  }
  async updateDocumentStatus(clientId) {
    return await clientDocModel.updateMany(
      {
        userId: new mongoose.Types.ObjectId(clientId),
        status: "PENDING",
      },
      {
        $set: {
          status: "APPROVED",
          "verificationDetails.verifiedAt": new Date(),
          updatedAt: new Date(),
        },
      }
    );
  }
}

export default new ClientDocRepository();
