import ForexGroupModel from "../models/forexGroups.model.js";// Assuming the group model is in this path
import mongoose from "mongoose";

class ForexGroupRepository {
  // Create a new group
  async createGroup(groupData) {
    const group = new ForexGroupModel(groupData);
    return await group.save();
  }

  // Get group by ID
  async getGroupById(groupId) {
    return await ForexGroupModel.findById(groupId);
  }

  // Get a group by unique key (e.g., groupCode)
  async getGroupByUniqueKey(key, value) {
    const filter = { [key]: value };
    return await ForexGroupModel.findOne(filter);
  }

  // Get all groups with optional field selection
  async getAllGroups(selectFields = "") {
    return await ForexGroupModel.find({}).select(selectFields);
  }

  // Update group by ID
  async updateGroupById(groupId, updates) {
    return await ForexGroupModel.findByIdAndUpdate(groupId, updates, { new: true });
  }

  // Delete group by ID
  async deleteGroupById(groupId) {
    return await ForexGroupModel.findByIdAndDelete(groupId);
  }

  // Get groups with pagination
  async getPaginatedGroups(filter, skip, limit, select = "") {
    return await ForexGroupModel
      .find(filter)
      .select(select)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  // Get the total count of groups matching the filter
  async getGroupsCount(filter) {
    return await ForexGroupModel.countDocuments(filter).exec();
  }

  // Get filtered groups, sorting by a given field
  async getFilteredAllGroups(
    selectFields = "",
    sortField = "createdAt",
    sortOrder = 1
  ) {
    return await ForexGroupModel
      .find({})
      .select(selectFields)
      .sort({ [sortField]: sortOrder });
  }

  // Add clients to a group (could be an array of client IDs)
  async addClientsToGroup(groupId, clientIds) {
    const group = await ForexGroupModel.findById(groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    // Assuming clients are stored as an array of ObjectIds
    group.clients.push(...clientIds);

    return await group.save();
  }

  // Remove clients from a group (could be an array of client IDs)
  async removeClientsFromGroup(groupId, clientIds) {
      const group = await ForexGroupModel.findById(groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    group.clients = group.clients.filter(
      (clientId) => !clientIds.includes(clientId.toString())
    );

    return await group.save();
  }

  // Get groups by account type
  async getGroupsByAccountType(accountType, selectFields = "") {
    return await ForexGroupModel.find({ accountType }).select(selectFields);
  }

  // Set a group as a special type (e.g., VIP)
  async setGroupAsVIP(groupId) {
    const group = await ForexGroupModel.findById(groupId);

    if (!group) {
      throw new Error("Group not found");
    }

    group.isVIP = true;
    return await group.save();
  }
  async findGroupByOptions(options, selectFields = "") {
    try {
      return await ForexGroupModel
        .find(options)
        .select(selectFields)
        .sort({ sortedPosition: 1 });
    } catch (error) {
      console.error("Error finding group by referral code:", error);
      throw error;
    }
  }

  async getForexGroupById(groupId, selectFields = "") {
    return await ForexGroupModel.findById(groupId).select(selectFields);
  }
}

export default new ForexGroupRepository();
