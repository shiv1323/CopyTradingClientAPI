import { asyncHandler } from "../middlewares/asyncHandler.js";
import clientProfileRepository from "../repositories/clientProfileRepository.js";
import tradingAccountRepository from "../repositories/tradingAccountRepository.js";


export const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const profileInfo = await clientProfileRepository.getClientById(id);

  const info = {};
  if (profileInfo) {
    info.userMId = profileInfo?._id;
    info.country = profileInfo?.country;
    info.countryCode = profileInfo?.countryCode;
    info.email = profileInfo?.email;
    info.phoneNo = profileInfo?.phoneNo;
    info.name = profileInfo?.name;
    info.tradingAccLimit = profileInfo?.tradingAccLimit;
    return res.success(info, "Profile Fetched");
  } else {
    return res.error("Failed to Get User Profile");
  }
});

export const getFullBalance = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const balanceObject = {};

  const tradingAccBalance =  await tradingAccountRepository.getAggregate([
    {
      $match: { clientId: id, managerType: "real" },
    },
    {
      $group: {
        _id: null,
        totalEquity: { $sum: "$equity" },
        totalFreeMargin: { $sum: "$marginFree" },
      },
    },
  ]);
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
  
});

export const updateSdflg = asyncHandler(async (req, res) => {
  const { id } = req.user;
  await clientProfileRepository.updatesbswitch(id, { firstTimeLogin: 0 });
  return res.success(null, "SDF flag updated successfully");
});
