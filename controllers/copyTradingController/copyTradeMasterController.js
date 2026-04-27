import mongoose from "mongoose";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import tradingAccountRepository from "../../repositories/tradingAccountRepository.js";
import CTFollowRequestRepository from "../../repositories/copyTradingRequestsRepository.js";
import CTMastersRepository from "../../repositories/ctMastersRepository.js";
import moment from "moment";
import clientProfileRepository from "../../repositories/clientProfileRepository.js";
import { decrypt, encryptPasswordForStorage } from "../../utils/authUtils.js";
import bcrypt from "bcryptjs";
import WhiteLabel from "../../models/whiteLevel.model.js";
import CtMasterRequestRepository from "../../repositories/ctMasterRequestRepository.js";
import { sendCustomEmail } from "../../utils/commonUtils.js";
import ForexGroupRepository from "../../repositories/forexGroupRepository.js";

export const raiseRequest = asyncHandler(async (req, res) => {
  const { id, whiteLabel } = req.user;

  const clientProfile = await clientProfileRepository.getClientById(id);

  const {
    masterUserId,
    masterTrAccout,
    slefTrAccount,
    tradingCondition,
    ratio,
  } = req.body;
  const [
    masterExists,
    selfTrAccExists,
    requestExists,
    activeRequestExists,
    followerFund,
    doesAlreadyRequestExists,
  ] = await Promise.all([
    tradingAccountRepository.getOneMasterTradingAccountByField({
      ClientId: new mongoose.Types.ObjectId(masterUserId),
      WhiteLabel: whiteLabel,
      Login: masterTrAccout,
      IsMasterAccount: true,
    }),
    tradingAccountRepository.getOneFollowerTradingAccountByField({
      ClientId: id,
      WhiteLabel: whiteLabel,
      Login: slefTrAccount,
      IsMasterAccount: false,
    }),
    CTFollowRequestRepository.getRequestsOfFollower({
      whiteLabel: whiteLabel,
      followerAccount: id,
      followerTradingMId: slefTrAccount,
      status: 0,
      active: true,
    }),

    CTFollowRequestRepository.getRequestsOfFollower({
      whiteLabel: whiteLabel,
      followerAccount: id,
      masterAccount: masterUserId,
      masterTradingMId: masterTrAccout,
      followerTradingMId: slefTrAccount,
      status: { $in: [0, 1, 2] },
      active: true,
    }),
    tradingAccountRepository.fetchTradingAccountFund({
      ClientId: id,
      WhiteLabel: whiteLabel,
      Login: slefTrAccount,
      IsMasterAccount: false,
    }),
    CtMasterRequestRepository.doesRequestExists({
      masterLogin: slefTrAccount,
      masterId: id,
      status: "PENDING",
      whiteLabel: whiteLabel,
    }),
  ]);
  if (doesAlreadyRequestExists) {
    return res.error(
      "Selected Follower Accout Has Already Requested For Becoming A Master, Please Wait While We Process Master Request!",
    );
  }
  if (
    masterExists?.GroupId.toString() !== selfTrAccExists?.GroupId.toString()
  ) {
    let masterGroupId = masterExists?.GroupId.toString();
    const getGroup = await ForexGroupRepository.getGroupById(
      new mongoose.Types.ObjectId(masterGroupId),
    );
    if (!getGroup || getGroup?.LinkedGroupIds.length === 0) {
      return res.error("Master and Follower Accounts Group Are Not Linked.");
    }
    let isFollowerGroupLinked = getGroup?.LinkedGroupIds?.includes(
      new mongoose.Types.ObjectId(selfTrAccExists?.GroupId.toString()),
    );
    if (!isFollowerGroupLinked) {
      return res.error("Master and Follower Accounts Group Are Not Linked.");
    }
  }

  if (!masterExists) return res.error("Invalid Master Detail", 404);
  if (!selfTrAccExists) return res.error("Invalid Self Trading Account");
  if (requestExists && requestExists.length > 0) {
    return res.error(
      "You already have an ongoing request for this follower account, Reject Or Approve it first!",
      400,
    );
  }
  if (activeRequestExists && activeRequestExists.length > 0) {
    return res.error(
      "You already have an active request for this master & follower account",
      400,
    );
  }
  if (!followerFund[0] || followerFund[0]?.Equity <= 0)
    return res.error(
      "Selected Follower Account Has No Fund! Unable To Copy Master",
      404,
    );
  const raiseRequestObj = {
    whiteLabel: whiteLabel,
    followerAccount: id,
    masterAccount: masterUserId,
    followerTradingMId: slefTrAccount,
    masterTradingMId: masterTrAccout,
    status: 0,
    requestedAt: moment().toISOString(),
    tradingCondition: tradingCondition?.toUpperCase() || "VOLUME_PERCENT",
    ratio: ratio || 100,
  };
  const raised =
    await CTFollowRequestRepository.createFollowRequest(raiseRequestObj);
  await sendCustomEmail(whiteLabel, "copy_trading_request_raised", [clientProfile.email], {
    firstName: clientProfile.name || "N/A",
    masterId: masterUserId.toString().slice(-5) || "N/A",
    masterLogin: masterTrAccout || "N/A",
    selfLogin: slefTrAccount || "N/A",
    ctTradeMode: tradingCondition?.toUpperCase() || "N/A",
    value: ratio || "N/A",
  });
  return res.success([], "Request Raised!", 200);
});

