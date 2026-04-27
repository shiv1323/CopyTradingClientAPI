import mongoose from "mongoose";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import clientProfileRepository from "../../repositories/clientProfileRepository.js";
import { getUTCTime } from "../../utils/commonUtils.js";
import clientAccountTransactionHistoryRepository from "../../repositories/clientAccountTransactionHistoryRepository.js";
import { processTransaction } from "./clientFundServices.js";
import tradingAccountRepository from "../../repositories/tradingAccountRepository.js";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import paymentGetwayRepository from "../../repositories/paymentGetwayRepository.js";
import withdrawlRequestsRepository from "../../repositories/withdrawlRequestsRepository.js";
import forexGroupRepository from "../../repositories/forexGroupRepository.js";
import WithdrawalCurrencyRepository from "../../repositories/WithdrawalCurrencyRepository.js";
import paymentCurrencyRepository from "../../repositories/paymentCurrencyRepository.js";

export function createTransactionObject(body) {
  const {
    parentTransactionId,
    externalReferenceId,
    transactionId,
    whiteLabel,
    accountType,
    clientId,
    fromAccount,
    toAccount,
    externalDestination,
    amount,
    transactionType,
    review,
    status,
    previousBal,
    currentBal,
    paymentStatus,
    completedAt,
  } = body;
  // console.log(body);
  return {
    whiteLabel: whiteLabel,
    transactionId: transactionId || uuidv4(),
    accountType: accountType || null,
    parentTransactionId: parentTransactionId || null,
    externalReferenceId: externalReferenceId || null,
    clientId: new mongoose.Types.ObjectId(clientId),
    fromAccount: fromAccount || { type: null, id: null },
    toAccount: toAccount || { type: null, id: null },
    externalDestination: externalDestination || null,
    amount,
    transactionType,
    review: review || null,
    status: status || "INITIATED",
    paymentStatus: paymentStatus || null,
    previousBal: previousBal || 0,
    currentBal: currentBal || 0,
    initiatedAt: getUTCTime(),
    completedAt:
      status === "COMPLETED"
        ? getUTCTime()
        : status === "PENDING"
          ? completedAt
          : null,
  };
}
export const depositeAmountProcess = asyncHandler(async (req, res) => {
  //   console.log(req.user);
  const { id, userId, whiteLabel } = req.user;
  const { firstName } = req.info;
  // console.log(req.user);
  const { amount } = req.body;
  const findClientWalletBalance =
    await clientProfileRepository.findOneClientSelectedField(
      new mongoose.Types.ObjectId(id),
      ["walletBalance", "walletCurrency"]
    );
  // console.log(findClientWalletBalance);
  if (findClientWalletBalance) {
    const newBalance = {
      walletBalance: findClientWalletBalance.walletBalance + parseFloat(amount),
    };
    const updateClientWalletBalance =
      await clientProfileRepository.updateClientById(
        new mongoose.Types.ObjectId(id),
        newBalance
      );
    if (!updateClientWalletBalance) {
      return res.error("Error Occurred While Putting Balance");
    }
    req.body.transactionType = "DEPOSIT";
    req.body.whiteLabel = whiteLabel;
    req.body.accountType = "WALLET";
    req.body.paymentStatus = "DEPOSIT";
    req.body.clientId = id;
    req.body.review = `Deposited to Client Wallet ${userId}:investmentWallet`;
    req.body.status = "COMPLETED";
    req.body.completedAt = getUTCTime();
    req.body.fromAccount = {
      type: "UPI",
      id: "example15@ok-sbi",
    };
    req.body.toAccount = {
      type: "WALLET",
      id: `${userId}:investmentWallet`,
    };
    // req.body.toAccount = `${userId}:investmentWallet`;
    const transactionReportNewObj = createTransactionObject(req.body);
    const saveTransactionReport =
      await clientAccountTransactionHistoryRepository.createaccountTransaction(
        transactionReportNewObj
      );
    // console.log(saveTransactionReport);
    if (!saveTransactionReport) {
      return res.error("Error Occurred While Saving Transaction Report");
    }
    try {
      console.log(
        "🔍 Attempting to send deposit to wallet confirmation email..."
      );
      await sendCustomEmail(
        whiteLabel,
        "deposit_to_wallet_success",
        [req.user.email],
        {
          firstName: req?.user?.name || "User",
          transactionId: req.body.transactionId,
          amount: amount,
          email: req?.user?.email,
        }
      );
      console.log("✅ Deposit to wallet confirmation email sent successfully.");
    } catch (emailError) {
      console.error(
        "❌ Failed to send deposit confirmation email:",
        emailError
      );
    }
    return res.success({}, "Deposited Amount Successfully", 200);
  }
  return res.error("Error Occurred While Finding Client Wallet Balance");
});
export const withDrawlAmountProcess = asyncHandler(async (req, res) => {
  // console.log("here");
  const { id, userId, whiteLabel } = req.user;
  const totalGroups = await forexGroupRepository.findGroupByOptions(
    {
      WhiteLabel: whiteLabel,
      ManagerType: "real",
    },
    "GroupName MinimumDepositeLimit"
  );
  // console.log(totalGroups);
  const groupDict = totalGroups?.reduce((acc, item) => {
    const obj = item.toObject();
    // console.log(obj.MinimumDepositeLimit);
    acc[obj._id] = {
      _id: obj.GroupName,
      MinimumDepositeLimit: obj.MinimumDepositeLimit,
    };
    return acc;
  }, {});
  const transactionId = uuidv4();
  // console.log("++++++++++++++++++++++++++",req.user.whiteLabel);
  const { fromAccount, toAccount, amount } = req.body;
  const resp = await processTransaction(
    fromAccount,
    toAccount,
    amount,
    req,
    groupDict,
    id,
    whiteLabel,
  );
  if (resp?.success) {
    const saveTransactions = resp?.result?.transactionReports.map(
      async (transactionReport) => {
        const newTransactionHistoryRecord = {
          clientId: id,
          whiteLabel: whiteLabel,
          transactionId: transactionId,
          accountType: transactionReport.accountType,
          fromAccount: transactionReport.fromAccount,
          toAccount: transactionReport.toAccount,
          amount: transactionReport.transactionAmount,
          transactionType: transactionReport.transactionType,
          review: transactionReport.comment,
          previousBal: transactionReport.previousBalance,
          currentBal: transactionReport.currentBalance,
          paymentStatus: transactionReport.paymentStatus,
          status: "COMPLETED",
        };
        // console.log(newTransactionHistoryRecord);
        const transactionReportNewObj = createTransactionObject(
          newTransactionHistoryRecord
        );
        // console.log(transactionReportNewObj);

        await clientAccountTransactionHistoryRepository.createaccountTransaction(
          transactionReportNewObj
        );
      }
    );
    await Promise.all(saveTransactions);
    return res.success({}, "Transaction Successful", 200);
  }
  return res.error(`Transaction Process Error:  ${resp.message}`, 400);
});


