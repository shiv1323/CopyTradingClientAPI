import tradeOrderModel from "../models/tradeReport.model.js";

class tradeOrderRepository {
  // Get all clients, optionally selecting specific fields
  async getAllTrans(selectFields = "") {
    return await tradeOrderModel.find({}).select(selectFields);
  }

  async getClosedOrders(filter) {
    const query = {};
    if (filter.accountId && filter.accountId.toLowerCase() !== "all") {
      query.accountId = filter.accountId;
    }
    if (filter.clientId) {
      query.clientId = filter.clientId;
      query.whiteLabel = filter.whiteLabel;
    }
    if (filter.from && filter.to) {
      query.closingTime = {
        $gte: new Date(filter.from),
        $lte: new Date(filter.to),
      };
    }
    query.state = "CLOSED";
    return await tradeOrderModel.find(query).lean();
  }

  async getTransByOptions(
    options,
    selectFields,
    sort = {},
    skip = 0,
    limit = 0
  ) {
    return await tradeOrderModel
      .find(options)
      .select(selectFields)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async countTransactions(options) {
    return await tradeOrderModel.countDocuments(options);
  }

  async updateOneRecord(filter, update) {
    return await tradeOrderModel.updateOne(filter, update);
  }
  async getAggregate(options) {
    return await tradeOrderModel.aggregate(options);
  }
  async getIbPendingCommissionListByWhiteLabel(whiteLabel) {
    return await tradeOrderModel
      .find({
        commissionAdded: false,
        whiteLabel: whiteLabel,
      })
      .select(
        "_id clientId accountId whiteLabel order symbol type volume openPrice closePrice profit commissionAdded"
      );
  }

  async getCloseOrders(fields) {
    const { tAccountNo, fromDate, toDate, whiteLabel, id, positionID, sortOrder } = fields;
    const query = {
      accountId: tAccountNo,
      whiteLabel: whiteLabel,
      clientId: id,
    };
    if(positionID){
      query.positionID = positionID
    }
    if (fromDate && toDate) {
      try {
        // const [fromDay, fromMonth, fromYear] = fromDate.split(".");
        // const [toDay, toMonth, toYear] = toDate.split(".");

        // const from = new Date(
        //   `${fromYear}-${fromMonth}-${fromDay}T00:00:00.000Z`
        // );
        // const to = new Date(`${toYear}-${toMonth}-${toDay}T23:59:59.999Z`);

        // if (isNaN(from) || isNaN(to)) {
        //   console.error("Invalid Date(s) Provided");
        // } else {
        //   query.closingTime = {
        //     $gte: from,
        //     $lte: to,
        //   };
        // }

        const from = new Date(fromDate);
        const to = new Date(toDate);

        if (isNaN(from.getTime()) || isNaN(to.getTime())) {
          console.error("Invalid Date(s) Provided");
        } else {
          query.closingTime = {
            $gte: from,
            $lte: to,
          };
        }
      } catch (err) {
        console.error("Error parsing dates", err);
      }
    }
    let sort = { closingTime: 1 }; 
    if (sortOrder === 2) {
    sort = { closingTime: -1 };
  }
  return (await tradeOrderModel.find(query).sort(sort).lean()) || [];
  }
  async fetchCTOrders(whiteLabel,positionIds,followerLogin){
    const safePositionIds = positionIds.map(String);
    return await tradeOrderModel.aggregate([
      {
        $match: {
          positionID: { $in: safePositionIds },
          whiteLabel: whiteLabel,
          accountId: followerLogin,
        },
      },
      {
        $group: {
          _id: null,
          totalPnL: { $sum: "$profit" },
        },
      },
    ]);
  }
}

export default new tradeOrderRepository();
