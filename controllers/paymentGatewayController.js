import paymentMethodRepository from "../repositories/paymentGetwayRepository.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import moment from "moment/moment.js";
import mongoose from "mongoose";
import clientProfileRepository from "../repositories/clientProfileRepository.js";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { generateHmac } from "../utils/paymentgatwayutils.js";
import paymentGateway from "../models/clientFund/paymentgateway.model.js";
import { createTransactionObject } from "./clientFundController/clientInvestentWalletController.js";
import clientAccountTransactionHistoryRepository from "../repositories/clientAccountTransactionHistoryRepository.js";
import accountTransactionModel from "../models/clientFund/accountTransactions.model.js";
import { sendCustomEmail } from "../utils/commonUtils.js";
import clientProfileModel from "../models/clientProfile.model.js";
import paymentCurrencyRepository from "../repositories/paymentCurrencyRepository.js";
import paymentGetwayRepository from "../repositories/paymentGetwayRepository.js";
import env from "../config/env.js";
 
const baseURL = env.PAYMENTGATWAY_BASEURL;
const secretkey = env.PAYMENTGATWAY_SECRET_ACCESS_KEY;
const application_id = env.PAYMENTGATWAY_APPLICATION_ID;



export const GetPaymentMethods = async (req, res) => {
  try {
    const { whiteLabelId } = req.user;
    const { type = "Deposit" } = req.query;
    const PaymentMethods = await paymentMethodRepository.getPaymentMethods(
      new mongoose.Types.ObjectId(whiteLabelId),
      type
    );
    const formattedData = PaymentMethods.map((item) => {
      const { applicationId, appSecret,baseUrl, ...restConfig } = item.configuration;
      return {
        ...item,
        configuration: restConfig,
      };
    });
    return res.success(formattedData, "Success", 200);
  } catch (error) {
   return res.error(error.message, 500);
  }
};

export const getPaymentMethodsList = async (req, res) => {
  try {
    const { whiteLabelId } = req.user;
    const PaymentMethods =
      await paymentMethodRepository.getPaymentMethodsTypes(new mongoose.Types.ObjectId(whiteLabelId));
    //   console.log(activity);
    return res.success(PaymentMethods, "Success", 200);
  } catch (error) {
    console.error("Error getting payments lists:", error);
    throw new Error("Error getting payments lists.");
  }
};

function splitUrlTillVersion(url, versionSegment = "/v0") {
  const index = url.indexOf(versionSegment);
  if (index === -1) {
    // version segment not found, return original URL and empty rest
    return { baseurl: url, restPath: "" };
  }
  const baseurl = url.slice(0, index + versionSegment.length);
  const restPath = url.slice(index + versionSegment.length);
  return { baseurl, restPath };
}

export const getPaymentMethodsListDynamic = asyncHandler(async (req, res) => {
  const { whiteLabel } = req.user;
  const requestBody = {
    application_id: application_id,
    timestamp: new Date().toISOString(), // current UTC timestamp
  };
  const sign = generateHmac(requestBody, secretkey);
  const base = splitUrlTillVersion(baseURL);
  let responseOutput;
  const response = await axios.post(
    `${base.baseurl}/crypto/currencies`,
    requestBody,
    {
      headers: {
        signature: sign,
        "Content-Type": "application/json",
      },
    }
  );
  if (response.data?.error) {
    const PaymentMethods =
      await paymentMethodRepository.getPaymentMethodsTypes(whiteLabel);
    responseOutput = PaymentMethods;
    // return res.success(PaymentMethods, "Success", 200);
  } else {
    responseOutput = response.data?.currencies_list;
    // return res.success(response.data?.currencies_list);
  }
  const currencyData = await paymentCurrencyRepository.getCurrency({
    paymentMethod: "Crypto",
    type: "DEPOSIT",
    whiteLabel: whiteLabel,
  });

  const updatedOutput = responseOutput.map((obj) => ({
    ...obj,
    minDepositLimit: currencyData?.minLimit || 1,
  }));

  return res.success(updatedOutput, "Success", 200);
});

const fetchClientWallet = async (clientId, session) => {
  return await clientProfileRepository.findOneClientSelectedField(
    new mongoose.Types.ObjectId(clientId),
    ["walletBalance", "walletCurrency"],
    session
  );
};

const createTransactionSignature = (payload, secretKey) => {
  return generateHmac(payload, secretKey);
};

const submitTransactionRequest = async (transPayload, signature) => {
  return await axios.post(`${baseURL}/submit-transaction`, transPayload, {
    headers: {
      signature,
      "Content-Type": "application/json",
    },
  });
};



const saveTransactionReport = async (reportData) => {
  const transactionReport = createTransactionObject(reportData);
  return await clientAccountTransactionHistoryRepository.createaccountTransaction(
    transactionReport
  );
};

