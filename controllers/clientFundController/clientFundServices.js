import clientProfileRepository from "../../repositories/clientProfileRepository.js";
import clientAccountTransactionHistoryRepository from "../../repositories/clientAccountTransactionHistoryRepository.js";
import tradingAccountRepository from "../../repositories/tradingAccountRepository.js";
import mongoose from "mongoose";
import { postReqMT5Server } from "../../utils/mt5ServerUtils.js";
import { MTAPI_ROUTES } from "../../config/mtTerminalConstanats.js";
import { processTAccountData } from "../tradingAccountController.js";
import { convertCurrency } from "../../utils/commonUtils.js";
import ManagerDirectDealsRepository from "../../repositories/managerDirectDepositRepository.js";

var investmentWallet;

export async function setBalance(login, amount, req, id, whiteLabel) {
  try {
    let body = {
      login,
      sum: amount,
    };
    const createReq = await postReqMT5Server(
      MTAPI_ROUTES.UPDATE_BALANCE,
      body,
      req.user
    );
    if (!createReq?.success) {
      //rollback amount
      const { _id } = req.user;
      await clientProfileRepository.updateClientById(_id, {
        walletBalance: investmentWallet + amount,
      });
      return {
        success: false,
        message: "Failed to update balance on MTServer",
      };
    }
    const bodyReq = await postReqMT5Server(
      MTAPI_ROUTES.GET_T_ACCOUNT_INFO,
      { LoginId: login },
      req.user
    );
    if (!bodyReq?.success) {
      return {
        success: false,
        message: "Failed to get account info from MTServer",
      };
    }
    const updateObj = processTAccountData(bodyReq.data);
    const [saveToDb, saveToManagerDirecDeposits] = await Promise.all([
      tradingAccountRepository.updateTradingAccountByTAccountId(
        bodyReq?.data?.Login,
        updateObj
      ),
      ManagerDirectDealsRepository.create({
        Operation: "INTERNAL_TRANSFER",
        ClientId: id,
        WhiteLabelId: whiteLabel,
        Deal: createReq?.data?.answer?.ticket || "00000",
        Login: null,
        IsInternalTransfer: true,
      }),
    ]);
    if (!saveToDb) {
      return {
        success: false,
        message:
          "Failed to update trading account in db after updating balance on MTServer",
      };
    }
    if (!saveToManagerDirecDeposits) {
      return {
        success: false,
        message:
          "Failed to insert in direct deposit after updating balance on MTServer",
      };
    }
    return {
      success: true,
      message: "Balance updated successfully MTServer/DB",
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
async function withdrawBalance(login, amount, req, id, whiteLabel) {
  try {
    const body = {
      login: login,
      sum: amount,
    };
    const withDrawlRes = await postReqMT5Server(
      MTAPI_ROUTES.WITHDRAW_BAL,
      body,
      req.user
    );
    if (!withDrawlRes?.success) {
      return {
        success: false,
        message: "Failed to withdraw balance from MTServer",
      };
    }
    const bodyReq = await postReqMT5Server(
      MTAPI_ROUTES.GET_T_ACCOUNT_INFO,
      { LoginId: login },
      req.user
    );
    if (!bodyReq?.success) {
      return {
        success: false,
        message: "Failed to get account info from MTServer",
      };
    }
    const updateObj = processTAccountData(bodyReq.data);

    const [saveToDb, saveToManagerDirecDeposits] = await Promise.all([
      tradingAccountRepository.updateTradingAccountByTAccountId(
        bodyReq?.data?.Login,
        updateObj
      ),
      ManagerDirectDealsRepository.create({
        Operation: "INTERNAL_TRANSFER",
        ClientId: id,
        WhiteLabelId: whiteLabel,
        Deal: withDrawlRes?.data?.answer?.ticket || "00000",
        Login: null,
        IsInternalTransfer: true,
      }),
    ]);
    if (!saveToDb) {
      return {
        success: false,
        message:
          "Failed to update trading account in db after withdraw balance from MTServer",
      };
    }
    if (!saveToManagerDirecDeposits) {
      return {
        success: false,
        message:
          "Failed to insert in direct deposit trading in db after withdraw balance from MTServer",
      };
    }
    return {
      success: true,
      message: "Balance updated successfully MTServer/TradingAccount DB",
    };
  } catch (error) {
    throw new Error(error.message);
  }
}
export async function getBalance(loginId, clientId) {
  try {
    const query = {
      Login: loginId,
      ClientId: new mongoose.Types.ObjectId(clientId),
    };
    const getTrAccBal =
      await tradingAccountRepository.getOneTradingAccountByField(query, [
        "Balance",
        "-_id",
      ]);
    return parseFloat(getTrAccBal[0].Balance);
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function depositFromWalletToTradingAccount({
  fromAccount,
  toAccount,
  amount,
  req,
  groupDict,
  id,
  whiteLabel
}) {
  fromAccount = fromAccount["0"].split(":")[0];
  toAccount = toAccount["1"];
  // console.log(groupDict);
  // console.log(toAccount);
  if (!fromAccount || !toAccount) {
    return {
      success: false,
      message: "Invalid account",
    };
  }
  const [wallet, traccountGroup] = await Promise.all([
    clientProfileRepository.getClientByUniqueKey("userId", fromAccount, [
      "walletBalance",
      "walletCurrency",
      "_id",
    ]),

    tradingAccountRepository.getAccByOptions({ Login: toAccount }, "GroupId"),
  ]);
  let groupId = traccountGroup[0]?.toObject()?.GroupId?.toString();
  let checkDepositeLimit = groupDict[groupId] || { MinimumDepositeLimit: 0 };
  if (
    checkDepositeLimit &&
    Number(checkDepositeLimit?.MinimumDepositeLimit) > Number(amount)
  ) {
    return {
      success: false,
      message: `Your Minimum Deposite Limit Is ${checkDepositeLimit?.MinimumDepositeLimit}.Please select higher amount!`,
    };
  }
  if (wallet.walletBalance < amount) {
    return {
      success: false,
      message: "Insufficient Investment_Wallet Balance",
    };
  }
  const previousWalletBalance = wallet.walletBalance;
  wallet.walletBalance -= amount;
  investmentWallet = parseFloat(wallet?.walletBalance);
  const walletBalance = await clientProfileRepository.updateClientById(
    wallet?._id,
    { walletBalance: wallet.walletBalance }
  );
  if (!walletBalance) {
    return {
      success: false,
      message: "Failed to deduct balance from investmentWallet",
    };
  }
  const previousTradingBalance = await getBalance(toAccount, wallet?._id);

  const depositeToTrAcc = await setBalance(
    toAccount,
    amount,
    req,
    id,
    whiteLabel
  );
  if (!depositeToTrAcc) {
    // Rollback wallet balance if deposit fails
    await clientProfileRepository.updateClientById(wallet?._id, {
      walletBalance: previousWalletBalance,
    });
    return {
      success: false,
      message: "Failed to deposit to trading account",
    };
  }
  const walletTransactionReport = {
    // account: `${fromAccount}:investmentWallet`,
    accountType: "WALLET",
    previousBalance: previousWalletBalance,
    transactionAmount: -amount,
    fromAccount: {
      type: "WALLET",
      id: `${fromAccount}:investmentWallet`,
    },
    toAccount: {
      type: "TRADING",
      id: `${toAccount}`,
    },
    currentBalance: wallet.walletBalance,
    transactionType: "WITHDRAWAL",
    paymentStatus: "INTERNAL_TRANSFER",
    comment: `Deducted amount for transfer to Trading Account: ${toAccount}`,
  };

  const tradingTransactionReport = {
    // account: toAccount,
    accountType: "TRADING",
    previousBalance: previousTradingBalance,
    transactionAmount: amount,
    fromAccount: {
      type: "WALLET",
      id: `${fromAccount}:investmentWallet`,
    },
    toAccount: {
      type: "TRADING",
      id: `${toAccount}`,
    },
    currentBalance: previousTradingBalance + amount,
    transactionType: "DEPOSIT",
    paymentStatus: "INTERNAL_TRANSFER",
    comment: `Received amount from WalletId:${fromAccount}:investmentWallet`,
  };

  return {
    success: true,
    message: "Deposit successful",
    transactionReports: [walletTransactionReport, tradingTransactionReport],
  };
}
export async function withdrawFromTradingAccountToWallet({
  fromAccount,
  toAccount,
  amount,
  req,
  id,
  whiteLabel
}) {
  fromAccount = fromAccount["1"];
  toAccount = toAccount["0"].split(":")[0];
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  if (!fromAccount || !toAccount)
    return {
      success: false,
      message: "Invalid account",
    };
  const previousTradingBalance = await getBalance(fromAccount, req?.user?.id);
  const withdrawBalFromTrAccount = await withdrawBalance(
    fromAccount,
    amount,
    req,
    id,
    whiteLabel
  );
  if (!withdrawBalFromTrAccount.success) {
    return {
      success: false,
      message: withdrawBalFromTrAccount.message,
    };
  }
  const previousWalletBal = await clientProfileRepository.getClientByUniqueKey(
    "userId",
    toAccount,
    ["walletBalance", "walletCurrency", "_id"]
  );
  // console.log('previousWalletBalpreviousWalletBal',previousWalletBal);
  const walletBalance = await clientProfileRepository.updateClientById(
    req?.user?.id,
    { $inc: { walletBalance: amount } }
  );
  if (!walletBalance) {
    return {
      success: false,
      message: "Failed to add balance to investmentWallet",
    };
  }
  const tradingTransactionReport = {
    accountType: "TRADING",
    previousBalance: previousTradingBalance,
    transactionAmount: -amount,
    fromAccount: { type: "TRADING", id: `${fromAccount}` },
    toAccount: { type: "WALLET", id: `${toAccount}:investmentWallet` },
    currentBalance: previousTradingBalance - amount,
    transactionType: "WITHDRAWAL",
    paymentStatus: "INTERNAL_TRANSFER",
    comment: `Deducted amount for transfer to WalletId:${toAccount}:investmentWallet`,
  };
  const walletTransactionReport = {
    accountType: "WALLET",
    previousBalance: previousWalletBal.walletBalance,
    transactionAmount: amount,
    fromAccount: { type: "TRADING", id: `${fromAccount}` },
    toAccount: { type: "WALLET", id: `${toAccount}:investmentWallet` },
    currentBalance: previousWalletBal.walletBalance + amount,
    transactionType: "DEPOSIT",
    paymentStatus: "INTERNAL_TRANSFER",
    comment: `Received amount from Trading Account ${toAccount}`,
  };
  return {
    success: true,
    message: "Deposit successful",
    transactionReports: [tradingTransactionReport, walletTransactionReport],
  };
}
export async function depositeToWallet(
  clientId,
  tradingAccountId,
  amount,
  comment
) {
  // Validate withdrawal amount
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  //***/ Get client wallet and trading account details //****/
  const wallet = await Wallet.findOne({ clientId });
  const tradingAccount = await TradingAccount.findById(tradingAccountId);

  // Check if trading account has sufficient funds
  if (!tradingAccount || tradingAccount.balance < amount)
    throw new Error("Insufficient funds in trading account");

  // Update balances
  tradingAccount.balance -= amount;
  wallet.balance += amount;

  // Save updated balances
  await wallet.save();
  await tradingAccount.save();

  // Create transaction record
  const transaction = new Transaction({
    clientId,
    sourceAccountId: tradingAccount._id,
    destinationAccountId: wallet._id,
    amount,
    transactionType: "trading_to_wallet",
    status: "completed",
    comment,
    completedAt: new Date(),
  });

  await transaction.save();

  return { message: "Withdrawal successful" };
}
export async function withdrawFromWalletToExternal(
  clientId,
  amount,
  externalDetails,
  comment
) {
  // Validate withdrawal amount
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  // Get client wallet
  const wallet = await Wallet.findOne({ clientId });

  // Check if wallet has sufficient funds
  if (!wallet || wallet.balance < amount)
    throw new Error("Insufficient funds in wallet");

  // Update wallet balance
  wallet.balance -= amount;

  // Save updated wallet balance
  await wallet.save();

  // Create transaction record
  const transaction = new Transaction({
    clientId,
    sourceAccountId: wallet._id,
    destinationAccountId: externalDetails.id, // External details like UPI ID or Bank Account
    amount,
    transactionType: "wallet_to_external",
    status: "completed",
    comment,
    completedAt: new Date(),
  });

  await transaction.save();

  return { message: "Withdrawal to external source successful" };
}
// export async function internalTransferBetweenTradingAccounts(
//   fromAccount,
//   toAccount,
//   amount,
//   req,
//   groupDict
// ) {
//   fromAccount = fromAccount["1"];
//   toAccount = toAccount["1"];
//   if (amount <= 0) throw new Error("Amount must be greater than zero");
//   const filter = { ["ClientId"]: req?.user?.id };
//   const accounts =
//     (await tradingAccountRepository.getTradingAccountByField(filter)) || [];
//   const clientAccountDictionary = accounts.reduce((acc, account) => {
//     acc[account.Login] = {
//       currency: account.Currency,
//       balance: account.MarginFree,
//     };
//     return acc;
//   }, {});
//   // console.log(clientAccountDictionary);
//   const fromAccountDetails = clientAccountDictionary[fromAccount];
//   const toAccountDetails = clientAccountDictionary[toAccount];
//   const convertedAmount = convertCurrency(
//     amount,
//     fromAccountDetails?.currency,
//     toAccountDetails?.currency
//   );
//   // console.log(fromAccountDetails);
//   // console.log(toAccountDetails);
//   if (convertedAmount <= 0) throw new Error("Amount must be greater than zero");
//   if (fromAccountDetails.balance < convertedAmount)
//     throw new Error("Insufficient funds in source account");
//   //withdraw from source account
//   const previousBalBeforeWithdraw = fromAccountDetails.balance;
//   // const currentBalAfterWithdraw = fromAccountDetails.balance - amount;
//   const withdrawReq = await withdrawBalance(fromAccount, amount, req);
//   if (!withdrawReq.success) {
//     throw new Error("Withdrawal from source account failed");
//   }
//   //deposit to destination account
//   const previousBalBeforeDeposite = toAccountDetails.balance;
//   // const currentBalAfterDeposite = toAccountDetails.balance + convertedAmount;
//   const depositReq = await setBalance(toAccount, convertedAmount, req);
//   if (!depositReq.success) {
//     throw new Error("Deposit to destination account failed");
//   }
//   const withdrawTransactionReport = {
//     accountType: "TRADING",
//     previousBalance: previousBalBeforeWithdraw,
//     transactionAmount: -amount,
//     fromAccount: { type: "TRADING", id: `${fromAccount}` },
//     toAccount: { type: "TRADING", id: `${toAccount}` },
//     currentBalance: fromAccountDetails.balance - amount,
//     transactionType: "WITHDRAWAL",
//     paymentStatus: "INTERNAL_TRANSFER",
//     comment: `Deducted amount for transfer to Tr.Account: ${toAccount}`,
//   };
//   const depositeTransactionReport = {
//     accountType: "TRADING",
//     previousBalance: previousBalBeforeDeposite,
//     transactionAmount: amount,
//     fromAccount: { type: "TRADING", id: `${fromAccount}` },
//     toAccount: { type: "TRADING", id: `${toAccount}` },
//     currentBalance: previousBalBeforeDeposite + amount,
//     transactionType: "DEPOSIT",
//     paymentStatus: "INTERNAL_TRANSFER",
//     comment: `Received amount from Tr.Account:${toAccount}`,
//   };
//   return {
//     success: true,
//     message: "Deposit successful",
//     transactionReports: [withdrawTransactionReport, depositeTransactionReport],
//   };
// }
export async function internalTransferBetweenTradingAccounts({
  fromAccount,
  toAccount,
  amount,
  req,
  groupDict,
  id,
  whiteLabel
}) {
  fromAccount = fromAccount["1"];
  toAccount = toAccount["1"];
  if (amount <= 0) throw new Error("Amount must be greater than zero");
  const filter = { ["ClientId"]: req?.user?.id };
  const accounts =
    (await tradingAccountRepository.getTradingAccountByField(filter)) || [];
  const clientAccountDictionary = accounts.reduce((acc, account) => {
    acc[account.Login] = {
      currency: account.Currency,
      balance: account.MarginFree,
      groupId: account.GroupId,
    };
    return acc;
  }, {});
  const fromAccountDetails = clientAccountDictionary[fromAccount];
  const toAccountDetails = clientAccountDictionary[toAccount];
  let groupId = toAccountDetails.groupId.toString();
  let checkDepositeLimit = groupDict[groupId] || { MinimumDepositeLimit: 0 };
  if (
    checkDepositeLimit &&
    Number(checkDepositeLimit?.MinimumDepositeLimit) > Number(amount)
  ) {
    return {
      success: false,
      message: `Your Minimum Deposite Limit Is ${checkDepositeLimit?.MinimumDepositeLimit}.Please select higher amount!`,
    };
  }

  const convertedAmount = convertCurrency(
    amount,
    fromAccountDetails?.currency,
    toAccountDetails?.currency
  );
  // console.log(fromAccountDetails);
  // console.log(toAccountDetails);
  if (convertedAmount <= 0) throw new Error("Amount must be greater than zero");
  if (fromAccountDetails.balance < convertedAmount)
    throw new Error("Insufficient funds in source account");
  //withdraw from source account
  const previousBalBeforeWithdraw = fromAccountDetails.balance;
  // const currentBalAfterWithdraw = fromAccountDetails.balance - amount;
  const withdrawReq = await withdrawBalance(fromAccount, amount, req, id, whiteLabel);
  if (!withdrawReq.success) {
    throw new Error("Withdrawal from source account failed");
  }
  //deposit to destination account
  const previousBalBeforeDeposite = toAccountDetails.balance;
  // const currentBalAfterDeposite = toAccountDetails.balance + convertedAmount;
  const depositReq = await setBalance(toAccount, convertedAmount, req, id, whiteLabel);
  if (!depositReq.success) {
    throw new Error("Deposit to destination account failed");
  }
  const withdrawTransactionReport = {
    accountType: "TRADING",
    previousBalance: previousBalBeforeWithdraw,
    transactionAmount: -amount,
    fromAccount: { type: "TRADING", id: `${fromAccount}` },
    toAccount: { type: "TRADING", id: `${toAccount}` },
    currentBalance: fromAccountDetails.balance - amount,
    transactionType: "WITHDRAWAL",
    paymentStatus: "INTERNAL_TRANSFER",
    comment: `Deducted amount for transfer to Tr.Account: ${toAccount}`,
  };
  const depositeTransactionReport = {
    accountType: "TRADING",
    previousBalance: previousBalBeforeDeposite,
    transactionAmount: amount,
    fromAccount: { type: "TRADING", id: `${fromAccount}` },
    toAccount: { type: "TRADING", id: `${toAccount}` },
    currentBalance: previousBalBeforeDeposite + amount,
    transactionType: "DEPOSIT",
    paymentStatus: "INTERNAL_TRANSFER",
    comment: `Received amount from Tr.Account:${toAccount}`,
  };
  return {
    success: true,
    message: "Deposit successful",
    transactionReports: [withdrawTransactionReport, depositeTransactionReport],
  };
}
function determineTransactionType(fromAccount, toAccount) {
  const transactionHandlers = {
    investmentWallet_trAccount: depositFromWalletToTradingAccount,
    trAccount_investmentWallet: withdrawFromTradingAccountToWallet,
    trAccount_trAccount: internalTransferBetweenTradingAccounts,
  };
  let from = null;
  let to = null;

  // Checking fromAccount
  if (fromAccount) {
    if (fromAccount["0"]) {
      from = "investmentWallet";
    } else if (fromAccount["1"]) {
      from = "trAccount";
    }
  }

  // Checking toAccount
  if (toAccount) {
    if (toAccount["0"]) {
      to = "investmentWallet";
    } else if (toAccount["1"]) {
      to = "trAccount";
    }
  }
  if (from && to) {
    const mapKey = `${from}_${to}`;
    const handlerFunction = transactionHandlers[mapKey];
    return { success: true, handlerFunction, from, to };
  }
  return {
    success: false,
    message: "Transaction type not supported",
  };
}
export async function processTransaction(
  fromAccount,
  toAccount,
  amount,
  req,
  groupDict,
  id,
  whiteLabel,
  adminId
) {
  const transaction = determineTransactionType(fromAccount, toAccount);
  if (!transaction || !transaction.handlerFunction) {
    throw new Error(
      `Invalid account combination from ${transaction?.from} to ${transaction?.to}`
    );
  }
  // console.log(transaction);
  const result = await transaction.handlerFunction({
    fromAccount,
    toAccount,
    amount,
    req,
    groupDict,
    id,
    whiteLabel,
    adminId
  });
  // console.log(result);
  if (result.success) {
    return {
      success: true,
      result,
    };
  }
  return {
    success: false,
    message: result?.message,
  };
}
