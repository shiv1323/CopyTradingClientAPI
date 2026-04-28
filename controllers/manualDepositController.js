import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import bankAccountRepository from "../repositories/bankAccountRepository.js";
import upiAccountRepository from "../repositories/upiAccountRepository.js";
import {
  getS3FileUrl,
  safeUnlink,
  uploadToS3,
} from "./clientDocumentUpload/uploadDocumentFiles.js";
import manualDepositRepository from "../repositories/manualDepositRepository.js";
import { createTransactionObject } from "./clientFundController/clientInvestentWalletController.js";
import clientAccountTransactionHistoryRepository from "../repositories/clientAccountTransactionHistoryRepository.js";
import { v4 as uuidv4 } from "uuid";
import paymentCurrencyRepository from "../repositories/paymentCurrencyRepository.js";
import paymentGetwayRepository from "../repositories/paymentGetwayRepository.js";

export const getBankAccountsList = asyncHandler(async (req, res) => {
  let { whiteLabel } = req.user;

  const filter = {
    whiteLabel: whiteLabel,
    status: "ACTIVE",
  };

  const bankAccounts = await bankAccountRepository.getBankAccList(
    filter,
    "-__v -createdAt -updatedAt"
  );

  if (bankAccounts.length > 0) {
    return res.success(
      {
        bankAccounts,
      },
      "Bank Accounts retrieved successfully"
    );
  }

  return res.success({ bankAccounts: [] }, "No Bank Account Found");
});

export const getUpiAccountsList = asyncHandler(async (req, res) => {
  let { whiteLabel } = req.user;

  const filter = {
    whiteLabel: whiteLabel,
    status: "ACTIVE",
  };

  const upiAccounts = await upiAccountRepository.getUpiAccList(
    filter,
    "-__v -createdAt -updatedAt"
  );

  if (upiAccounts.length > 0) {
    return res.success(
      {
        upiAccounts,
      },
      "Upi Accounts retrieved successfully"
    );
  }

  return res.success({ upiAccounts: [] }, "No Upi Account Found");
});

const createRequestDoc = async (req, document, s3FileUrl, s3Response) => {
  const { paymentType, amount, utrNumber, transactionId, accountId } = req.body;

  const type =
    paymentType.toLowerCase() === "cash"
      ? "CASH"
      : paymentType.toLowerCase() === "bank"
        ? "BankAccount"
        : "UPIAccount";

  const doc = {
    clientId: new mongoose.Types.ObjectId(req.user.id),
    whiteLabel: req.user.whiteLabel,
    adminId: new mongoose.Types.ObjectId(req.user.adminId),
    transactionId: transactionId,
    type: type,
    fileDetails: {
      file: {
        originalName: document.originalname,
        fileName: document.filename,
        fileType: document.mimetype,
        fileSize: document.size,
        s3Path: s3FileUrl,
        mimeType: document.mimetype,
        s3Tag: s3Response.ETag,
      },
    },
    amount: parseFloat(amount),
    status: "Pending",
  };

  if (paymentType.toLowerCase() != "cash") {
    doc.accountId = accountId;
    doc.utrNumber = utrNumber;
  }

  return doc;
};

