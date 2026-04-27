import mongoose from 'mongoose';
import { CT_MASTER_REQUEST_STATUS_ENUM, CT_MASTER_REQUEST_TYPE_ENUM } from '../utils/constant.js';

const { Schema, model, Types } = mongoose;

const CtMasterRequestSchema = new Schema(
  {
    masterLogin: {
      type: String,
      default: null,
      trim: true,
    },
    whiteLabel: {
      type: Types.ObjectId,
      ref: 'whiteLabel',
      required: true,
    },
    masterId: {
      type: Types.ObjectId,
      ref: 'clientProfile',
      required: true,
    },
    groupId:{
      type: Types.ObjectId,
      ref: 'forexGroups',
      required: true,
    },
    masterName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {type: String, default: null},
    leverage: { type: String, default: null },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: CT_MASTER_REQUEST_STATUS_ENUM,
      default: 'PENDING',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    completedOn: {
      type: Date,
      default: null,
    },
    remark: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: CT_MASTER_REQUEST_TYPE_ENUM,
      required: true,
    },
  },
  {
    collection: 'ctMasterRequest',
  }
);
CtMasterRequestSchema.index(
  { masterLogin: 1, masterId: 1, whiteLabel: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['APPROVED', 'PENDING'] },
    },
  }
);

CtMasterRequestSchema.index(
  { masterLogin: 1, masterId: 1, whiteLabel: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'CANCELATION',
    },
  }
);
const CtMasterRequest = model('ctMasterRequest', CtMasterRequestSchema);

export default CtMasterRequest;
