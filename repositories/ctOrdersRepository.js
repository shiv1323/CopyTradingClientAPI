// repositories/ctOrders.repository.js

import CtOrders from "../models/ctOrders.model.js";

const CtOrdersRepository = {
  /**
   * Create a new CT Order
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  createOrder: async (data) => {
    return await CtOrders.create(data);
  },

  /**
   * Find one CT Order by query
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  findOneOrder: async (query) => {
    return await CtOrders.findOne(query).lean();
  },

  /**
   * Find all orders matching query
   * @param {Object} query
   * @param {Object} [projection]
   * @returns {Promise<Array>}
   */
  findOrders: async (query, projection = {}) => {
    return await CtOrders.find(query, projection).lean();
  },

  /**
   * Get distinct values for a field
   * @param {String} field
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  getDistinct: async (field, query) => {
    return await CtOrders.distinct(field, query);
  },

  /**
   * Aggregate orders (for complex queries like grouping)
   * @param {Array} pipeline
   * @returns {Promise<Array>}
   */
  aggregateOrders: async (pipeline) => {
    return await CtOrders.aggregate(pipeline);
  },

  /**
   * Update one order by filter
   * @param {Object} filter
   * @param {Object} update
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  updateOneOrder: async (filter, update, options = {}) => {
    return await CtOrders.updateOne(filter, update, options);
  },

  /**
   * Delete one order
   * @param {Object} filter
   * @returns {Promise<Object>}
   */
  deleteOneOrder: async (filter) => {
    return await CtOrders.deleteOne(filter);
  },

  /**
   * Ensure compound index exists
   */
  ensureIndexes: async () => {
    await CtOrders.syncIndexes();
  },

  fetAllOrders: async (masterLogin, whiteLabel, followerLogins) => {
    return await CtOrders.aggregate([
      {
        $match: {
          masterLogin: masterLogin,
          whiteLabel: whiteLabel,
          followerLogin: { $in: followerLogins },
        },
      },
      {
        $group: {
          _id: {
            followerLogin: "$followerLogin",
            positionId: "$positionId",
          },
        },
      },
    ]);
  },
};

export default CtOrdersRepository;
