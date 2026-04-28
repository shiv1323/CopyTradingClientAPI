import mongoose from "mongoose";
import withdrawalCurrencyModal from "../models/withdrawalCurrencyModal.js";

class WithdrawalCurrencyRepository {
  async getCurrencyList(options, selectFields = "") {
    try {
      return await withdrawalCurrencyModal.find(options).select(selectFields);
    } catch (error) {
      console.error("Error finding curerncy list :", error);
      throw error;
    }
  } 

  async getCurrencybyOptions(options, selectFields = "") {
    try {
      return await withdrawalCurrencyModal.findOne(options).select(selectFields);
    } catch (error) {
      console.error("Error finding curerncy list :", error);
      throw error;
    }
  } 

  async createCurrency(options) {
    try {
      return await withdrawalCurrencyModal.create(options);
    } catch (error) {
      console.error("Error creating currency:", error);
      throw error;
    }
  }
}

export default new WithdrawalCurrencyRepository();
