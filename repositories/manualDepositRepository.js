import ManualDepositRequest from "../models/manualDepositRequestModal.js";


class ManualDepositRepository {
  async createRequest(doc, session = null) {
    const reqDoc = new ManualDepositRequest(doc);

    if (session) {
      return await reqDoc.save({ session });
    }
    return await reqDoc.save();
  }
  
  async getOneReq(filter, selectFields = "") {
    return await ManualDepositRequest.findOne(filter).select(selectFields);
  }
}


export default new ManualDepositRepository();
