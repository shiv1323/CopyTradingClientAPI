import mongoose from "mongoose";

const whiteLableSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    website: {
      type: String,
      required: [true, "Please add an website"],
      unique: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    level: {
      type: Number,
      required: false, // Set as required since it's auto-generated
      unique: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: null,
    },
    updatedAt: {
      type: Date,
      // default: getUTCTime(),
    },
    manager: {
      type: String,
    },
    configDetails: {
      tradingAccLimit: {
        type: Number,
        default: 3,
        },
    },
    managers: {
      demo: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        manager: { type: String, default: "" },
        wrapperUrl: { type: String, default: "" },
      },
      real: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          default: () => new mongoose.Types.ObjectId(),
        },
        manager: { type: String, default: "" },
        wrapperUrl: { type: String, default: "" },
      },
    },
  },
  { collection: "WhiteLabel" }
);

const WhiteLabel = mongoose.model("WhiteLabel", whiteLableSchema);

export default WhiteLabel;
