import ForexGroupMappingModel from "../models/forexGroups.model.js";


class ForexGroupMapping {

  async getForexGroupMapping(filter = {}, selectFields = "") {
    const mapping = await ForexGroupMappingModel.find(filter).select(selectFields);
    return mapping;
  }
  async getForexGroupMappingByFilter(filter = {}) {
    const mapping = await ForexGroupMappingModel.findOne(filter);
    return mapping;
  }

  async updateForexGroupMapping(filter, updatePayload) {
    const mapping = await ForexGroupMappingModel.findOneAndUpdate(filter, updatePayload, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    return mapping;
  }

  async getForexGroupMappingById(groupId, selectFields = "") {
    return await ForexGroupMappingModel.findById(groupId).select(selectFields);
  }
}

export default new ForexGroupMapping();
