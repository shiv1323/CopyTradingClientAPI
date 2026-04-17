import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import clientDocRepository from "../repositories/clientDocRepository.js";
import clientProfileRepository from "../repositories/clientProfileRepository.js";
import tradingAccountRepository from "../repositories/tradingAccountRepository.js";
import whiteLabelRepository from "../repositories/whiteLabelRepository.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { id,whiteLabel } = req.user;
  const profileInfo = await clientProfileRepository.getClientById(id);

  const whiteLabelData = await whiteLabelRepository.findWhiteLabelByIdSelectedField(whiteLabel,'configDetails.partialQuestionnaire')
  
  const info = {};
  if (profileInfo) {
    info.userMId = profileInfo?._id;
    info.country = profileInfo?.country;
    info.countryCode = profileInfo?.countryCode;
    info.email = profileInfo?.email;
    info.phoneNo = profileInfo?.phoneNo;
    info.address = profileInfo?.address;
    info.name = profileInfo?.name;
    info.tradingAccLimit = profileInfo?.tradingAccLimit;
    info.primarNumber = profileInfo?.phoneNo;
    info.docInfo = {
      address: [],
      identity: [],
    };
    return res.success(info, "Profile Fetched");
  } else {
    return res.error("Failed to Get User Profile");
  }
});

export const getFullBalance = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const balanceObject = {};
  const getWalletBalancePromise = clientProfileRepository.getClientById(
    id,
    "walletBalance"
  );
  const tradingAccBalancePromise = tradingAccountRepository.getAggregate([
    {
      $match: { ClientId: id, ManagerType: "real" },
    },
    {
      $group: {
        _id: null,
        totalEquity: { $sum: "$Equity" },
        totalFreeMargin: { $sum: "$MarginFree" },
      },
    },
  ]);
  const [walletResult, tradingAccBalance] = await Promise.all([
    getWalletBalancePromise,
    tradingAccBalancePromise,
  ]);
  // console.log(walletResult,tradingAccBalance)
  if (!walletResult) {
    return res.error("Failed to fetch Balance");
  } else {
    balanceObject.walletBalance = walletResult?.walletBalance;
    if (tradingAccBalance?.[0]) {
      balanceObject.totalEquity = parseFloat(
        tradingAccBalance?.[0]?.totalEquity?.toFixed(2)
      );
      balanceObject.totalFreeMargin = parseFloat(
        tradingAccBalance?.[0]?.totalFreeMargin?.toFixed(2)
      );
    } else {
      balanceObject.totalEquity = 0.0;
      balanceObject.totalFreeMargin = 0.0;
    }

    return res.success(balanceObject, "Balance Fetched");
  }
});

export const updateSdflg = asyncHandler(async (req, res) => {
  const { id } = req.user;
  clientProfileRepository.updatesbswitch(id, { firstTimeLogin: 0 });
  return res.success(null, "SDF flag updated successfully");
});