const STATUS_ARRAY = [
  "Pending at Master",
  "Pending at Admin",
  "Approved by Admin",
  "Rejected by Master",
  "Rejected by Admin",
  "Invalidated",
];

export const getRequestList = asyncHandler(async (req, res) => {
  const { whiteLabel, id } = req.user;
  const statusMap = {
    PENDING: 0,
    APPROVED: 2,
  };
  const { status } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const query = {
    whiteLabel: whiteLabel,
    followerAccount: id,
    status: 2,
  };
  if (status !== undefined) {
    const statusKey = status?.toUpperCase();
    if (statusKey === "REJECTED") {
      query.status = { $in: [3, 4] };
    } else if (statusKey === "PENDING") {
      query.status = { $in: [0, 1] };
    } else if (statusMap[statusKey] !== undefined) {
      query.status = statusMap[statusKey];
    }
  }
  const [result, totalCount] = await Promise.all([
    CTFollowRequestRepository.getRequestsByFollower(
      query,
      page,
      limit,
      "followerTradingMId masterAccount masterTradingMId tradingCondition ratio status remark",
    ),
    CTFollowRequestRepository.countFollowRequestList(query),
  ]);
  let revisedOutput = result?.map?.((record) => {
    return {
      requestId: record?._id,
      masterName: record?.masterAccount?.name || "Unavailable",
      masterId: record?.masterAccount?._id || "Unavailable",
      followerLogin: record?.followerTradingMId,
      masterLogin: record?.masterTradingMId,
      tradingOperation: record?.tradingCondition,
      ratio: record?.ratio,
      status: STATUS_ARRAY[record?.status],
      remark: record?.remark,
    };
  });

  return res.success(
    {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      revisedOutput,
    },
    "Retrived Success!",
    200,
  );
});

const handleStopCopying = async (res, params) => {
  try {
    const [
      disableFollowerFromCopySystem,
      disableRequestActive,
      disableFollower,
    ] = await Promise.all([
      CTMastersRepository.updateFollower(
        params.masterLogin,
        params.masterId,
        params.followerLogin,
        params.whiteLabel,
      ),
      CTFollowRequestRepository.disableFollowerRequest(
        params.requestId,
        params.whiteLabel,
      ),
      tradingAccountRepository.updateTradingAccountOnBecomeFollower(
        { WhiteLabel: params.whiteLabel, Login: params.followerLogin },
        false,
      ),
    ]);
    const isFollowerUpdated = disableFollowerFromCopySystem?.modifiedCount > 0;
    const isRequestUpdated = disableRequestActive?.modifiedCount > 0;
    const isFollowerDisabled = disableFollower?.modifiedCount > 0;
    if (!isFollowerDisabled) {
      return res.error("Follower Account Not Found!", 404);
    }
    if (isFollowerUpdated && isRequestUpdated) {
      return res.success([], "Copy Trading Stopped!", 200);
    } else {
      return res.success([], `Already Updated`, 200);
    }
  } catch (error) {
    throw new Error(error);
  }
};