export const createDepositRequest = asyncHandler(async (req, res) => {
  let { paymentType, amount, utrNumber, transactionId, accountId } = req.body;
  if (!req.files || req.files.length === 0) {
    return res.error("Please upload at least one file!", 400);
  }
  const { id, whiteLabel, adminId } = req.user;
  const fileCount = req.files.length;
  const uploadResults = [];

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ! Input validation -----
    if (fileCount > 1) {
      throw new Error("Multiple files upload not allowed");
    }
    const processingFiles = [req.files[0]];

    if (!paymentType) {
      throw new Error("Payment type is required");
    }

    const paymentMethodData =
      await paymentGetwayRepository.getPaymentMethodsByFilter({
        Name: "Manual Deposit",
        type: "Deposit",
        whiteLabel: whiteLabel,
      });

    if (!paymentMethodData?.status) {
      throw new Error(
        "Payment Method is disabled by admin, cannnot raise request"
      );
    }

    const normalizedType = paymentType.toLowerCase();
    const allowedTypes = ["bank", "upi", "cash"];
    if (!allowedTypes.includes(normalizedType)) {
      throw new Error("Payment type must be either bank, upi, or cash");
    }

    if (amount === undefined || amount === null || amount === "") {
      throw new Error("Amount is required");
    }
    if (isNaN(amount) || Number(amount) <= 0) {
      throw new Error("Amount must be a positive number");
    }

    const currencyData = await paymentCurrencyRepository.getCurrency({
      whiteLabel: whiteLabel,
      paymentMethod:
        paymentType.toUpperCase() === "BANK"
          ? "Bank"
          : paymentType.toUpperCase() === "UPI"
            ? "Upi"
            :  "Cash",
      type: "DEPOSIT",
      status: true,
    });

    if (!currencyData) {
      return res.error("Currency is disabled by admin", 500);
    }

    if (paymentType.toLowerCase() === "cash") {
      if (!transactionId) {
        transactionId = uuidv4();
        req.body.transactionId = transactionId;
      }
    }

    const requestDataForTrId = await manualDepositRepository.getOneReq({
      transactionId: transactionId,
      whiteLabel: whiteLabel,
    });

    if (requestDataForTrId) {
      throw new Error("Transaction id already used.");
    }

    if (utrNumber) {
      const requestDataForUtr = await manualDepositRepository.getOneReq({
        utrNumber: utrNumber,
        whiteLabel: whiteLabel,
      });

      if (requestDataForUtr) {
        throw new Error("UTR already used.");
      }
    }

    if (paymentType.toLowerCase() != "cash") {
      if (
        !utrNumber ||
        typeof utrNumber !== "string" ||
        utrNumber.trim() === ""
      ) {
        throw new Error(
          "UTR number is required and must be a string for bank/upi payments"
        );
      }

      if (
        !transactionId ||
        typeof transactionId !== "string" ||
        transactionId.trim() === ""
      ) {
        throw new Error(
          "Transaction ID is required and must be a string for bank/upi payments"
        );
      }

      if (
        !accountId ||
        typeof accountId !== "string" ||
        accountId.trim() === ""
      ) {
        throw new Error(
          "Account ID is required and must be a string for bank/upi payments"
        );
      }

      let accountData;
      const accFilter = {
        _id: new mongoose.Types.ObjectId(accountId),
        whiteLabel: whiteLabel,
        status: "ACTIVE",
      };

      if (paymentType.toLowerCase() === "bank") {
        accountData = await bankAccountRepository.getBankById(accFilter);
      } else if (paymentType.toLowerCase() === "upi") {
        accountData = await upiAccountRepository.getUpiById(accFilter);
      }
      if (!accountData) {
        throw new Error("Account not found or is not active");
      }

      if (amount < accountData?.limit) {
        throw new Error("Amount is less then min-limit");
      }

      if (amount > accountData?.maxLimit) {
        throw new Error("Amount should not be greater then max limit");
      }
    } else {
      const filter = {
        whiteLabel: whiteLabel,
        type: "DEPOSIT",
        paymentMethod: "Cash",
      };
      const currencyData = await paymentCurrencyRepository.getCurrency(filter);

      if (!currencyData) {
        throw new Error("Currency data not found");
      }

      if (amount < currencyData?.minLimit) {
        throw new Error("Amount is less then the min cash limit allowed");
      }
    }

    for (const document of processingFiles) {
      const s3Response = await uploadToS3(document.path);
      const s3FileUrl = getS3FileUrl(
        process.env.AWS_BUCKET_NAME,
        document.filename
      );

      const LedgerPayload = {
        transactionId,
        whiteLabel,
        adminId: new mongoose.Types.ObjectId(adminId),
        accountType: "WALLET",
        clientId: id,
        fromAccount: {
          type:
            paymentType.toLowerCase() === "cash"
              ? "CASH"
              : paymentType.toLowerCase() === "bank"
                ? "BankAccount"
                : "UPIAccount",
          id: paymentType.toLowerCase() === "cash" ? "CASH" : transactionId,
        },
        toAccount: {
          type: "WALLET",
          id: `${req.user.userId}:investmentWallet`,
        },
        amount,
        transactionType: "DEPOSIT",
        review: "Processing",
        status: "PENDING",
        paymentStatus: "DEPOSIT",
        // completedAt,
      };

      const newDoc = await createRequestDoc(
        req,
        document,
        s3FileUrl,
        s3Response
      );

      const ledgerDoc = createTransactionObject(LedgerPayload);

      const saveLedgerData =
        await clientAccountTransactionHistoryRepository.createAccountTransactionWithSession(
          ledgerDoc,
          session
        );

      if (!saveLedgerData) {
        throw new Error("Error Occurred While creating manual request!");
      }

      const saveRequestDocData = await manualDepositRepository.createRequest(
        newDoc,
        session
      );

      if (!saveRequestDocData) {
        throw new Error("Error Occurred While creating manual request!");
      }

      await safeUnlink(document.path);

      uploadResults.push(saveRequestDocData);

      if (fileCount === 1) break;
    }

    await session.commitTransaction();
    session.endSession();

    return res.success(
      fileCount === 1 ? uploadResults[0] : uploadResults,
      "Request raised successfully",
      200
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error while creating request:", error);
    return res.error(
      error.message || "An error occurred while creating request",
      500
    );
  }
});
