import mongoose from "mongoose";
import { ClientDocument } from "../models/clientDocument.model.js";

function toObjectId(value) {
  if (value == null) return value;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }
  return value;
}

class ClientDocRepository {
  async createClientDocTran(data, session) {
    const payload = {
      ...data,
      userId: toObjectId(data.userId),
      adminId: toObjectId(data.adminId),
      documentNumber:
        data.documentNumber ?? data.documentId ?? "unknown",
    };
    const [created] = await ClientDocument.create([payload], { session });
    return created;
  }

  /**
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string|number} [fileNumber] When set, narrows to that document number/id.
   */
  async findClientDocByField(userId, fileNumber) {
    const uid = toObjectId(userId);
    const filter = {
      userId: uid,
      isActive: { $ne: false },
    };

    if (
      fileNumber !== undefined &&
      fileNumber !== null &&
      String(fileNumber).trim() !== ""
    ) {
      const fn = String(fileNumber);
      filter.$or = [{ documentNumber: fn }, { documentId: fn }];
    }

    return ClientDocument.find(filter).sort({ createdAt: -1 }).exec();
  }

  async deleteClientDocById(id) {
    return ClientDocument.findByIdAndDelete(toObjectId(id)).exec();
  }

  async updateClientDocById(id, update) {
    return ClientDocument.findByIdAndUpdate(toObjectId(id), update, {
      new: true,
    }).exec();
  }
}

export default new ClientDocRepository();