const handleReassignMaster = async (res, params) => {
  try {
    const [masterExists, selfTrAccExists] = await Promise.all([
      tradingAccountRepository.getOneMasterTradingAccountByField({
        ClientId: params.masterId,
        WhiteLabel: params?.whiteLabel,
        Login: params?.masterLogin,
        IsMasterAccount: true,
      }),
      tradingAccountRepository.getOneFollowerTradingAccountByField({
        ClientId: params.followerAccount,
        WhiteLabel: params.whiteLabel,
        Login: params.followerLogin,
        IsMasterAccount: false,
      }),
    ]);

    if (
      masterExists?.GroupId.toString() !== selfTrAccExists?.GroupId.toString()
    )
      return res.error(
        "Master and Follower Accounts are not in the same group",
        400,
      );
    if (!masterExists) return res.error("Invalid Master Detail", 500);
    if (!selfTrAccExists) return res.error("Invalid Self Trading Account", 500);
    const [invalidateOldOngoingRequest, removeMappingFromCtSystem] =
      await Promise.all([
        CTFollowRequestRepository.invalidateFollowerRequest(
          params?.requestId,
          params.whiteLabel,
        ),
        CTMastersRepository.updateFollower(
          params.oldMasterLogin,
          params.oldMasterId,
          params.followerLogin,
          params.whiteLabel,
        ),
      ]);
    if (!invalidateOldOngoingRequest.acknowledged)
      return res.error(
        "No Previous Followed Master Found! Please add a new master!",
        500,
      );

    const raiseRequestObj = {
      whiteLabel: params?.whiteLabel,
      followerAccount: params?.followerAccount,
      masterAccount: params?.masterId,
      followerTradingMId: params?.followerLogin,
      masterTradingMId: params?.masterLogin,
      status: 0,
      requestedAt: moment().toISOString(),
      tradingCondition:
        params?.tradingOperation?.toUpperCase() || "VOLUME_PERCENT",
      ratio: params?.ratio || 100,
    };
    const raised =
      await CTFollowRequestRepository.createFollowRequest(raiseRequestObj);
    return res.success([], "Request Raised!", 200);
  } catch (error) {
    throw new Error(error);
  }
};

export const requestClientAction = asyncHandler(async (req, res) => {
  const actionMap = {
    0: "STOP",
    1: "REASSIGN",
  };

  const { whiteLabel, id } = req.user;
  const { email, name } = await clientProfileRepository.getClientById(id);
  const {
    action,
    masterId,
    followerLogin,
    requestId,
    masterLogin,
    tradingOperation,
    oldMasterLogin,
    oldMasterId,
    ratio,
  } = req.body;

  switch (actionMap[action]) {
    case "STOP":
      await handleStopCopying(res, {
        whiteLabel,
        masterId: new mongoose.Types.ObjectId(masterId),
        followerLogin,
        masterLogin,
        requestId: new mongoose.Types.ObjectId(requestId),
      });
      sendCustomEmail(whiteLabel, "copy_trading_stopped_from_client", [email], {
        firstName: name || "N/A",
        masterId: masterId?.toString().slice(-5) || "N/A",
        masterLogin: masterLogin || "N/A",
        selfLogin: followerLogin || "N/A",
        // ctTradeMode: tradingOperation?.toUpperCase() || "N/A",
        // value:ratio || "N/A",
      });
      break;

    case "REASSIGN":
      await handleReassignMaster(res, {
        whiteLabel,
        masterId: new mongoose.Types.ObjectId(masterId),
        followerLogin,
        followerAccount: id,
        masterLogin,
        requestId: new mongoose.Types.ObjectId(requestId),
        tradingOperation,
        oldMasterLogin: oldMasterLogin,
        oldMasterId: new mongoose.Types.ObjectId(oldMasterId),
        ratio,
      });
      sendCustomEmail(whiteLabel, "CT_master_reassign", [email], {
        oldMasterId: oldMasterId?.toString().slice(-5) || "N/A",
        oldMasterLogin: oldMasterLogin || "N/A",
        newMasterId: masterId?.toString().slice(-5) || "N/A",
        newMasterLogin: masterLogin || "N/A",
        selfLogin: followerLogin || "N/A",
        newCtTradeMode: tradingOperation?.toUpperCase() || "N/A",
        newValue: ratio || "N/A",
      });
      break;

    default:
      return res.status(400).json({ message: "Invalid action." });
  }
});

export const getMasterTrAccountDropDown = asyncHandler(async (req, res) => {
  const { whiteLabel, userId } = req.user;
  const masterId = await clientProfileRepository.getClientByUserId(
    {
      whiteLabel: whiteLabel,
      userId: Number(userId),
    },
    "_id",
  );
  if (!masterId) {
    return res.error("Invalid Master User ID", 404);
  }
  const getTrAcc = await tradingAccountRepository.getOneTradingAccountByField(
    { WhiteLabel: whiteLabel, ClientId: masterId?._id, IsMasterAccount: true },
    ["Login", "Name", "ClientId"],
  );
  return res.success(
    { accountList: getTrAcc },
    "Master Trading Accounts Retrieved",
    200,
  );
});

