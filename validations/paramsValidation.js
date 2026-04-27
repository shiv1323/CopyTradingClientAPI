import Joi from "joi";

export const raiseFollowRequestSchema = Joi.object({
  pass: Joi.string().min(1).required(),
  leverage: Joi.number().positive().required(),
  name: Joi.string().trim().min(1).required(),
  groupId: Joi.string().length(24).hex().required(),

  masterUserId: Joi.string().length(24).hex().optional(),
  masterTrAccount: Joi.string().optional(),
  selfTrAccount: Joi.string().optional(),
  tradingCondition: Joi.string().optional(),
  ratio: Joi.number().positive().optional(),
});

export const raiseMasterRequestSchema = Joi.object({
  pass: Joi.string().min(1).required(),
  leverage: Joi.number().positive().required(),
  name: Joi.string().trim().min(1).required(),
  groupId: Joi.string().length(24).hex().required(),
});