// initiate and walletaddress
export const depositeAmountGatewayProcess = asyncHandler(async (req, res) => {
  const { id, userId, whiteLabelId } = req.user;  
  const {
    amount,
    crypto_currency,
    currency,
    email,
    mobile_number,
    network_id,
    username,
  } = req.body;

  try {
    const clientWallet =
      await clientProfileRepository.findOneClientSelectedField(
        new mongoose.Types.ObjectId(id),
        ["walletBalance", "walletCurrency"]
      );

    if (!clientWallet) {
      return res.error("Client wallet balance not found");
    }

    const paymentMethodData =
      await paymentGetwayRepository.getPaymentMethodsByFilter({
        Name: "Crypto",
        type: "Deposit",
        whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
      });

    if (!paymentMethodData?.status) {
      return res.error(
        "Payment Method is disabled by admin, cannnot make deposit request"
      );
    }

    const initiatePayload = {
      amount,
      application_id,
      crypto_currency,
      currency,
      email,
      mobile_number,
      network_id,
      reference_id: uuidv4(),
      timestamp: moment().toISOString(),
      username,
    };
    const initiateSignature = generateHmac(initiatePayload, secretkey);

    const initiateResponse = await axios.post(
      `${baseURL}/initiate`,
      initiatePayload,
      {
        headers: {
          signature: initiateSignature,
          "Content-Type": "application/json",
        },
      }
    );

    if (
      !initiateResponse.data ||
      !initiateResponse.data.transfer_reference_id
    ) {
      return res.error("Invalid response from transaction initiation");
    }

    const { transfer_reference_id, payment_options } = initiateResponse.data;
    const walletPayload = {
      application_id,
      crypto_currency,
      network_id,
      timestamp: moment().toISOString(),
      transfer_reference_id,
    };

    const walletSignature = generateHmac(walletPayload, secretkey);
    const walletResponse = await axios.post(
      `${baseURL}/wallet-address`,
      walletPayload,
      {
        headers: {
          signature: walletSignature,
          "Content-Type": "application/json",
        },
      }
    );

    const { wallet_address, token_address } = walletResponse.data?.data;
    const transactionData = {
      whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
      clientId: id,
      userAmount: amount,
      currency,
      applicationId: application_id,
      networkId: network_id,
      transactionType: "DEPOSIT",
      cryptoAmount: initiateResponse.data.amount,
      transfer_reference_id,
      blockchain: payment_options[0]?.payment_method_details?.blockchain,
      walletAddress: wallet_address,
      tokenAddress: token_address,
      status: "PENDING",
      toAccount: `${userId}:investmentWallet`,
    };

    if (initiateResponse.status === 200 && walletResponse.status === 200) {
      const transactionRecord = new paymentGateway(transactionData);
      await transactionRecord.save();

      if (username === `${userId}:investmentWallet`) {
        if (clientWallet) {
          req.body.transactionType = "DEPOSIT";
          req.body.whiteLabel = new mongoose.Types.ObjectId(whiteLabelId);
          req.body.accountType = "investmentWallet";
          req.body.paymentStatus = "DEPOSIT";
          req.body.transactionId = transfer_reference_id;
          req.body.clientId = id;
          req.body.review = "Processing";
          req.body.status = "PENDING";
          req.body.completedAt = moment().toISOString();
          req.body.previousBal = parseInt(clientWallet.walletBalance);
          req.body.currentBal = 0;
          req.body.amount = amount;
          (req.body.completedAt = initiatePayload.timestamp),
            (req.body.fromAccount = {
              type: payment_options[0]?.payment_method_details?.blockchain,
              id: transfer_reference_id,
            });
          req.body.toAccount = {
            type: "WALLET",
            id: `${userId}:investmentWallet`,
          };

          const transactionReportNewObj = createTransactionObject(req.body);
          const saveTransactionReport =
            await clientAccountTransactionHistoryRepository.createaccountTransaction(
              transactionReportNewObj
            );
          if (!saveTransactionReport) {
            return res.error("Error occurred while saving transaction report.");
          }
        }
      } else {
        const tradingTransactionReport = {
          accountType: "WALLET",
          transactionId: transfer_reference_id,
          transactionAmount: amount,
          whiteLabel: new mongoose.Types.ObjectId(whiteLabelId),
          clientId: id,
          fromAccount: {
            type: payment_options[0]?.payment_method_details?.blockchain,
            id: transfer_reference_id,
          },
          toAccount: {
            type: "WALLET",
            id: `${userId}:investmentWallet`,
          },
          amount: amount,
          review: "Processing",
          status: "PENDING",
          paymentStatus: "DEPOSIT",
          currentBal: 0,
          transactionType: "DEPOSIT",
          comment: "Processing",
          completedAt: initiatePayload.timestamp,
        };

        const saveReportResult = await saveTransactionReport(
          tradingTransactionReport
        );
        if (!saveReportResult) {
          return res.error("Error occurred while saving transaction report.");
        }
      }
      return res.success(
        {
          data: walletResponse.data,
          reference_id: transfer_reference_id,
          message: "Initiated gateway successfully",
        },
        200
      );
    } else {
      return res.error("An error occurred while initiating the gateway");
    }
  } catch (error) {
    if (error.response) {
      return res.error(error.response.data, error.response.status ?? 400);
    } else {
      res.error("Unexpected error:", error.message);
    }
  }
});