export const getMasteruserIdSearch = asyncHandler(async (req, res) => {
  const { whiteLabel } = req.user;
  const { userId } = req.query;
  const masterId = await clientProfileRepository.getClientByUserId(
    {
      whiteLabel: whiteLabel,
      userId: Number(userId),
    },
    "_id userId",
  );
  if (!masterId) {
    return res.success([], "No Master Available", 200);
  }
  return res.success(masterId, "Master User ID Retrieved", 200);
});

export const markMasterTradingAccountEligible = asyncHandler(
  async (req, res) => {
    const { whiteLabel, id, password } = req.user;
    const { tradingAccount, pass, value } = req.body;
    const clientPass = decrypt(pass) || "asdfghjklpoiuytrewqazxcvbnm";
    const isMatch = await bcrypt.compare(clientPass, password);
    if (!isMatch) return res.error("Invalid Password", 401);
    const result =
      await tradingAccountRepository.updateTradingAccountMasterEligible(
        { WhiteLabel: whiteLabel, Login: tradingAccount },
        value,
      );
    if (!result.acknowledged) {
      return res.error("Failed to update trading account eligibility", 500);
    }
    return res.success(
      {},
      "Trading account eligibility updated successfully",
      200,
    );
  },
);

export const setSelfFollowingAccountRules = asyncHandler(async (req, res) => {
  const { whiteLabel } = req.user;
  const {
    symbols,
    inverseCopy,
    minVolume,
    maxSlippage,
    maxDelay,
    minEquityPercent,
    volumeRule,
    masterAccountId,
    followerLoginId,
    stopLossRule,
    takeProfitRule,
  } = req.body;
  const updateData = {};
  if (symbols) updateData["followers.$.rules.symbols"] = symbols;
  updateData["followers.$.rules.inverseCopy"] = inverseCopy;
  if (minVolume) updateData["followers.$.rules.minVolume"] = minVolume;
  if (maxSlippage) updateData["followers.$.rules.maxSlippage"] = maxSlippage;
  if (maxDelay) updateData["followers.$.rules.maxDelay"] = maxDelay;
  if (minEquityPercent)
    updateData["followers.$.rules.minEquityPercent"] = minEquityPercent;
  if (volumeRule) {
    updateData["followers.$.rules.volumeRule.mode"] =
      volumeRule?.mode?.toUpperCase();
    updateData["followers.$.rules.volumeRule.value"] = volumeRule?.value;
    try {
      await CTFollowRequestRepository.updateTradingOperation(
        {
          status: 2,
          active: true,
          whiteLabel: whiteLabel,
          masterAccount: new mongoose.Types.ObjectId(masterAccountId),
          followerTradingMId: followerLoginId,
        },
        {
          $set: {
            tradingCondition: volumeRule?.mode?.toUpperCase(),
            ratio: volumeRule?.value,
          },
        },
      );
    } catch (err) {
      console.error("Error updating trading operation:", err);
    }
  }

  if (stopLossRule !== undefined) {
    updateData["followers.$.rules.stopLossRule"] =
      stopLossRule === 0 ? null : stopLossRule;
  }

  if (takeProfitRule !== undefined) {
    updateData["followers.$.rules.takeProfitRule"] =
      takeProfitRule === 0 ? null : takeProfitRule;
  }
  const result = await CTMastersRepository.updateFollowersRule(
    masterAccountId,
    followerLoginId,
    whiteLabel,
    updateData,
  );
  if (result.modifiedCount === 0) {
    return res.success({}, "Rules already up to date", 200);
  };
  if (result.modifiedCount > 0) {
    return res.success({}, "Rules updated successfully", 200);
  }
  return res.error("Failed to update rules", 500);
});

export const getMasterRules = asyncHandler(async (req, res) => {
  const { whiteLabel } = req.user;
  const { masterLoginId } = req.query;

  if (!masterLoginId) {
    return res.error("Master Login ID is required", 400);
  }

  const master = await CTMastersRepository.getMasterByLoginIdAndWhiteLabel(
    whiteLabel,
    masterLoginId,
  );

  if (!master) {
    const masterRequest =
      await CtMasterRequestRepository.findApprovedMasterByLogin(
        masterLoginId,
        whiteLabel,
      );
    if (!masterRequest?.masterId) {
      return res.error("Master Not Found", 404);
    }
    return res.success(
      {
        masterLoginId,
        masterSL: 0,
        masterTP: 0,
      },
      "Master Rules Fetched Successfully",
      200,
    );
  }

  return res.success(
    {
      masterLoginId,
      masterSL: master.masterSL ?? 0,
      masterTP: master.masterTP ?? 0,
    },
    "Master rules fetched successfully",
    200,
  );
});

