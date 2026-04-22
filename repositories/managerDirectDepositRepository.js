import ManagerDirectDeals from "../models/clientFund/managerDirectDeals.model.js";

class ManagerDirectDealsRepository {
  async create(data) {
    try {
      return await ManagerDirectDeals.create(data);
    } catch (error) {
      throw new Error(`Error creating ManagerDirectDeal: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await ManagerDirectDeals.findById(id);
    } catch (error) {
      throw new Error(
        `Error finding ManagerDirectDeal by ID: ${error.message}`
      );
    }
  }

  async findOne(filter) {
    try {
      return await ManagerDirectDeals.findOne(filter);
    } catch (error) {
      throw new Error(`Error finding ManagerDirectDeal: ${error.message}`);
    }
  }

  async findAll(filter = {}, options = {}) {
    try {
      return await ManagerDirectDeals.find(filter, null, options);
    } catch (error) {
      throw new Error(`Error finding ManagerDirectDeals: ${error.message}`);
    }
  }

  async updateById(id, updateData) {
    try {
      return await ManagerDirectDeals.findByIdAndUpdate(id, updateData, {
        new: true,
      });
    } catch (error) {
      throw new Error(`Error updating ManagerDirectDeal: ${error.message}`);
    }
  }

  async deleteById(id) {
    try {
      return await ManagerDirectDeals.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(`Error deleting ManagerDirectDeal: ${error.message}`);
    }
  }
}

export default new ManagerDirectDealsRepository();

