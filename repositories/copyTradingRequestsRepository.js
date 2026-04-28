import CTMasterFollowRequest from "../models/ctFollowRequest.model.js";

const CTFollowRequestRepository = {
  /**
   * Create a new follow request
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  createFollowRequest: async (data) => {
    const request = new CTMasterFollowRequest(data);
    return await request.save();
  },

  /**
   * Check if a follow request already exists
   * @param {Object} filter
   * @returns {Promise<Boolean>}
   */
  doesRequestExist: async (filter) => {
    // console.log(filter);
    const exists = await CTMasterFollowRequest.findOne(filter)
      .select("_id")
      .lean();
    return !!exists;
  },

  getReqByFilters: async (filter,select) => {
    const result = await CTMasterFollowRequest.findOne(filter)
      .select(select)
    return result;
  },

  /**
   * Get follow request by ID
   * @param {String} id
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    return await CTMasterFollowRequest.findById(id).lean();
  },

  /**
   * Approve by master
   * @param {String} id
   * @returns {Promise<Object>}
   */
  approveByMaster: async (id) => {
    return await CTMasterFollowRequest.findByIdAndUpdate(
      id,
      {
        $set: { status: 1, masterActionAt: new Date() },
      },
      { new: true }
    );
  },

  /**
   * Approve by admin
   * @param {String} id
   * @returns {Promise<Object>}
   */
  approveByAdmin: async (id) => {
    return await CTMasterFollowRequest.findByIdAndUpdate(
      id,
      {
        $set: { status: 2, adminActionAt: new Date() },
      },
      { new: true }
    );
  },

  /**
   * Delete or reject a request
   * @param {String} id
   * @returns {Promise<Object>}
   */
  deleteRequest: async (id) => {
    return await CTMasterFollowRequest.findByIdAndDelete(id);
  },

  /**
   * Get all requests for a given master account
   * @param {Object} filter
   * @returns {Promise<Array>}
   */
  getRequestsByMaster: async (filter) => {
    console.log(filter);
    return await CTMasterFollowRequest.find(filter).lean();
  },

  /**
   * Get all requests for a given follower account
   * @param {Object} filter
   * @returns {Promise<Array>}
   */
  getRequestsByFollower: async (filter, page = 1, limit = 100, select) => {
    return await CTMasterFollowRequest.find(filter)
      .select(select)
      .populate([
        { path: "masterAccount", select: "name" },
        { path: "followerAccount", select: "name" },
      ])
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  },

  getRequestsOfFollower: async (filter, select) => {
    return await CTMasterFollowRequest.find(filter)
      .select(select)
      .sort({ requestedAt: -1 })
      .lean();
  },

  countFollowRequestList: async (filter) => {
    return await CTMasterFollowRequest.countDocuments(filter);
  },

  disableFollowerRequest: async (requestId, whiteLabel) => {
    return await CTMasterFollowRequest.updateOne(
      {
        _id: requestId,
        whiteLabel: whiteLabel,
      },
      {
        $set: {
          status: 5,
          active: false,
        },
      }
    );
  },

  invalidateFollowerRequest: async (requestId, whiteLabel, remark = "") => {
    return await CTMasterFollowRequest.updateOne(
      {
        _id: requestId,
        whiteLabel: whiteLabel,
      },
      {
        $set: {
          active: false,
          status: 5, //invalid
          remark: remark
        },
      }
    );
  },

  approveCTFollowerRequest: async (requestId, whiteLabel, note, review) => {
    return await CTMasterFollowRequest.findOneAndUpdate(
      {
        _id: requestId,
        whiteLabel: whiteLabel,
      },
      {
        $set: {
          status: 1,
          active: true,
          masterActionAt: new Date(),
          note: note || "",
          remark: review || "",
        },
      },
      { new: true }
    );
  },
  rejectCTFollowerRequest: async (requestId, whiteLabel, review) => {
    return await CTMasterFollowRequest.findOneAndUpdate(
      {
        _id: requestId,
        whiteLabel: whiteLabel,
      },
      {
        $set: {
          active: false,
          status: 3, // rejected by master
          masterActionAt: new Date(),
          note: "Rejected By Master" || "",
          remark: review || "",
        },
      },
      { new: true }
    );
  },
  countTotalReceivedRequests: async (filter = {}) => {
    return await CTMasterFollowRequest.countDocuments(filter);
  },

  updateTradingOperation: async (query, update) => {
    return await CTMasterFollowRequest.updateOne(query, update);
  },
};

export default CTFollowRequestRepository;