const buildTransactionPipeline = ({
  userMId,
  whiteLabel,
  fromDate,
  toDate,
  transactionType,
  filterTAccountNo,
  status,
}) => {
  const pipeline = [];
  const matchStage = {
    clientId: userMId,
    whiteLabel: whiteLabel,
    createdAt: {
      $gte: new Date(fromDate),
      $lte: new Date(toDate),
    },
  };
  const isBaseCase =
    (!transactionType || transactionType.toLowerCase() === "all") &&
    (!filterTAccountNo || filterTAccountNo.toLowerCase() === "all");
  if (isBaseCase) {
    matchStage.$or = [
      { paymentStatus: { $ne: "INTERNAL_TRANSFER" } },
      {
        paymentStatus: "INTERNAL_TRANSFER",
        "fromAccount.type": { $in: ["WALLET", "TRADING"] },
        transactionType: "WITHDRAWAL",
      },
    ];
  } else if (transactionType && transactionType.toLowerCase() !== "all") {
    switch (transactionType) {
      case "DEPOSIT":
        matchStage.paymentStatus = "DEPOSIT";
        matchStage.transactionType = "DEPOSIT";
        break;
      case "TRANSFER":
        matchStage.paymentStatus = "INTERNAL_TRANSFER";
        matchStage["fromAccount.type"] = { $in: ["WALLET", "TRADING"] };
        matchStage.transactionType = "WITHDRAWAL";
        break;
      case "WITHDRAWAL":
        matchStage.paymentStatus = "WITHDRAWAL";
        matchStage.transactionType = "WITHDRAWAL";
        break;
      case "CREDIT":
        matchStage.paymentStatus = { $in: ["CREDITIN", "CREDITOUT"] };
        matchStage.transactionType = "CREDIT";
        break;
      case "BONUS":
        matchStage.paymentStatus = { $in: ["BONUSIN", "BONUSOUT"] };
        matchStage.transactionType = "BONUS";
        break;
      case "CORRECTION":
        matchStage.paymentStatus = { $in: ["CORRECTIONIN", "CORRECTIONOUT"] };
        matchStage.transactionType = "CORRECTION";
        break;
      case "CHARGE":
        matchStage.paymentStatus = { $in: ["CHARGEIN", "CHARGEOUT"] };
        matchStage.transactionType = "CHARGE";
        break;
      case "DIRECTDEPOSITS":
        matchStage.paymentStatus = { $in: ["DEPOSITIN", "WITHDRAWALOUT"] };
        matchStage.transactionType = "BALANCE";
        break;
    }
  }
  // if (status && status.toLowerCase() !== "all") {
  //   matchStage.status = status;
  // }
  if (status && status.toLowerCase() !== "all") {
    const lowerStatus = status?.toLowerCase();
    const failedStatuses = ["FAILED", "CANCELLED", "REJECTED"];
    if (failedStatuses.map((s) => s?.toLowerCase()).includes(lowerStatus)) {
      matchStage.status = { $in: failedStatuses };
    } else {
      matchStage.status = status;
    }
  }
  if (filterTAccountNo && filterTAccountNo.toLowerCase() !== "all") {
    const isWallet = filterTAccountNo.includes(":");
    const accountType = isWallet ? "WALLET" : "TRADING";

    const accountFilter = {
      transactionType: { $ne: "DEPOSIT" },
      $or: [
        { "toAccount.id": filterTAccountNo, "toAccount.type": accountType },
        { "fromAccount.id": filterTAccountNo, "fromAccount.type": accountType },
      ],
    };
    if (matchStage.$or) {
      matchStage.$and = [{ $or: matchStage.$or }, accountFilter];
      delete matchStage.$or;
    } else {
      Object.assign(matchStage, accountFilter);
    }
  }

  pipeline.push({ $match: matchStage });
  return pipeline;
};

