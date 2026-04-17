import Order from "../models/orderHistory.model.js";

class OrderRepository {
  async getOrders(filter, options = {}) {
    const { page = 1, limit = 10, sort = "-createdAt" } = options;
    const skip = (page - 1) * limit;
    const orders = await Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Order.countDocuments(filter);
    return {
      total,
      page,
      limit,
      orders,
    };
  }
  async getOrderById(orderId) {
    return await Order.findById(orderId).lean();
  }
  async createOrder(orderData) {
    const newOrder = new Order(orderData);
    return await newOrder.save();
  }
  async updateOrder(orderId, updateData) {
    return await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
    }).lean();
  }
  async deleteOrder(orderId) {
    return await Order.findByIdAndDelete(orderId);
  }
  async getClosedOrders(filter) {
    const query = {};
    if (filter.accountId && filter.accountId.toLowerCase() !== "all") {
      query.accountId = filter.accountId;
    }
    if (filter.clientId) {
      query.clientId = filter.clientId;
    }
    if (filter.from && filter.to) {
      query.timeDone = {
        $gte: new Date(filter.from),
        $lte: new Date(filter.to),
      };
    }
    query.state = "ORDER_STATE_FILLED";
    return await Order.find(query).lean();
  }
  async getOpenOrders(filter) {
    filter.state = { $ne: "CLOSED" };
    return await Order.find(filter).lean();
  }
}

export default new OrderRepository();