export const submitTransactionProcess = asyncHandler(async (req, res) => {
  const { id, userId, whiteLabel } = req.user;
  const {
    transaction_hash,
    transfer_reference_id,
    username,
    tAccount,
    amount,
    block_number,
  } = req.body;
  const { email, name } = req.user;
  try {
    const clientWallet = await fetchClientWallet(id);
    if (!clientWallet) return res.error("Client wallet balance not found");

    const transPayload = {
      application_id,
      timestamp: moment().toISOString(),
      transaction_hash,
      transfer_reference_id,
      // block_number
    };
    const subSignature = createTransactionSignature(transPayload, secretkey);
    const walletResponse = await submitTransactionRequest(
      transPayload,
      subSignature
    );
    if (!walletResponse.data.error) {
      await accountTransactionModel.updateOne(
        { transactionId: transfer_reference_id },
        {
          $set: {
            transactionHash: transaction_hash,
          },
        }
      );
      return res.success(
        {},
        "Transaction details submitted successfully.",
        200
      );
    } else {
      return res.error("Error in wallet response.");
    }
  } catch (error) {
    if (error.response) {
      return res.error(error.response.data, error.response.status ?? 400);
    } else {
      res.error("Unexpected error:", error.message);
    }
  }
});

// callback data
const sendEmailForDeposit = async (transaction, status, amount) => {
  try {
    let type = "deposit_success";
    if (status != "SUCCESS") {
      type = "deposit_rejected";
    }
    //console.log("Inside Send Email", transaction)
    const getClientInfo = await clientProfileModel.findOne({
      _id: new mongoose.Types.ObjectId(transaction.clientId),
    });
    let variables = {};
    if (type == "deposit_success") {
      variables = {
        email: getClientInfo?.email,
        transactionId: transaction?.transactionId,
        firstName: getClientInfo?.name,
        amount: amount,
      };
    } else {
      variables = {
        amount: amount,
        rejectReason: "Not Verified Payment",
        firstName: getClientInfo?.name,
        transactionId: transaction?.transactionId,
      };
    }
    await sendCustomEmail(
      new mongoose.Types.ObjectId(transaction.whiteLabel),
      type,
      [getClientInfo?.email],
      variables
    );
  } catch (error) {
    console.log(error);
  }
};

export const callBackTransactionProcess = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { data } = req.body;
    // // Parse stringified JSON from "data" key
    const parsedData = JSON.parse(data);

    // Destructure
    const {
      amount,
      application_id,
      currency,
      crypto_amount,
      crypto_currency,
      network_id,
      transaction_hash,
      reference_id,
      status,
      timestamp,
      transfer_reference_id,
      user_mobile_number,
    } = parsedData;

    const updateData = {
      completedAt: moment.utc().format(),
      transactionHash: transaction_hash || "",
    };

    if (status === "SUCCESS") {
      updateData.status = "COMPLETED";
    } else if (status === "CANCELLED") {
      updateData.status = "FAILED";
    } else if (status === "ABANDONED") {
      updateData.status = "FAILED";
    } else {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(200)
        .json({ success: false, message: "Status not found" });
    }

    const transaction = await accountTransactionModel.findOne(
      { transactionId: transfer_reference_id, status: { $ne: "COMPLETED" } },
      null,
      { session }
    );

    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Transaction not found or already completed",
      });
    }

    await paymentGateway.updateOne(
      { transfer_reference_id },
      { $set: updateData },
      { session }
    );

    if (status === "SUCCESS" && transaction.accountType === "WALLET") {
      await updateClientWallet(transaction, session);
    } else {
      await updateTransaction(transaction, session);
    }
    await sendEmailForDeposit(transaction, status, amount);
    await session.commitTransaction();
    session.endSession();

    return res
      .status(200)
      .json({ success: true, message: "Callback processed" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Callback processing error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

const updateClientWallet = async (transaction, session) => {
  const clientWallet = await fetchClientWallet(transaction.clientId, session);
  const newBalance =
    clientWallet.walletBalance + parseFloat(transaction.amount);

  await clientProfileRepository.updateClientById(
    transaction.clientId,
    { walletBalance: newBalance },
    session
  );

  await accountTransactionModel.updateOne(
    { transactionId: transaction.transactionId },
    {
      $set: {
        review: "Deposited to Client Wallet investmentWallet",
        status: "COMPLETED",
        completedAt: moment().toISOString(),
        previousBal: clientWallet.walletBalance ?? 0,
        currentBal: newBalance,
      },
    },
    { session }
  );
};

const updateTransaction = async (transaction, session) => {
  await accountTransactionModel.updateOne(
    { transactionId: transaction.transactionId },
    {
      $set: {
        review: "Fail to Deposit to Client Wallet",
        status: "FAILED",
        completedAt: moment().toISOString(),
      },
    },
    { session }
  );
};