export const getTransactionHistory = asyncHandler(async (req, res) => {
  let { id, whiteLabel } = req.user;
  let {
    fromDate,
    toDate,
    status = "ALL",
    filterTAccountNo = "ALL",
    transactionType = "ALL",
    page = 1,
    limit = 10,
  } = req.body;

  const userMId = new mongoose.Types.ObjectId(id);
  whiteLabel = new mongoose.Types.ObjectId(whiteLabel);

  const pipeline = buildTransactionPipeline({
    userMId,
    whiteLabel,
    fromDate,
    toDate,
    transactionType,
    filterTAccountNo,
    status,
  });

  const skip = (page - 1) * limit;

  const result =
    await clientAccountTransactionHistoryRepository.aggregateTransactions(
      pipeline.concat([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $project: {
            _id: 0,
            updatedAt: 0,
          },
        },
      ])
    );

  const countRecords =
    await clientAccountTransactionHistoryRepository.aggregateTransactionsCount(
      pipeline
    );

  const getWithdrawRequest =
    await withdrawlRequestsRepository.getWithdrawRequestByWhiteLabel(
      userMId,
      whiteLabel
    );

  const withdrawalPaymentMeathodDict = getWithdrawRequest?.reduce(
    (acc, record) => {
      acc[record.requestId] = {
        paymentMethod: record.paymentMethod,
      };
      return acc;
    },
    {}
  );

  const transformedResult = result.map((transaction) => {
    const isWithdrawal =
      transaction.transactionType?.toLowerCase() === "withdrawal" &&
      transaction.paymentStatus?.toLowerCase() === "withdrawal";

    const toAccount = {
      accountType: transaction.toAccount.type,
      accountId: transaction.toAccount.id,
    };

    if (isWithdrawal) {
      toAccount.paymentMethod =
        withdrawalPaymentMeathodDict?.[transaction.transactionId]
          ?.paymentMethod || null;
    }

    return {
      from: {
        accountType: transaction.fromAccount.type,
        accountId: transaction.fromAccount.id,
      },
      to: toAccount,
      clientDetails: {
        clientId: transaction.clientId,
        whiteLabelId: transaction.whiteLabel,
      },
      transactionDetails: {
        transactionId: transaction.transactionId,
        transactionHash: transaction.transactionHash,
      },
      financials: {
        previousBalance: transaction.previousBal,
        amountTransferred: transaction.amount,
        newBalance: transaction.currentBal,
      },
      metadata: {
        type: transaction.transactionType,
        paymentStatus: transaction.paymentStatus,
        status: transaction.status,
        reviewMessage: transaction.review,
      },
      timestamps: {
        initiatedAt: transaction.initiatedAt,
        completedAt: transaction.completedAt,
      },
    };
  });

  const resultObj = {
    transactions: transformedResult,
    currentPage: parseInt(page),
    totalPages: Math.ceil(countRecords / limit),
    totalRecords: countRecords,
  };

  return res.success(
    resultObj,
    result?.length > 0 ? "Transactions Found" : "No Transactions Found"
  );
});

