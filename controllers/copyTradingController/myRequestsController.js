import mongoose from "mongoose";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import tradingAccountRepository from "../../repositories/tradingAccountRepository.js";
import CTFollowRequestRepository from "../../repositories/copyTradingRequestsRepository.js";
import CTMastersRepository from "../../repositories/ctMastersRepository.js";
import moment from "moment";
import clientProfileRepository from "../../repositories/clientProfileRepository.js";
import CtOrdersRepository from "../../repositories/ctOrdersRepository.js";
import tradeReportRepository from "../../repositories/tradeReportRepository.js";
import { sendCustomEmail } from "../../utils/commonUtils.js";
import forexGroupRepository from "../../repositories/forexGroupRepository.js";

export const getSelfRequestListAsMaster = asyncHandler(async (req, res) => {
  const { id, whiteLabelId } = req.user;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  let records =
    (await CTFollowRequestRepository.getRequestsByFollower(
      {
        masterAccount: id,
        whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
        status: { $in: [0] },
      },
      page,
      limit,
      "_id followerAccount masterAccount followerTradingMId masterTradingMId tradingCondition ratio",
    )) || [];
  let result = records?.map((record) => {
    return {
      _id: record?._id,
      masterAccount: record?.masterAccount?._id || null,
      followerAccount: record?.followerAccount?._id || null,
      masterName: record?.masterAccount?.name || null,
      followerName: record?.followerAccount?.name || null,
      followerTradingMId: record?.followerTradingMId || null,
      masterTradingMId: record?.masterTradingMId || null,
      tradingCondition: record?.tradingCondition || null,
      ratio: record?.ratio || null,
    };
  });
  return res.success(
    { requests: result },
    "Self Master Requests fetched successfully",
    200,
  );
});

export const actionOnSelfMasterRequest = asyncHandler(async (req, res) => {
  const { id, whiteLabel, name, email } = req.user;
  const {
    requestId,
    action,
    note = "",
    review = "",
    followerAccountId,
  } = req.body;

  const reqFilter = {
    _id: new mongoose.Types.ObjectId(requestId),
    whiteLabel: whiteLabel,
    status: 0,
  };

  const requestData = await CTFollowRequestRepository.getReqByFilters(
    reqFilter,
    "-__v",
  );

  if (!requestData) {
    return res.error("Request not found!", 404);
  }

  switch (action?.toUpperCase()) {
    case "APPROVE":
      // const request = await CTFollowRequestRepository.approveCTFollowerRequest(
      //   requestId,
      //   whiteLabel,
      //   note,
      //   review
      // );
      const [followerTrData, masterTrData] = await Promise.all([
        tradingAccountRepository.getTrAccByFilter(
          {
            WhiteLabel: whiteLabel,
            Login: requestData?.followerTradingMId,
          },
          "Group GroupId",
        ),
        tradingAccountRepository.getTrAccByFilter(
          {
            WhiteLabel: whiteLabel,
            Login: requestData?.masterTradingMId,
          },
          "Group GroupId",
        ),
      ]);

      if (!followerTrData?.GroupId.equals(masterTrData?.GroupId)) {
        const getLinkedGroups = await forexGroupRepository.getForexGroupById(
          masterTrData.GroupId,
          "LinkedGroupIds LinkedGroups",
        );
        if (!getLinkedGroups || getLinkedGroups?.LinkedGroupIds?.length === 0) {
          CTFollowRequestRepository.invalidateFollowerRequest(
            requestId,
            whiteLabel,
            "Master and Follower have different trading acc groups",
          );
          return res.error("Master & Follower have different account types.");
        }
        let isFollowerGroupLinked = getLinkedGroups?.LinkedGroupIds?.includes(
          followerTrData?.GroupId,
        );
        if (!isFollowerGroupLinked) {
          CTFollowRequestRepository.invalidateFollowerRequest(
            requestId,
            whiteLabel,
            "Master and Follower have different trading acc groups",
          );
          return res.error(
            "Master and followers have different trading acc groups, so request is invalidated",
            500,
          );
        }
      }

      const [request, enableTradingAccount] = await Promise.all([
        CTFollowRequestRepository.approveCTFollowerRequest(
          requestId,
          whiteLabel,
          note,
          review,
        ),
        tradingAccountRepository.updateTradingAccountOnBecomeFollower(
          { WhiteLabel: whiteLabel, Login: followerAccountId },
          true,
        ),
      ]);
      if (enableTradingAccount?.modifiedCount == 0) {
        return res.error("Trading Account Not Enabled!", 404);
      }
      await sendCustomEmail(
        whiteLabel,
        "CT_request_accepted_by_master",
        [email],
        {
          firstName: name || "N/A",
          masterId: request?.masterAccount.toString().slice(-5) || "N/A",
          masterLogin: request?.masterTradingMId || "N/A",
          selfLogin: request?.followerTradingMId || "N/A",
          ctTradeMode: request?.tradingCondition?.toUpperCase() || "N/A",
          value: request?.ratio || "N/A",
        },
      );
      if (request) {
        return res.success([], "Request Approved Successfully", 200);
      }
      return res.error("Request not found or already processed", 404);
    case "REJECT":
      const rejected = await CTFollowRequestRepository.rejectCTFollowerRequest(
        requestId,
        whiteLabel,
        review,
      );
      await sendCustomEmail(
        whiteLabel,
        "CT_request_rejected_by_master",
        [email],
        {
          firstName: name || "N/A",
          masterId: rejected?.masterAccount.toString().slice(-5) || "N/A",
          masterLogin: rejected?.masterTradingMId || "N/A",
          selfLogin: rejected?.followerTradingMId || "N/A",
          ctTradeMode: rejected?.tradingCondition?.toUpperCase() || "N/A",
          value: rejected?.ratio || "N/A",
          rejectReason: rejected?.remark || "N/A",
        },
      );
      if (rejected) {
        return res.success([], "Request Rejected Successfully", 200);
      }
      return res.error("Request not found or already processed", 404);
    default:
      return res.error("Invalid action specified", 400);
  }
});

