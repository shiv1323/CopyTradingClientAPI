import Master from "../models/ctMaster.model.js"; // adjust path if needed

class MasterRepository {
  /**
   * Create a new master record.
   */
  async createMaster(data) {
    return await Master.create(data);
  }

  /**
   * Find one master by filter.
   * @param {Object} filter
   * @param {Object} projection
   */
  async findOne(filter, projection = {}) {
    return await Master.findOne(filter, projection).lean();
  }

  /**
   * Find multiple masters with filter + pagination.
   * @param {Object} filter
   * @param {Number} page
   * @param {Number} limit
   */
  async findAll(filter = {}, page = 1, limit = 10) {
    return await Master.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  async findAllDropDowns(filter = {}) {
    return await Master.find(filter).lean();
  }

  /**
   * Add a follower to a master.
   * @param {String} masterId
   * @param {Object} followerData
   */
  async addFollower(masterId, followerData) {
    return await Master.findByIdAndUpdate(
      masterId,
      { $push: { followers: followerData } },
      { new: true }
    );
  }

  /**
   * Update follower rule for a master.
   * @param {String} masterId
   * @param {String} followerId
   * @param {Object} updateData
   */
  async updateFollowerRule(masterId, followerId, updateData) {
    return await Master.updateOne(
      { _id: masterId, "followers.id": followerId },
      {
        $set: {
          "followers.$.rules": updateData,
        },
      }
    );
  }

  async updateFollower(oldMasterLogin, oldMasterId, followerLogin, whiteLabel) {
    return await Master.updateOne(
      {
        masterAccountId: oldMasterId,
        loginId: oldMasterLogin,
        whiteLabel: whiteLabel,
        "followers.loginId": followerLogin,
      },
      {
        $pull: {
          followers: { loginId: followerLogin },
        },
      }
      // {
      //   $set: {
      //     "followers.$[elem].status": false,
      //   },
      // },
      // {
      //   arrayFilters: [{ "elem.loginId": followerLogin }],
      // }
    );
  }

  /**
   * Remove a follower from a master.
   * @param {String} masterId
   * @param {String} followerId
   */
  async removeFollower(masterId, followerId) {
    return await Master.findByIdAndUpdate(
      masterId,
      { $pull: { followers: { id: followerId } } },
      { new: true }
    );
  }

  /**
   * Delete a master.
   * @param {String} masterId
   */
  async deleteMaster(masterId) {
    return await Master.findByIdAndDelete(masterId);
  }

  async getFollowersByMasterId(filter, select = "") {
    return await Master.find(filter).select(select).lean();
  }

  async getFollowersByMasterIdNdFollower(filter, select = "") {
    return await Master.find(filter)
      .populate({ path: "followers.id", select: "name" })
      .select(select)
      .lean();
  }

  async updateFollowersRule(masterId, followerLogin, whiteLabel, updateData) {
    return await Master.updateOne(
      {
        masterAccountId: masterId,
        "followers.loginId": followerLogin,
        whiteLabel: whiteLabel,
      },
      {
        $set: updateData,
      }
    );
  }

  async updateMasterRulesByMasterLogin(
    whiteLabel,
    masterLoginId,
    updateData
  ) {
    const setData = {};
    if (updateData.stopLossRule !== undefined) {
      setData.masterSL =
        updateData.stopLossRule === 0 ? null : updateData.stopLossRule;
    }
    if (updateData.takeProfitRule !== undefined) {
      setData.masterTP =
        updateData.takeProfitRule === 0 ? null : updateData.takeProfitRule;
    }
    if (Object.keys(setData).length === 0) {
      return { modifiedCount: 0 };
    }
    return await Master.updateOne(
      {
        whiteLabel: whiteLabel,
        loginId: masterLoginId,
      },
      { $set: setData }
    );
  }

  async countTotalFollowersByMasterId(filter = {}) {
    const result = await Master.aggregate([
      { $match: filter },
      { $unwind: "$followers" },
      { $match: { "followers.status": true }, },
      { $match: { "followers.isHidden": false } },
      { $count: "followerCount" },
    ]);

    return result[0]?.followerCount || 0;
  }

  async getAlreadyFollower(followerId, followerLogin, whiteLabel) {
    return await Master.findOne({
      "followers.id": followerId,
      "followers.loginId": followerLogin,
      whiteLabel: whiteLabel,
    }).lean();
  }

  async getMasterByLoginIdAndWhiteLabel(whiteLabel, masterLoginId, projection = "masterSL masterTP") {
    return await Master.findOne(
      {
        whiteLabel: whiteLabel,
        loginId: masterLoginId,
      },
      projection
    ).lean();
  }
}

export default new MasterRepository();