function formatBalance(bal) {
  return parseFloat(Number(bal ?? 0).toFixed(2));
}
function createWalletResponse(investmentWallet, tradingAccountsBal) {
  const totalTradingAccountBal = tradingAccountsBal.reduce(
    (sum, account) => sum + (account.MarginFree || 0),
    0
  );
  const walletBalance = {
    investmentWallet: {
      0: `${investmentWallet.userId}:investmentWallet`,
      bal: formatBalance(investmentWallet.walletBalance),
      availableForWithdrawal: formatBalance(investmentWallet.walletBalance),
      currency: investmentWallet.walletCurrency,
    },
    tradingAccountWallet: {
      totalTradingAccountBal: formatBalance(totalTradingAccountBal),
      accounts: tradingAccountsBal.map((account, index) => ({
        1: account.Login,
        bal: formatBalance(account.MarginFree),
        availableForWithdrawal: formatBalance(formatBalance(
          account.MarginFree 
        ) - formatBalance(account.Credit)),
        credit: formatBalance(account.Credit),
        currency: investmentWallet.walletCurrency,
        groupId: account?.toObject()?.GroupId,
      })),
    },
  };
  // console.log(walletBalance);
  return walletBalance;
}
export const getClientOverAllFund = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const [investmentWallet, tradingAccountsBal] = await Promise.all([
    clientProfileRepository.findOneClientSelectedField(id, [
      "walletBalance",
      "walletCurrency",
      "userId",
    ]),
    tradingAccountRepository.getAccByOptions(
      { ClientId: id, ManagerType: "real" },
      { Login: 1, MarginFree: 1, GroupId: 1, Balance: 1, Credit: 1 }
    ),
  ]);
  if (!investmentWallet) {
    return res.success("Investment wallet not yet setup", 200);
  }
  if (!tradingAccountsBal || tradingAccountsBal.length === 0) {
    return res.success("No Real Trading Account found!", 400);
  }
  const data = createWalletResponse(investmentWallet, tradingAccountsBal);
  return res.success(data, "Client Overall Fund Retrieved Successfully", 200);
});
export const withdrawamountToPersonalWallet = asyncHandler(async (req, res) => {
  const transactionId = uuidv4();
  const { whiteLabel, id, userId } = req.user;
  // console.log(req.user);

  const walletBalance = await clientProfileRepository.findOneClientSelectedField(id,walletBalance);
  const {
    requestType,
    paymentMethod,
    currency,
    walletAddress,
    amount,
    upiId,
    accHolderName,
    bankName,
    accNumber,
    bankIdentifier,
    receiverName,
  } = req.body;
  const amountInt = Number(amount);
  const walletBalanceInt = Number(walletBalance);

  let payMethodFilter = {
    whiteLabel: whiteLabel,
    type: "Withdrawal",
  };

  if (requestType === "CRYPTO") {
    payMethodFilter.Name = "Crypto";
  } else {
    payMethodFilter.Name = "Manual Withdrawal";
  }

  const paymentMethodData =
    await paymentGetwayRepository.getPaymentMethodsByFilter(payMethodFilter);

  if (!paymentMethodData?.status) {
    return res.error(
      "Payment Method is disabled by admin, cannnot make deposit request"
    );
  }

  const currencyData = await paymentCurrencyRepository.getCurrency({
    whiteLabel: whiteLabel,
    paymentMethod:
      requestType.toUpperCase() === "BANK"
        ? "Bank"
        : requestType.toUpperCase() === "UPI"
          ? "Upi"
          : requestType.toUpperCase() === "CASH"
            ? "Cash"
            : paymentMethod,
    type: "WITHDRAWAL",
    status: true
  });

  if (!currencyData) {
    return res.error("Currency not found or disabled by admin", 400);
  }

  if (currencyData.minLimit > amount) {
    return res.error(
      "Amount is less then the min-limit allowed on currency",
      400
    );
  }

  if (amountInt > walletBalanceInt) {
    return res.error("Insufficient Balance in the wallet", 400);
  }
  const newObj = {
    whiteLabel: new mongoose.Types.ObjectId(whiteLabel),
    requestId: transactionId,
    userId: userId,
    paymentMethod: paymentMethod,
    // cryptoCurrency: currency,
    // walletAddress: walletAddress,
    amount: amountInt,
    client: new mongoose.Types.ObjectId(id),
  };

  if (requestType.toUpperCase() === "BANK") {
    let tempIdentifier = {};
    if (Array.isArray(bankIdentifier) && bankIdentifier.length > 0) {
      bankIdentifier.map((item) => {
        tempIdentifier = bankIdentifier.map((item) => ({
          type: item.type?.toUpperCase(),
          value: item.value?.trim(),
        }));
      });
    }
    newObj.bankAccount = {
      bankName: bankName,
      accountHolderName: accHolderName,
      accountNumber: accNumber,
      bankIdentifier: tempIdentifier,
    };
  } else if (requestType.toUpperCase() === "UPI") {
    newObj.upiAccount = {
      upiId: upiId,
      accountHolderName: accHolderName,
    };
  } else if (requestType.toUpperCase() === "CRYPTO") {
    newObj.cryptoCurrency = currency;
    newObj.walletAddress = walletAddress;
  } else if (requestType.toUpperCase() === "CASH") {
    newObj.cashTransactionData = {
      receiverName: receiverName,
    };
  }

  const saveWithDrawRequest =
    await withdrawlRequestsRepository.insertWithdrawRequest(newObj);
  if (!saveWithDrawRequest) {
    return res.error("Failed to raise withdrawl request", 400);
  }
  const withdrawRequestReport = {
    clientId: id,
    whiteLabel: whiteLabel,
    transactionId: transactionId,
    accountType: "WALLET",
    fromAccount: {
      type: "WALLET",
      id: `${userId}:investmentWallet`,
    },
    toAccount: {
      type: "PERSONAL WALLET",
      id:
        requestType.toUpperCase() === "BANK"
          ? `${bankName}:${accNumber}`
          : requestType.toUpperCase() === "UPI"
            ? upiId
            : requestType.toUpperCase() === "CASH"
              ? receiverName
              : walletAddress,
    },
    amount: -amount,
    transactionType: "WITHDRAWAL",
    review: "",
    previousBal: walletBalanceInt,
    currentBal: walletBalanceInt - amount,
    paymentStatus: "WITHDRAWAL",
    status: "PENDING",
  };
  const saveWithdrawRequestReport = createTransactionObject(
    withdrawRequestReport
  );
  await clientAccountTransactionHistoryRepository.createaccountTransaction(
    saveWithdrawRequestReport
  );
  const updatedClient = await clientProfileRepository.updateWalletBalance(
    id,
    amountInt
  );
  if (!updatedClient) {
    return res.error("Failed to update wallet balance", 500);
  }
  res.success("Withdrawl request raised successfully", 200);
});
export const getCurrencyList = asyncHandler(async (req, res) => {
  // console.log(req.user);
  const currencyList = await paymentGetwayRepository.getPaymentMethodsTypes();
  const filteredList = currencyList?.map((currency) => {
    return {
      crypto: currency.crypto_currency,
      blockChain: currency.blockchain,
    };
  });
  res.success(filteredList, "Success", 200);
  // console.log(filteredList);
});

