import mongoose from "mongoose";

const fileDetailsSchema = new mongoose.Schema(
  {
    file: {
      originalName: { type: String, default: null },
      fileName: { type: String, default: null },
      fileType: { type: String, default: null },
      fileSize: { type: Number, default: null },
      s3Path: { type: String, default: null },
      mimeType: { type: String, default: null },
      s3Tag: { type: String, default: null },
    },
  },
  { _id: false }
);

const clientDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "clientProfile",
      required: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    documentType: { type: String, required: true },
    documentName: { type: String, default: "unknown" },
    documentId: { type: String, default: "unknown" },
    /** Mirrors `documentId` from upload body for list/download handlers that use `documentNumber`. */
    documentNumber: { type: String, default: "unknown" },
    dateOfExpiry: { type: Date, default: Date.now },
    country: { type: String, default: "unknown" },
    address: { type: String, default: "unknown" },
    postalCode: { type: String, default: "unknown" },
    state: { type: String, default: "unknown" },
    fileDetails: { type: fileDetailsSchema, required: true },
    status: { type: String, default: "PENDING" },
    verificationDetails: {
      verifiedBy: { type: mongoose.Schema.Types.Mixed, default: null },
      remarks: { type: String, default: "" },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "clientDocuments" }
);

export const ClientDocument = mongoose.model(
  "clientDocument",
  clientDocumentSchema
);
