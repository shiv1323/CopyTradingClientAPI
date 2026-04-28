import mongoose from "mongoose";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import ctTradeExecutionLogRepository from "../../repositories/ctTradeExecutionLogRepository.js";
import CtMasterRepository from "../../repositories/ctMastersRepository.js";

export const getTradeExecutionLogs = asyncHandler(async (req, res) => {
  const { id, whiteLabelId } = req.user;
  const {
    from,
    to,
    masterMid,
    followerMid,
    masterAccount,
    followerAccount,
    status,
    type,
    page = 1,
    stage,
    limit = 50,
    sortBy = "createdAt",
    order = "desc",
    orderType,
    search,
  } = req.query;
  const filter = {
    subscriberClientId: id,
    whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
  };
  if (masterAccount) {
    filter.master = masterAccount;
    filter.masterClientId = new mongoose.Types.ObjectId(masterMid);
  }
  if (followerAccount) {
    filter.subscriber = followerAccount;
    filter.subscriberClientId = new mongoose.Types.ObjectId(followerMid);
  }
  if (status) {
    filter.finalStatus = status.toUpperCase();
  }
  if (orderType) {
    filter["stages.inputs.orderType"] = orderType.toUpperCase();
  }
  if (type) {
    filter.type = type.toUpperCase();
  }
  if (stage) {
    filter["stages.stage"] = stage.toUpperCase();
  }
  if (status) {
    if (status.toUpperCase() === "FAILED") {
      filter["finalStatus"] = {
        $in: [
          "FAILED_VALIDATION",
          "FAILED_VOLUME",
          "FAILED_MARGIN",
          "FAILED_RUNTIME",
        ],
      };
    } else {
      filter["finalStatus"] = "SUCCESS";
    }
  }
  const fromDate = from
    ? new Date(from)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();
  filter.startedAt = { $gte: fromDate, $lte: toDate };
  const sortOrder = order.toLowerCase() === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  const skip = (Number(page) - 1) * Number(limit);
  //   console.log({ filter, sort, skip, limit: Number(limit) });
  const [logs, total] = await Promise.all([
    ctTradeExecutionLogRepository.searchQuery(filter, search, {
      sort,
      skip,
      limit,
    }),
    ctTradeExecutionLogRepository.countDocuments(filter),
  ]);
  //   console.log({ page: Number(page), limit: Number(limit), total, logs });
  res.success(
    {
      page: Number(page),
      limit: Number(limit),
      total,
      logs,
    },
    "Retrieved Logs",
    200
  );
});

export const executionTradeLogDropDowns = asyncHandler(async (req, res) => {
  const { id, whiteLabelId } = req.user;
  const filter = {
    "followers.id": new mongoose.Types.ObjectId(id),
    whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
  };
  const fetchSelfAllMastersAndFollowers = await CtMasterRepository.findAllDropDowns(filter);
  if (!fetchSelfAllMastersAndFollowers.length) {
    return res.success({ data: [] }, "Fetched", 200);
  }
  const result = fetchSelfAllMastersAndFollowers.map((m) => ({
    masterId: m.loginId,
    masterMId: m.masterAccountId,
    selfFollowerId: m.followers
      .filter((f) => f.id.toString() === id.toString())
      .map((f) => {
        return { followerOrigin: f.loginId, followerMId: f.id };
      }),
  }));
  res.success({ list: result }, "Fetched", 200);
});
