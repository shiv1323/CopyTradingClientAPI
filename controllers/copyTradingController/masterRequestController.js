import { asyncHandler } from "../../middlewares/asyncHandler.js";
import CtMasterRequestRepository from "../../repositories/ctMasterRequestRepository.js";
import MasterRepository from "../../repositories/ctMastersRepository.js";
import CTFollowRequestRepository from "../../repositories/copyTradingRequestsRepository.js";
import { sendCustomEmail } from "../../utils/commonUtils.js";
import tradingAccountRepository from "../../repositories/tradingAccountRepository.js";
import whiteLabelRepository from "../../repositories/whiteLabelRepository.js";
import { postReqMT5Server } from "../../wrapperConfig/mt5WrapperUtils.js";
import { MTAPI_ROUTES } from "../../config/mtTerminalConstanats.js";

export const raiseRequestCtMaster = asyncHandler(async (req, res) => {
  const { name, id, whiteLabel, email } = req.user;
  const { masterAccountId } = req.query;

  const newObj = {
    masterLogin: String(masterAccountId) || null,
    whiteLabel: whiteLabel || null,
    masterId: id || null,
    masterName: name || null,
    requestedAt: new Date(),
    completedOn: null,
    type: "mark",
  };

  try {
    const [existingRelation, existingRequests, sendingEmailInfo] =
      await Promise.all([
        await MasterRepository.getAlreadyFollower(
          id,
          masterAccountId,
          whiteLabel
        ),
        await CTFollowRequestRepository.doesRequestExist({
          followerTradingMId: masterAccountId,
          status: { $in: [0, 1] },
          followerAccount: id,
          whiteLabel: whiteLabel,
        }),
        await tradingAccountRepository.getTradingAccountByField({
          Login: masterAccountId,
          ClientId: id,
          WhiteLabel: whiteLabel,
        }),
      ]);
    if (existingRelation) {
      return res.error(
        "You cannot raise request because this trading account is already a follower of the master.",
        400
      );
    }
    if (existingRequests) {
      return res.error(
        "Already Copy-Master Request Found, Create A New Account To Become A Master!"
      );
    }
    try {
      const [masterRequest, sendRequestEmail] = await Promise.all([
        CtMasterRequestRepository.create(newObj),
        sendCustomEmail(
          whiteLabel,
          "copy_trading_master_request_raised",
          [email],
          {
            firstName: name || "N/A",
            login: masterAccountId || "N/A",
            type: sendingEmailInfo[0]?.Group || "N/A",
            nickname: sendingEmailInfo[0]?.Name || "N/A",
          }
        ),
      ]);
      console.log("✅ trading account created email sent successfully.");
      return res.success({}, "Request Raised For Becoming Master!", 201);
    } catch (error) {
      throw error;
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.error("A request is already pending for this user.");
    }
    throw error;
  }
});

const callOffTheMasterRequest = async (id, whiteLabel, masterAccountId) => {
  try {
    const newObj = {
      masterLogin: String(masterAccountId) || null,
      whiteLabel: whiteLabel || null,
      masterId: id || null,
      status: "CANCELATION",
      requestedAt: new Date(),
      completedOn: null,
      type: "unmark",
    };
    const checkRequestExistsAlready =
      await CtMasterRequestRepository.create(newObj);
    return {
      status: true,
      message: "Request Raised Successfully",
    };
  } catch (error) {
    console.log("Error in callOffTheMaster", error);
    if (error.code === 11000) {
      return {
        status: false,
        message: "A request is already pending for this user.",
      };
    }
  }
};

export const unMarkasMasterRequest = asyncHandler(async (req, res) => {
  const { id, whiteLabel } = req.user;
  const { masterAccountId } = req.query;
  const answer = await postReqMT5Server(
    MTAPI_ROUTES.GET_POSITION_INFO,
    { login: masterAccountId },
    req.user,
    "real"
  );
  if (answer.data.answer.length > 0) {
    return res.error(
      `Account:${masterAccountId} has open order, Ensure all orders are closed to perform this operation!`,
      400
    );
  }
  const requestType = await whiteLabelRepository.findWhiteLabelByIdSelected(
    whiteLabel,
    "configDetails.requestBasedCTMaster"
  );
  switch (requestType?.configDetails?.requestBasedCTMaster) {
    case true: {
      const raiseRequestToRemoveMaster = await callOffTheMasterRequest(
        id,
        whiteLabel,
        masterAccountId
      );
      if (raiseRequestToRemoveMaster.status) {
        return res.success({}, raiseRequestToRemoveMaster.message, 201);
      } else {
        return res.error(raiseRequestToRemoveMaster.message, 400);
      }
      break;
    }
    case false: {
      const removeAsMaster = await Promise.all([
        CtMasterRequestRepository.removeAsMaster(
          id,
          whiteLabel,
          masterAccountId
        ),
        tradingAccountRepository.updateMasterTradingAccount(
          whiteLabel,
          id,
          masterAccountId,
          false
        ),
      ]);
      return res.success({}, "Removed As Master Successfully", 201);
    }
  }
});