export const getListOfOwnFollowers = asyncHandler(async (req, res) => {
  const { id, whiteLabelId } = req.user;
  // const page = parseInt(req.query.page) || 1;
  // const limit = parseInt(req.query.limit) || 10;
  // const skip = (page - 1) * limit;
  const { masterLoginId, followerLoginId, fromDate, toDate } = req.body;
  const query = { whiteLabel: new mongoose.Types.ObjectId(whiteLabelId) };
  if (masterLoginId) {
    query.masterLogin = masterLoginId;
  }
  if (fromDate || toDate) {
    query.createdAt = {};
    if (fromDate) {
      query.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      query.createdAt.$lte = new Date(toDate);
    }
  }

  const master = await CTMastersRepository.getFollowersByMasterIdNdFollower({
    masterAccountId: id,
    loginId: masterLoginId,
    whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
  });

  if (!master || !master[0]?.followers) {
    return res.success([], "No followers found for this master", 200);
  }
  // const followers = master[0]?.followers
  const followers = master[0]?.followers.filter(
    (follower) => follower.isHidden === false,
  );
  const followerLogins = followers?.map((follower) => follower.loginId);
  const followerName = followers?.map((follower) => follower?.id?.name);
  const orders = await CtOrdersRepository.fetAllOrders(
    masterLoginId,
    new mongoose.Types.ObjectId(whiteLabelId),
    followerLogins,
    followerName,
  );
  const followerPositionMap = {};
  orders.forEach((item) => {
    const followerLogin = item?._id?.followerLogin;
    const positionId = item?._id?.positionId;
    if (!followerPositionMap[followerLogin]) {
      followerPositionMap[followerLogin] = [];
    }
    followerPositionMap[followerLogin].push(positionId);
  });
  const results = [];
  // for (const followerLogin of Object.keys(followerPositionMap)) {
  //   const positionIds = followerPositionMap[followerLogin];
  //   const profitLoss = await tradeReportRepository.fetchCTOrders(whiteLabel,positionIds,followerLogin) || [];
  //   const followerRule = followers.find((f) => f.loginId === followerLogin);
  //   results.push({
  //     followerLogin,
  //     totalPnL: profitLoss[0] ? profitLoss[0]?.totalPnL : 0,
  //     rules: followerRule ? followerRule?.rules.volumeRule : {},
  //     joindedAt: followerRule ? followerRule?.createdAt : null,
  //   });
  // }
  for (const follower of followers) {
    const followerLogin = follower?.loginId;
    const followerName = follower?.id?.name;
    const positionIds = followerPositionMap[followerLogin] || [];
    let totalPnL = 0;
    if (positionIds.length > 0) {
      const profitLoss =
        (await tradeReportRepository.fetchCTOrders(
          new mongoose.Types.ObjectId(whiteLabelId),
          positionIds,
          followerLogin,
        )) || [];
      totalPnL = profitLoss[0] ? profitLoss[0]?.totalPnL : 0;
    }
    results.push({
      followerLogin,
      followerName,
      totalPnL,
      rules: follower?.rules?.volumeRule || {},
      joindedAt: follower?.createdAt || null,
    });
  }
  // console.log(results);
  return res.success(
    { followerList: results },
    "Followers List Fetched Successfully",
    200,
  );
});

export const getListOfOwnMasterLogins = asyncHandler(async (req, res) => {
  const { id, whiteLabelId } = req.user;

  const list = await tradingAccountRepository.getTradingAccountsOfMaster(
    new mongoose.Types.ObjectId(whiteLabelId),
    id,
  );

  if (!list || list.length === 0) {
    return res.error("No master trading accounts found for this user", 404);
  }

  const result = await Promise.all(
    list.map(async (account) => {
      const followersGroups = await CTMastersRepository.getFollowersByMasterId(
        {
          whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
          loginId: account.Login,
          masterAccountId: account.ClientId,
          status: true,
        },
        "followers",
      );

      const allFollowerLogins = followersGroups.flatMap((group) =>
        group.followers
          .filter((f) => f.status && !f.isHidden)
          .map((f) => f.loginId),
      );

      return {
        masterLoginId: account.Login,
        followersList: allFollowerLogins,
      };
    }),
  );

  return res.success(
    result,
    "Master trading accounts fetched successfully",
    200,
  );
});

export const getCTModuleCount = asyncHandler(async (req, res) => {
  const { id, whiteLabelId } = req.user;
  const [myMasterRequestsCount, myFollowersCount] = await Promise.all([
    CTFollowRequestRepository.countTotalReceivedRequests({
      masterAccount: id,
      whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
      status: 0,
      isHidden: false,
    }),

    CTMastersRepository.countTotalFollowersByMasterId({
      whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
      masterAccountId: id,
      followers: { $elemMatch: { isHidden: false } },
    }),
  ]);
  res.success(
    {
      followersCount: myFollowersCount,
      requestsCount: myMasterRequestsCount,
    },
    "CT Module Counts Fetched Successfully",
    200,
  );
});
