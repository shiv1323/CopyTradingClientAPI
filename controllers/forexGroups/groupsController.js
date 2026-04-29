import mongoose from "mongoose";
import { MTAPI_ROUTES } from "../../config/mtTerminalConstanats.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import forexGroupRepository from "../../repositories/forexGroupRepository.js";
import tradingAccountRepository from "../../repositories/tradingAccountRepository.js";
import {
  getReqMT5Server,
  postReqMT5Server,
} from "../../wrapperConfig/mt5WrapperUtils.js";
import userRepository from "../../repositories/userRepository.js";
import forexGroupMapping from "../../repositories/forexGroupMapping.js";
import CtMasterRequestRepository from "../../repositories/ctMasterRequestRepository.js";

export const getGroupsConfigForWhiteLevels = asyncHandler(async (req, res) => {
  const { groupCount } = req.body;
  const { whiteLabel } = req.user;
  const getGroupsInfo = await postReqMT5Server(
    MTAPI_ROUTES.GET_GROUP_INFO,
    { groupCount: 2 },
    req.user,
  );
  //   console.log(getGroupsInfo);
  if (getGroupsInfo.success != true) {
    return res.error("Error Occured While Getting Groups", 500);
  }
  const saveGroups = await Promise.all(
    getGroupsInfo.data?.answer?.map((grp) => {
      grp.WhiteLabel = new mongoose.Types.ObjectId(whiteLabel);
      forexGroupRepository.createGroup(grp);
    }),
  );
  if (saveGroups.length < 1) {
    return res.error("Error Occurred While Saving Group.", 500);
  }
  return res.success(
    { Groups: saveGroups },
    "Groups Created Successfully.",
    201,
  );
});

export const getGroups = asyncHandler(async (req, res) => {
  const { groupType, roleType } = req.query;
  // console.log(groupType)
  
  let { whiteLabelId, userId, id } = req.user;
  if(!roleType){
    return res.error("Role type is required", 400);
  };
  const whiteLabel = new mongoose.Types.ObjectId(whiteLabelId);

  let options = {
    whiteLabel: whiteLabel,
    status: true,
  };

  let Groups = [];
  let finalRoleType = roleType?.toLowerCase() || "master";
  if(finalRoleType === "master"){
    if(groupType?.toLowerCase() === "demo"){
      options.managerType = "demo";
    } else {
    options.managerType = "real";
    }
  } else if(finalRoleType === "follower"){
    if(!userId && !id){
      return res.error("Master User Id is required for follower role type", 400);
    }
    // const masterGroupMapping = await CtMasterRequestRepository.findApprovedMasterByLoginAndGroup(masterLogin, whiteLabel);
    const masterGroupMapping = await tradingAccountRepository.getGroupsFromTrAccount(
        { 
          // whiteLabel: whiteLabel, 
          clientId: id, isMasterAccount: true },
        "groupId"
      );

    if(!masterGroupMapping || masterGroupMapping.length === 0){
      return res.error("No approved master found with the provided login and white label", 400);
    }
    return res.success({ Data: masterGroupMapping }, "Groups Fetched for follower", 200);
  };

  // if (adminId) {
  //   const userData = await userRepository.getUserByFilter(
  //     {
  //       _id: adminId,
  //       whiteLabel,
  //     },
  //     "userId role",
  //   );

  //   if (!userData) {
  //     return res.error("Invalid Oversee user");
  //   }

  //   if (userData?.role.roleName === "Administrator") {
  //     if (groupType?.toLowerCase() === "demo") {
  //       options.managerType = "demo";
  //       options.isDefault = true;
  //     } else {
  //       options.managerType = "real";
  //       options.isDefault = true;
  //     }
  //   } 
  // } else {
  //   if (groupType?.toLowerCase() === "demo") {
  //     options.managerType = "demo";
  //     options.isDefault = true;
  //   } else {
  //     options.managerType = "real";
  //     options.isDefault = true;
  //   }
  // }
  
  Groups = await forexGroupRepository.findGroupByOptions(options);
  if (Groups.length < 1) {
    return res.error("No Groups Found", 400);
  }
  let data = [];
  Groups.map((group) => {
    let temp = {};
    temp.GroupId = group._id;
    temp.DisplayName = group.groupName;
    temp.GroupName = group.group;
    temp.MinimumDeposit = group.minimumDepositeLimit;
    temp.spread = group?.spread;
    temp.commission = group?.commission;
    temp.isPopular = group?.isPopular;
    temp.description = group?.description;
    if (group.commissions?.length > 0) {
      temp.Commissions = {
        AvgComm: 0,
        CommArray: [],
      };
      let avgCom = 0;
      group.commissions.map((object) => {
        avgCom += parseFloat(object?.ChargeMode);
        const temp1 = {};
        temp1.Name = object?.Name;
        temp1.Comm = parseFloat(object?.ChargeMode);
        temp.Commissions.CommArray.push(temp1);
      });
      avgCom = avgCom / group?.commissions?.length;
      temp.Commissions.AvgComm = avgCom;
    } else {
      temp.Commissions = {
        AvgComm: 0,
        CommArray: [],
      };
    }
    data.push(temp);
  });
  return res.success({ Groups: data }, "Groups Fetched", 200);
});
