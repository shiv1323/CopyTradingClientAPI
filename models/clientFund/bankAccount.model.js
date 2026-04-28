import mongoose from "mongoose";

const identifierSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "IFSC", // India
        "MICR", // India
        "ROUTING", // USA
        "IBAN", // EU, UAE, etc.
        "SWIFT", // Global
        "SORTCODE", // UK
        "BSB", // Australia
        "CLABE", // Mexico
        "TRANSIT", // Canada
        "CNAPS", // China
        "BRSTN", // Philippines
      ],
      required: true,
    },
    value: { type: String, required: true },
  },
  { _id: false }
);

const bankAccountSchema = new mongoose.Schema(
  {
    whiteLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "whiteLabel",
      required: true,
    },

    accountHolderName: { type: String, required: true },
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },

    identifiers: {
      type: [identifierSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
      default: "ACTIVE",
    },
    limit: { type: Number, required: true },
    maxLimit: { type: Number, required: true },
  },
  { timestamps: true, collection: "bankAccounts" }
);

export const BankAccount = mongoose.model("bankAccounts", bankAccountSchema);
