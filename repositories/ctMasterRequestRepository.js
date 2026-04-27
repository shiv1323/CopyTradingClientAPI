import CtMasterRequest from "../models/ctMasterRequest.model.js";

const CtMasterRequestRepository = {
  // Create a new master request
  create: async (data) => {
    if (data.type === "unmark") {
      let getRequest = await CtMasterRequest.findOne({
        masterLogin: String(data.masterLogin),
        masterId: data.masterId,
        whiteLabel: data.whiteLabel,
        type: "unmark",
        status: "CANCELATION",
      }).lean();
      if (getRequest) {
        throw {
          code: 11000,
          message: "A request is already pending for this user.",
        };
      }
    }
    return await CtMasterRequest.create(data);
  },

  // Get request by ID
  findById: async (id) => {
    return await CtMasterRequest.findById(id)
      .populate("whiteLabel")
      .populate("masterId");
  },

  // Get all requests (optional filter)
  findAll: async (filter = {}) => {
    return await CtMasterRequest.find(filter)
      .populate("whiteLabel")
      .populate("masterId")
      .sort({ requestedAt: -1 });
  },

  // Update a request by ID
  updateById: async (id, update) => {
    return await CtMasterRequest.findByIdAndUpdate(id, update, {
      new: true,
    });
  },

  // Delete a request by ID
  deleteById: async (id) => {
    return await CtMasterRequest.findByIdAndDelete(id);
  },

  // Find by master login & whiteLabel
  findByMasterLogin: async (masterLogin, whiteLabelId) => {
    return await CtMasterRequest.findOne({
      masterLogin,
      whiteLabel: whiteLabelId,
    });
  },
  
  findApprovedMasterByLogin: async (masterLogin, whiteLabelId) => {
    return await CtMasterRequest.findOne({
      masterLogin: String(masterLogin),
      whiteLabel: whiteLabelId,
      type: "mark",
      status: "APPROVED",
    })
      .select("masterId masterLogin")
      .lean();
  },

    findApprovedMasterByLoginAndGroup: async (masterLogin, whiteLabelId) => {
    return await CtMasterRequest.findOne({
      masterLogin: String(masterLogin),
      whiteLabel: whiteLabelId,
      type: "mark",
      status: "APPROVED",
    })
      .select("masterId masterLogin groupId")
      .populate({
        path: "groupId",
        select: "groupName group managerType description linkedGroupIds",
        populate:{
          path: "linkedGroupIds",
          select: "groupName group managerType description"
        }
      })
      .lean();
  },

  // Approve a request
  approveRequest: async (id) => {
    return await CtMasterRequest.findByIdAndUpdate(
      id,
      { status: "APPROVED", completedOn: new Date() },
      { new: true }
    );
  },

  // Reject a request
  rejectRequest: async (id) => {
    return await CtMasterRequest.findByIdAndUpdate(
      id,
      { status: "REJECTED", completedOn: new Date() },
      { new: true }
    );
  },

  doesRequestExists: async (filter) => {
    // console.log(filter);
    return await CtMasterRequest.findOne(filter).select("_id").lean();
  },

  removeAsMaster: async (masterClientId, whiteLabelId, masterLogin) => {
    return await CtMasterRequest.deleteOne({
      masterId: masterClientId,
      whiteLabel: whiteLabelId,
      masterLogin: String(masterLogin),
      type: "mark",
      status: "APPROVED",
    });
  },
};

export default CtMasterRequestRepository;
