import mongoose from "mongoose";
import { getUTCTime } from "../utils/commonUtils.js";
import { urlencoded } from "express";

const { Schema, model } = mongoose;

export const DocumentType = Object.freeze({
  IDENTITY_PROOF: "IDENTITY_PROOF",
  ADDRESS_PROOF: "ADDRESS_PROOF",
});

export const DocumentName = Object.freeze({
  PASSPORT: "PASSPORT",
  DRIVING_LICENSE: "DRIVER_LICENSE",
  NATIONAL_ID: "NATIONAL_ID",
  UTILITY_BILL: "UTILITY_BILL",
  BANK_STATEMENT: "BANK_STATEMENT",
  RENTAL_AGREEMENT: "RENTAL_AGREEMENT",
  RESIDENCE: "RESIDENCE",
  OTHER: "OTHER",
});

export const VerificationStatus = Object.freeze({
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
});

const clientDoc = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "ClientProfile",
      required: true,
      index: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    documentType: {
      type: String,
      enum: Object.values(DocumentType),
      required: true,
    },
    documentNumber: {
      type: String,
      //   required: true,
      trim: true,
    },
    documentId: {
      type: String,
      required: false,
      default: null,
    },
    documentName: {
      type: String,
      enum: Object.values(DocumentName),
      required: true,
    },
    country: {
      type: String,
      required: false,
      default: null,
    },
    state: {
      type: String,
      required: false,
      default: null,
    },
    postalCode: {
      type: String,
      required: false,
      default: null,
    },
    address: {
      type: String,
      required: false,
    },
    fileDetails: {
      file: {
        originalName: {
          type: String,
          required: true,
        },
        fileName: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        fileSize: {
          type: Number,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: () => getUTCTime(),
        },
        s3Path: {
          type: String,
          required: true,
        },
        mimeType: {
          type: String,
          required: true,
        },
        s3Tag: {
          type: String,
          required: true,
        },
      },
    },
    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    verificationDetails: {
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: Date,
      remarks: String,
      rejectionReason: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dateOfExpiry: {
      type: Date,
      default: null,
    },
    isSumSub: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    collection: "Documents",
  }
);

clientDoc.index({ documentType: 1 });
clientDoc.index({ status: 1 });
clientDoc.index({ documentNumber: 1 });
clientDoc.index({ createdAt: 1 });

clientDoc.pre("save", async function (next) {
  if (!this.documentNumber || this.documentNumber === "0000000000000000") {
    this.documentNumber =
      (await generateDocumentNumber()) || "0000000000000000";
  }
  if (this.isModified("fileDetails") && !this.fileDetails.uploadDate) {
    this.fileDetails.uploadDate = new Date();
  }
  next();
});
async function generateDocumentNumber() {
  try {
    let isUnique = false;
    let documentNumber;
    while (!isUnique) {
      documentNumber = Math.floor(
        10000000000000 + Math.random() * 90000000000000
      ).toString();
      // console.log('userName',userName);
      const existingUser = await ClientDocument.findOne({
        documentNumber: documentNumber,
      });
      if (!existingUser) {
        isUnique = true;
      }
    }
    return documentNumber;
  } catch (error) {
    throw new Error(error);
  }
}

const ClientDocument = mongoose.model("ClientDocument", clientDoc);
export default ClientDocument;