export const getMinimumDepositeByGroupId = asyncHandler(async (req, res) => {
  const { groupId, type = "real" } = req.query;
  const queryMinimumDeposite = await forexGroupRepository.getGroupById(
    new mongoose.Types.ObjectId(groupId),
    "MinimumDepositeLimit"
  );
  if (!queryMinimumDeposite) {
    return res.error("Group not found", 404);
  }
  const minimumDeposite = queryMinimumDeposite?.MinimumDepositeLimit || 0;
  res.success(
    { MinimumDeposit: minimumDeposite },
    "Minimum Deposite Retrieved Successfully",
    200
  );
});

export const getPaymentCurrencyList = asyncHandler(async (req, res) => {
  const { whiteLabel } = req.user;
  const { paymentMethodId } = req.query;

  const filter = {
    paymentMethodId: new mongoose.Types.ObjectId(paymentMethodId),
    whiteLabel: whiteLabel,
    status: true,
  };

  const currenyData = await paymentCurrencyRepository.getCurrencyList(
    filter,
    ""
  );

  if (currenyData.length === 0) {
    return res.error("Currency data not found!", 404);
  }

  return res.success(
    { data: currenyData },
    "Currency data fetched successfully!"
  );
});

export const checkPaymentMethodStatus = asyncHandler(async (req, res) => {
  const { whiteLabel } = req.user;
  const { paymentMethod, type } = req.query;

  const filter = {
    Name: paymentMethod,
    whiteLabel: whiteLabel,
    type: type,
  };

  const paymentMethodData =
    await paymentGetwayRepository.getPaymentMethodsByFilter(filter);

  if (!paymentMethodData) {
    return res.error("Payment Method not found!", 404);
  }

  return res.success(
    { methodStatus: paymentMethodData.status },
    "Currency data fetched successfully!"
  );
});