export const setMasterRulesForAllFollowers = asyncHandler(async (req, res) => {
  const { whiteLabel } = req.user;
  let { masterLoginId, stopLossRule, takeProfitRule } = req.body;

  if (stopLossRule === undefined) {
    stopLossRule = 0;
  }
  if (takeProfitRule === undefined) {
    takeProfitRule = 0;
  }
  const updateData = {};
  if (stopLossRule !== undefined)
    updateData.stopLossRule = stopLossRule === 0 ? null : stopLossRule;
  if (takeProfitRule !== undefined)
    updateData.takeProfitRule = takeProfitRule === 0 ? null : takeProfitRule;

  const masterSL =
    updateData.stopLossRule === 0 ? null : (updateData.stopLossRule ?? null);
  const masterTP =
    updateData.takeProfitRule === 0
      ? null
      : (updateData.takeProfitRule ?? null);

  const result = await CTMastersRepository.updateMasterRulesByMasterLogin(
    whiteLabel,
    masterLoginId,
    updateData,
  );

  if (result.modifiedCount > 0) {
    return res.success(
      {},
      "Master rules updated for all followers successfully",
      200,
    );
  }

  if (result.modifiedCount === 0) {
    const existingMaster =
      await CTMastersRepository.getMasterByLoginIdAndWhiteLabel(
        whiteLabel,
        masterLoginId,
      );
    if (existingMaster) {
      return res.success(
        {},
        "Master rules already updated for all followers",
        200,
      );
    }

    const approvedMasterRequest =
      await CtMasterRequestRepository.findApprovedMasterByLogin(
        masterLoginId,
        whiteLabel,
      );
    if (!approvedMasterRequest) {
      return res.error(
        "Master not found. Master must be approved in ctMasterRequest first.",
        404,
      );
    }

    await CTMastersRepository.createMaster({
      whiteLabel,
      masterAccountId: approvedMasterRequest.masterId,
      loginId: String(masterLoginId),
      masterSL,
      masterTP,
      followers: [],
      status: true,
    });

    return res.success(
      {},
      "Master rules created successfully (no followers yet)",
      201,
    );
  }

  return res.error(
    "Failed to update rules. Master not found or no followers to update.",
    500,
  );
});

export const fetchAppliedRules = asyncHandler(async (req, res) => {
  const { whiteLabel, id } = req.user;
  const { masterAccountId, followerLoginId, masterLoginId } = req.query;
  const rules = await CTMastersRepository.getFollowersByMasterId({
    whiteLabel: whiteLabel,
    loginId: masterLoginId,
    masterAccountId: new mongoose.Types.ObjectId(masterAccountId),
  });
  let follower = rules[0]?.followers || [];
  const result = follower.find(
    (follower) => follower.loginId === followerLoginId,
  );
  if (!result?.rules) {
    return res.error(
      "No rules found for the specified master and follower",
      404,
    );
  }
  const appliedRules = {
    inverseCopy: result.rules.inverseCopy,
    maxSlippage:
      result.rules.maxSlippage !== null ? result.rules.maxSlippage : "N/A",
    maxDelay: result.rules.maxDelay !== null ? result.rules.maxDelay : "N/A",
    minVolume: result.rules.minVolume !== null ? result.rules.minVolume : "N/A",
    minEquityPercent:
      result.rules.minEquityPercent !== null
        ? result.rules.minEquityPercent
        : "N/A",
    volumeRule: {
      mode:
        result.rules.volumeRule.mode !== null
          ? result.rules.volumeRule.mode
          : "N/A",
      value:
        result.rules.volumeRule.value !== null
          ? result.rules.volumeRule.value
          : 0,
    },
    stopLossRule: result.rules.stopLossRule ?? 0,
    takeProfitRule: result.rules.takeProfitRule ?? 0,
  };

  return res.success(
    { login: followerLoginId, rules: appliedRules },
    "Applied rules fetched successfully",
    200,
  );
});

export const getCTEligibleFollowerAccounts = asyncHandler(async (req, res) => {
  const { whiteLabel, id } = req.user;
  const getTradingAcc =
    await tradingAccountRepository.getTradingAccountsOfEligibleFollowers(
      whiteLabel,
      id,
    );
  if (!getTradingAcc || getTradingAcc.length === 0) {
    return res.success({}, "No eligible follower accounts found", 200);
  }
  return res.success(
    { accounts: getTradingAcc },
    "Eligible follower accounts retrieved successfully",
    200,
  );
});
