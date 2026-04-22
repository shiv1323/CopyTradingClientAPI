import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import jwt from "jsonwebtoken";
import tradingAccountRepository from "../repositories/tradingAccountRepository.js";
import clientProfileRepository from "../repositories/clientProfileRepository.js";
import clientProfileModel from "../models/clientProfile.model.js";
import whiteLabelRepository from "../repositories/whiteLabelRepository.js";
import { convertUnixTimestampToISO } from "../utils/commonUtils.js";
import { postReqMT5Server } from "../wrapperConfig/mt5WrapperUtils.js";
import {
  encrypt,
  decrypt,
  encryptTextMt5,
  decryptTextMt5,
} from "../utils/authUtils.js";
import { MTAPI_ROUTES } from "../config/mtTerminalConstanats.js";
import forexGroupRepository from "../repositories/forexGroupRepository.js";
import trAccountLimitRepository from "../repositories/trAccountLimitRepository.js";
import { sendCustomEmail } from "../utils/commonUtils.js";

const getGroupName = async (groupId, whiteLabel) => {
  try {
    const options = {
      whiteLabel: new mongoose.Types.ObjectId(whiteLabel),
      _id: new mongoose.Types.ObjectId(groupId),
    };
    const checkGroupName = await forexGroupRepository.findGroupByOptions(
      options,
      "group groupName"
    );
    if (checkGroupName?.length > 0) {
      return {
        name: checkGroupName?.[0]?.group,
        displayName: checkGroupName?.[0]?.groupName,
      };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

const bindTradingAccounts = async (
  tradingAccNo,
  currentUser,
  type = "real"
) => {
  try {
    const tradeAccArray = [
      { user: tradingAccNo, client: currentUser?.mt5Login },
    ];
    //console.log("Inside bind",tradeAccArray)
    if (tradeAccArray.length > 0) {
      const answer = await postReqMT5Server(
        "/api/clients/bindTrAccountToClient",
        tradeAccArray,
        currentUser,
        type
      );
      //console.log(answer)

      if (answer.success === true) {
        const bindedLoginIds = [];
        answer?.data?.map((bindedAcc) => {
          if (bindedAcc?.success === true) {
            bindedLoginIds.push(bindedAcc?.user);
          }
        });
        //console.log(bindedLoginIds)
        if (bindedLoginIds.length > 0) {
          const updateAccs = await tradingAccountRepository.updateManyRecord(
            { login: { $in: bindedLoginIds } },
            { $set: { IsBinded: true } }
          );
        }
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const createTradingAccount = asyncHandler(async (req, res) => {
  try {
    const { id, email, whiteLabel, tradingAccLimit = 3 } = req?.user;
    const { pass, leverage, balance, name, groupId, currency } =
      req?.body;
    const { type = "real" } = req.query;

    const countTradingAcc = await tradingAccountRepository.countRecords({
      clientId: new mongoose.Types.ObjectId(id),
      managerType: type,
    });
    if (countTradingAcc >= tradingAccLimit) {
      return res.error(
        "Trading Accounts Limit Reached! Please contact support OR Request For Increase Limit",
        400
      );
    }
    // const checkGroup = await getGroupName(groupId, whiteLabel);
    let groupName = "";
    // if (!checkGroup?.name) {
    //   return res.error(
    //     `Failed to create trading account: Account Name Not Valid`,
    //     500
    //   );
    // } else {
    //   groupName = checkGroup?.name;
    // }
    const createPayload = {
      clientId: id,
      email,
      name,
      pass: encryptTextMt5(decrypt(pass)),
      leverage,
      groupName,
      groupAccountType: "Test Dev\\demo Elite Dev 2",
      accountType: 1,
      currency: currency || "USD",
      whiteLabel: whiteLabel,
      groupId,
    };

    const createReq = await postReqMT5Server(
      MTAPI_ROUTES.CREATE_ACCOUNT,
      createPayload,
      req.user,
      type
    );
    if (!createReq?.success) {
      return res.error(
        `Failed to create trading account: ${createReq?.message || "Unknown error"}`,
        500
      );
    }
    console.log(createReq)
    if (!createReq?.success) {
      try {
        await tradingAccountRepository.updateTradingAccountByTAccountId(
          createReq?.data?.answer?.login
        );
      } catch (e) {
        console.log("error updating on trading account", e);
      }
   

    try {
      const bindTAccount = await bindTradingAccounts(
        createReq?.data?.answer?.login,
        req?.user
      );
    } catch (error) {
      console.log("error in binding account", error);
    }

    sendCustomEmail(whiteLabel, "trading_account_created", [email], {
      type: "real",
      firstName: req?.user?.name || "User",
      login: createReq?.data?.answer?.login,
      tradingAccountPassword: decrypt(pass),
      investorPassword: "2Ar#pqkj",
      server: createReq?.data?.answer?.ServerName,
    });
    return res.success({}, "Trading account created successfully!", 200);
  }
  } catch (error) {
    console.log(error);
  }
});

export const getTradingAccount = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const getClient =
    await tradingAccountRepository.getTradingAccountByFieldWithCT(id);
  if (getClient.length > 0) {
    const liveAccounts = [];
    getClient.forEach((taccounts) => {
      console.log(taccounts);
      let requestStatus =
        taccounts?.requestStatus?.status === "APPROVED" ||
          taccounts?.requestStatus?.status === "PENDING"
          ? true
          : false;
      const account = {
        id: taccounts._id,
        accountId: "#" + taccounts.login,
        name: taccounts.name,
        leverage: taccounts.leverage,
        balance: taccounts.balance,
        currency: taccounts.currency,
        status: taccounts.status,
        equity: taccounts.equity,
        credit: taccounts.credit || 0,
        unrealizedPL: parseFloat(
          (
            taccounts.equity -
            taccounts.balance -
            (taccounts.credit || 0)
          ).toFixed(2)
        ),
        freeMargin: taccounts?.marginFree,
        createdAt: convertUnixTimestampToISO(taccounts.registration),
        groupName: taccounts?.group,
        accountType: taccounts.managerType,
        serverName: taccounts?.serverName || "ZedCapital-Demo",
        isMasterAccount: taccounts?.isMasterAccount || false,
        requestBasedMasterMode:
          taccounts?.whiteLabel?.configDetails?.requestBasedCTMaster,
        requestStatus: requestStatus,
        displayName: taccounts?.group,
      };
      liveAccounts.push(account);
    });
    res.success(
      {
        LiveAccounts: liveAccounts,
      },
      "Trading Accounts List",
      200
    );
  } else {
    res.success({}, "No Records found!", 200);
  }
});

export const setBalance = asyncHandler(async (req, res) => {
  const { login, sum } = req?.body;
  const { type = "real" } = req?.query;
  const tradingAccData = await tradingAccountRepository.getAccByOptions(
    {
      ClientId: req.user?.id,
      Login: login,
      AccountType: "DEMO",
    },
    "Login"
  );

  if (tradingAccData.length != 0) {
    let body = {
      login,
      sum,
    };
    //console.log(type)
    const createReq = await postReqMT5Server(
      "/api/users/depositeSum/login",
      body,
      req.user,
      type
    );
    //console.log(createReq);

    if (createReq?.success) {
      const balanceBody = {
        accountId: login,
        flag: 0,
      };

      const getBalanceReq = await postReqMT5Server(
        "/api/users/getBalancebyLogin",
        balanceBody,
        req.user,
        type
      );
      console.log("getBalanceReq", getBalanceReq);

      if (getBalanceReq?.success) {
        const newBalance = getBalanceReq?.data?.answer?.balance?.user;
        const updatedAccount =
          await tradingAccountRepository.updateAccountBalance(
            login,
            newBalance
          );
        res.status(200).json({
          success: true,
          message: "Deposit processed successfully",
          data: createReq.data,
        });
      } else {
        res.status(200).json({
          success: true,
          message: "Failed to retrieve balance",
          error: getBalanceReq?.message || "Unknown error",
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: "MT request Failed: " + createReq.message,
      });
    }
  } else {
    return res.error("Trading account not found!");
  }
});

export const archiveAccount = asyncHandler(async (req, res) => {
  const { login } = req?.body;
  const { type = "real" } = req?.query;
  const getTradingAcc = await tradingAccountRepository.getAccByOptions({
    ClientId: req.user?.id,
    Login: login,
  });
  if (getTradingAcc?.length > 0) {
    if (getTradingAcc?.[0]?.Balance > 0 && type === "real") {
      return res.error(
        `Failed to archive trading account: Account Have Balance`,
        500
      );
    } else if (getTradingAcc?.[0]?.Margin != 0) {
      return res.error(
        `Failed to archive trading account: Open Orders in Trading Account`,
        500
      );
    }
  } else {
    return res.error(
      `Failed to archive trading account: No Such Trading Account Found`,
      404
    );
  }

  const archiveReq = await postReqMT5Server(
    "/api/users/moveAccounttoArchive",
    { login },
    req.user,
    type
  );
  if (archiveReq?.success === false) {
    return res.error(
      `Failed to archive trading account: ${archiveReq?.message || "Unknown error"}`,
      500
    );
  }
  const updateResult =
    await tradingAccountRepository.updateTradingAccountByField("Login", login, {
      AccountType: "ARCHIVED",
    });

  if (archiveReq?.success && updateResult) {
    return res.success(
      "Account moved to archive and marked as archived in the database.",
      200
    );
  }

  if (!archiveReq?.success) {
    // console.log(archiveReq);
    return res.error(
      `Failed to archive trading account: ${archiveReq?.message || "Unknown error"}`,
      500
    );
  }

  if (!updateResult) {
    return res.error(
      "Account archived on MT5, but failed to update the database.",
      500
    );
  }

  return res.error("Unexpected error occurred during account archiving.", 500);
});

export const restoreArchivedAccount = asyncHandler(async (req, res) => {
  const { id } = req.user;
  // console.log(id);
  const { login } = req.body;
  const { type = "real" } = req?.query;
  // const [restoreReq,updateResult] = await Promise.all([
  const getPassword = await tradingAccountRepository.getAccByOptions(
    {
      Login: login,
      ClientId: id,
    },
    "Password"
  );

  // ? To check if the trading acc exists or not
  if (getPassword.length != 0) {
    const password = getPassword?.[0]?.Password;
    const restoreReq = await postReqMT5Server(
      MTAPI_ROUTES.RESTORE_ARCHIVE_ACCOUNTS,
      { login: login, password: password },
      req.user,
      type
    );
    // console.log("restoreReq",restoreReq);

    if (restoreReq.success) {
      //console.log("here");
      // console.log(object);
      const findTrAccRecord = {
        Login: login,
        ClientId: id,
      };
      // AccountType
      const updateResult =
        await tradingAccountRepository.updateTrAccountByFields(
          findTrAccRecord,
          { AccountType: type === "real" ? "REAL" : "DEMO" }
        );
      //console.log(updateResult);
      if (restoreReq?.success && updateResult) {
        return res.success("Account Restored!", 200);
      }
    }
  } else {
    return res.error("Trading account not found!");
  }
  return res.error("Error Occurred While Restoring Account", 500);
});

export const initiateMT5PasswordChange = asyncHandler(async (req, res) => {
  const { accountType, newPassword, loginId, passwordType } = req.body;
  const email = req.user.email;
  const { type = "real" } = req.query;
  if (!email) return res.error("Email not found", 400);
  const decryptedNewPassword = decrypt(newPassword);
  const client = await clientProfileRepository.findClientByEmail(email);
  if (!client) return res.error("User not found", 400);
  const tradingAccData = await tradingAccountRepository.getAccByOptions(
    { clientId: req.user?.id, login: loginId },
    "login"
  );
  // 🔐 For REAL accounts — send OTP & return token
  if (type === "real" || accountType === "Real") {
    const otpResult = await client.generateAndSendOTP();
    const tempTokenSecret = process.env.TEMP_TOKEN_SECRET || process.env.JWT_SECRET;
    if (!tempTokenSecret) {
      return res.error(
        "TEMP_TOKEN_SECRET (or JWT_SECRET fallback) is missing from environment",
        500
      );
    }
    const tempToken = jwt.sign(
      {
        email: encrypt(email),
        newPassword: encrypt(decryptedNewPassword),
        accountType,
        loginId,
        type: "mt5_password_change",
        passwordType: passwordType.toLowerCase(), // ✅ fixed spelling
      },
      tempTokenSecret,
      { expiresIn: "15m" }
    );

    return res.customSuccess(
      {
        success: true,
        otpSent: otpResult.status,
        tempToken,
        message: `OTP sent to your email for MT5 password change verification.`,
      },
      200
    );
  }
  // 🧪 For DEMO account — change password directly
  if (tradingAccData.length === 0) {
    return res.error("Trading account not found!", 404);
  }
  const mt5PasswordChangeBody = {
    Login: loginId,
    Type: passwordType.toLowerCase(), // ✅ use correct value
    Password: decryptedNewPassword,
  };
  const changePasswordReq = await postReqMT5Server(
    "/api/users/changePassword",
    mt5PasswordChangeBody,
    req.user,
    "demo"
  );
  if (changePasswordReq?.success) {
    sendCustomEmail(
      req.user.whiteLabel,
      "trading_account_password_changed",
      [email],
      {
        login: loginId,
        passwordType: passwordType === "investor" ? "Investor" : "Master",
        type: "demo",
        firstName: req.user.name || "User",
        tradingAccountNewPassword: decryptedNewPassword,
      }
    );

    return res.customSuccess(
      {
        success: true,
        message: "MT5 demo account password changed successfully",
        data: changePasswordReq.data,
      },
      200
    );
  } else {
    return res.error(
      `Failed to change MT5 demo account password due to error: ${changePasswordReq?.message}`,
      500
    );
  }
});

export const verifyAndChangeMT5Password = asyncHandler(async (req, res) => {
  const { otp, tempToken } = req.body;
  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.TEMP_TOKEN_SECRET);
  } catch (error) {
    return res.error("Invalid or expired token", 400);
  }
  //console.log(decoded);

  if (
    decoded.type !== "mt5_password_change" ||
    !decoded.email ||
    !decoded.newPassword ||
    !decoded.accountType ||
    !decoded.loginId ||
    !decoded.passwordType
  ) {
    return res.error("Invalid token data", 400);
  }

  const decryptedEmail = decrypt(decoded.email);
  const client =
    await clientProfileRepository.findClientByEmail(decryptedEmail);
  if (!client) {
    return res.error("User not found", 404);
  }

  if (!client.validateOTP(otp)) {
    return res.error("Invalid or expired OTP", 400);
  }

  const decryptedNewPassword = decrypt(decoded.newPassword);
  const mt5PasswordChangeBody = {
    Login: decoded.loginId,
    Type: decoded.passwordType,
    Password: decryptedNewPassword,
  };

  const changePasswordReq = await postReqMT5Server(
    "/api/users/changePassword",
    mt5PasswordChangeBody,
    req.user
  );
  console.log(changePasswordReq, 'changePasswordReq');

  if (changePasswordReq?.success) {
    try {
      //console.log("🔍 Attempting to send email...");
      sendCustomEmail(
        req.user?.whiteLabel,
        "trading_account_password_changed",
        [req?.user?.email],
        {
          login: decoded?.loginId,
          passwordType:
            decoded?.passwordType === "investor" ? "Investor" : "Master",
          type: "real",
          firstName: req?.user?.name || "User",
          tradingAccountNewPassword: decryptedNewPassword,
        }
      );
      console.log("✅ Deposit successful email sent successfully.");
    } catch (error) {
      console.error("❌ Failed to send email:", error.message);
    }
    return res.customSuccess(
      {
        success: true,
        message: "MT5 account password changed successfully",
        data: changePasswordReq.data,
      },
      200
    );
  } else {
    return res.error(
      `Failed to change MT5 account password due to error: ${changePasswordReq?.message}`,
      500
    );
  }
});

export function processTAccountData(item) {
  const safeParseFloat = (value) =>
    value !== null && value !== undefined && !isNaN(value)
      ? parseFloat(value)
      : null;
  const safeParseNumber = (value) =>
    value !== null && value !== undefined && !isNaN(value)
      ? Number(value)
      : null;

  return {
    // Login: String(item.Login),
    currencyDigits: safeParseNumber(item.CurrencyDigits),
    balance: safeParseFloat(item.Balance),
    credit: safeParseFloat(item.Credit),
    margin: safeParseFloat(item.Margin),
    marginFree: safeParseFloat(item.MarginFree),
    marginLevel: safeParseFloat(item.MarginLevel),
    marginLeverage: safeParseNumber(item.MarginLeverage),
    marginInitial: safeParseFloat(item.MarginInitial),
    marginMaintenance: safeParseFloat(item.MarginMaintenance),
    profit: safeParseFloat(item.Profit),
    storage: safeParseFloat(item.Storage),
    floating: safeParseFloat(item.Floating),
    equity: safeParseFloat(item.Equity),
    soActivation: safeParseNumber(item.SOActivation),
    sotime: safeParseNumber(item.SOTime),
    soLevel: safeParseFloat(item.SOLevel),
    soEquity: safeParseFloat(item.SOEquity),
    soMargin: safeParseFloat(item.SOMargin),
    blockedCommission: safeParseFloat(item.BlockedCommission),
    blockedProfit: safeParseFloat(item.BlockedProfit),
    assets: safeParseFloat(item.Assets),
    liabilities: safeParseFloat(item.Liabilities),
  };
}

export const getAndUpdateTAccountInfo = asyncHandler(async (req, res) => {
  const { loginId } = req?.query;

  const tradingAccData = await tradingAccountRepository.getAccByOptions(
    {
      clientId: req.user?.id,
      login: loginId,
    },
    "login"
  );

  if (tradingAccData.length != 0) {
    const { type = "real" } = req?.query;
    const createPayload = { LoginId: loginId };
    const createReq = await postReqMT5Server(
      MTAPI_ROUTES.GET_T_ACCOUNT_INFO,
      createPayload,
      req.user,
      type
    );
    if (!createReq?.success) {
      return res.error(
        `Failed to create trading account: ${createReq?.message || "Unknown error"}`,
        500
      );
    }
    const updateObj = processTAccountData(createReq.data);
    const saveToDb =
      await tradingAccountRepository.updateTradingAccountByTAccountId(
        createReq?.data?.Login,
        updateObj
      );
    // console.log(updateObj);
    // const actualLeverage = MarginInitial > 0 ? (MarginInitial / Equity) * MarginLeverage : 0;
    const response = {
      actualLeverage: parseFloat(updateObj?.marginInitial?.toFixed(2)),
      maximumLeverage: `1:${updateObj?.marginLeverage}`, // Fixed value as a number
      freeMargin: parseFloat(updateObj?.marginFree?.toFixed(2)), // Free margin as a float
      unrealizedPL: parseFloat(updateObj?.floating?.toFixed(2)),
    };
    if (!saveToDb) {
      return res.success(
        response,
        "DB Record Not Found! Please Insert One",
        200
      );
    }
    // console.log(updateObj);
    // console.log(response);
    return res.success(response, "TAccount Info", 200);
  } else {
    return res.error("Trading account not found!");
  }
});

export const createClient = asyncHandler(async (req, res) => {
  const { id } = req?.user;
  const client = await clientProfileRepository.getClientById(id);
  if (!client) {
    return res.error("Client not found", 404);
  }

  if (!client.KYCVerification.kycVerified) {
    return res.error("KYC not verified", 400);
  }

  if (!client.KYCVerification.questionnaireCompleted) {
    return res.error("Questionnaire not completed", 400);
  }

  const { firstName, lastName } = client.KYCVerification.questionnaire;

  const whiteLabel = await whiteLabelRepository.findWhiteLabelById(
    client.whiteLabel
  );
  if (!whiteLabel) {
    return res.error("White label not found", 404);
  }
  const decryptedManager = decrypt(whiteLabel.manager);
  const manager = decryptedManager.manager.login;
  const createPayload = {
    PersonName: firstName,
    PersonLastName: lastName,
    ClientType: req?.body?.ClientType || "INDIVIDUAL",
    ClientStatus: req?.body?.ClientStatus || "APPROVED",
    AssignedManager: req?.body?.AssignedManager || manager,
    ClientOrigin: "MANUAL",
    PersonEmployment: req?.body?.PersonEmployment || "NONE",
  };

  const createReq = await postReqMT5Server(
    MTAPI_ROUTES.CREATE_CLIENT,
    createPayload,
    req.user
  );

  if (!createReq?.success) {
    return res.error(
      `Failed to create client: ${createReq?.message || "Unknown error"}`,
      500
    );
  }

  res.success(createReq.data, "Client created successfully", 200);
});

export const updateTrAccountLeverage = asyncHandler(async (req, res) => {
  const { tAccountNo, leverage } = req.body;
  let { id } = req.user;
  const { type = "real" } = req?.query;
  id = new mongoose.Types.ObjectId(id);
  const checkTradingAcc = await tradingAccountRepository.getAccByOptions({
    clientId: id,
    login: tAccountNo,
  });
  if (checkTradingAcc.length < 1) {
    return res.error("Trading Account Number Not Valid", 400);
  }
  const updLeverage = await postReqMT5Server(
    "/api/users/updateLeverage",
    {
      loginId: tAccountNo,
      leverage,
    },
    req.user,
    type
  );
  if (updLeverage.success) {
    //console.log(updLeverage)
    const updateDB =
      await tradingAccountRepository.updateTradingAccountByTAccountId(
        tAccountNo,
        { leverage: leverage }
      );
    if (!updateDB) {
      return res.error("Failed to Update Trading Acc");
    }
    return res.success("", "Leverage Updated");
  } else {
    return res.error("Failed to Update Trading Acc : Wrapper Fail");
  }
});

export const getTrAccountLimitForClient = asyncHandler(async (req, res) => {
  const { id } = req?.user;
  const accountLimit = await clientProfileRepository.getClientById(
    id,
    "tradingAccLimit -_id"
  );
  if (!accountLimit) {
    return res.error("Account limit not found", 404);
  }
  res.success(accountLimit, "Account limit found", 200);
});

export const checkRequest = asyncHandler(async (req, res) => {
  const { id, whiteLabel } = req.user;
  const { filter } = req.query;
  const options = {
    clientId: new mongoose.Types.ObjectId(id),
    whiteLabel: new mongoose.Types.ObjectId(whiteLabel),
  };
  if (filter) {
    if (filter != "All") {
      options.status =
        filter === "Approved"
          ? "Approved"
          : filter === "Rejected"
            ? "Rejected"
            : "Pending";
    }
  }
  const getRequest = await trAccountLimitRepository.getTransByOptions(
    options,
    "",
    "createdAt"
  );
  return res.success(
    getRequest,
    getRequest.length > 0 ? "Request fetched" : "No Request Found"
  );
});

export const raiseIncreaseRequest = asyncHandler(async (req, res) => {
  const { id, whiteLabel, tradingAccLimit, } = req.user;
  const { increaseLimit, reason } = req.body;
  if (parseInt(tradingAccLimit) >= parseInt(increaseLimit)) {
    return res.error(
      "Requested Limit must be greater than Approved Limit",
      400
    );
  }
  const checkRequest = await trAccountLimitRepository.countTransactions({
    clientId: new mongoose.Types.ObjectId(id),
    status: "Pending",
  });
  if (checkRequest && checkRequest > 0) {
    return res.error("Request Already Raised, Wait for it to resolve", 400);
  }
  const createObject = {
    clientId: new mongoose.Types.ObjectId(id),
    whiteLabel: new mongoose.Types.ObjectId(whiteLabel),
    requestedLimit: increaseLimit,
    reason,
    status: "Pending",
  };
  const createReq =
    trAccountLimitRepository.createTradingAccountLimit(createObject);
  if (createReq) {
    return res.success([], "Request Raised");
  } else {
    return res.error("Failed to Raise Request");
  }
});

export const renameTradingAcc = asyncHandler(async (req, res) => {
  const { id, whiteLabel } = req.user;
  const { loginId, newAccName } = req.body;
  const { type = "real" } = req?.query;
  const updateName = await postReqMT5Server(
    MTAPI_ROUTES.RENAME_TRADING_ACCOUNT,
    { loginId: loginId, name: newAccName },
    req.user,
    type
  );
  if (!updateName.success) {
    return res.error("ERROR OCCURRED WHILE RENAMING ACCOUNT MT-SERVER", 400);
  }
  let filter = {
    whiteLabel: whiteLabel,
    login: loginId,
  };
  const updateDb = await tradingAccountRepository.updateTrAccountByFields(
    filter,
    { name: newAccName, firstName: newAccName }
  );
  if (updateDb.acknowledged) {
    return res.success([], "Account Name Updated");
  }
  return res.error("Error Occurred While Updating Name");
});
