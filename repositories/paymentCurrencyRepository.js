import paymentCurrencyListModal from "../models/clientFund/paymentCurrencyListModal.js"; 

class currencyRepository {
  async getCurrency(filter) {
    return await paymentCurrencyListModal.findOne(filter);
  }

  async getCurrencyListPaginated(filter, skip, limit, select = "", sortOrder = -1) {
    return await paymentCurrencyListModal.find(filter)
      .skip(skip)
      .limit(limit)
      .select(select)
      .sort({ createdAt: sortOrder })
      .lean();
  }

  async getCurrencyList(filter, select) {
    return await paymentCurrencyListModal.find(filter).select(select).lean();
  }

  async updateCurrency(filter, update) {
    return await paymentCurrencyListModal.updateOne(filter, update, {
      runValidators: true,
    });
  }

  async updateCurrencyNew(filter, update) {
    return await paymentCurrencyListModal.findOneAndUpdate(filter, update, {
      runValidators: true,
    });
  }
  async updateManyCurrency(filter, update) {
    return await paymentCurrencyListModal.updateMany(filter, update, {
      runValidators: true,
    });
  }
}

export default new currencyRepository();