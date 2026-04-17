import { MTAPI_ROUTES } from "../config/mtTerminalConstanats.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import tradeReportRepository from "../repositories/tradeReportRepository.js";
import tradingAccountRepository from "../repositories/tradingAccountRepository.js";
import { removeDiffFromTimestamp } from "../utils/commonUtils.js";
import { postReqMT5Server } from "../utils/mt5ServerUtils.js";

export async function getPnLChartData(filter, range) {

  try {
    
    let groupFormat;
  
    switch (range) {
      case "Today": {
        groupFormat = "%H:%M:%S";
        break;
      }
      case "Yesterday": {
        groupFormat = "%H:%M:%S";
        break;
      }
      default: {
        groupFormat = "%Y-%m-%d";
        break;
      } throw new Error("Invalid range");
    }
  
    const pipeline = [
      { $match: filter },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrdersInProfit: {
                  $sum: { $cond: [{ $gt: ["$profit", 0] }, 1, 0] },
                },
                totalOrdersInLoss: {
                  $sum: { $cond: [{ $lte: ["$profit", 0] }, 1, 0] },
                },
                totalProfit: {
                  $sum: { $cond: [{ $gt: ["$profit", 0] }, "$profit", 0] },
                },
                totalLoss: {
                  $sum: { $cond: [{ $lte: ["$profit", 0] }, "$profit", 0] },
                },
              },
            },
          ],
          chartData: [
            {
              $project: {
                value: { $abs: "$profit" },
                type: { $cond: [{ $gte: ["$profit", 0] }, "profit", "loss"] },
                time: {
                  $dateToString: {
                    format: groupFormat,
                    date: "$openingTime",
                    timezone: "UTC",
                  },
                },
              },
            },
            {
              $group: {
                _id: { type: "$type", time: "$time" },
                totalValue: { $sum: "$value" },
              },
            },
            {
              $group: {
                _id: null,
                profit: {
                  $push: {
                    $cond: [
                      { $eq: ["$_id.type", "profit"] },
                      { value: "$totalValue", time: "$_id.time" },
                      "$$REMOVE",
                    ],
                  },
                },
                loss: {
                  $push: {
                    $cond: [
                      { $eq: ["$_id.type", "loss"] },
                      { value: "$totalValue", time: "$_id.time" },
                      "$$REMOVE",
                    ],
                  },
                },
              },
            },
            { $project: { _id: 0, profit: 1, loss: 1 } },
          ],
        },
      },
      {
        $project: {
          totals: { $arrayElemAt: ["$totals", 0] },
          chartData: { $arrayElemAt: ["$chartData", 0] },
        },
      },
    ];
  
    const results = await tradeReportRepository.getAggregate(pipeline);

    if (!results || results.length === 0) {
      throw new Error("No results found for the given filter.");
    }

    return results;
  } catch (error) {
    console.error("Error while fetching chart data:", error.message || error);
    throw new Error("Failed to retrieve PnL chart data");
  }
}


export const getDashClientInfo = asyncHandler(async (req, res) => {
  const { whiteLabel, id, adminId } = req.user;
  let { fromDate, toDate, range } = req.query;
  fromDate = new Date(fromDate);
  toDate = new Date(toDate);
  const filter = {
    whiteLabel: whiteLabel,
    clientId: id,
    openingTime: { $gte: fromDate, $lte: toDate },
  };

  const filter2 = {
    whiteLabel: whiteLabel,
    clientId: id,
  };

  const filteredChartData = await getPnLChartData(filter,range);

  const [getTradinfo, getTradingAccountDetails] = await Promise.all([
    tradeReportRepository.getAggregate([
      { $match: filter2 },
      {
        $facet: {
          topSymbols: [
            {
              $group: {
                _id: "$symbol",
                count: { $sum: 1 },
                totalVolume: { $sum: "$volume" },
                totalProfitNLoass: { $sum: "$profit" },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]),
    tradingAccountRepository.getTradingAccountByClientId(whiteLabel, id),
  ]);

  const updatedTrAccDataData = getTradingAccountDetails.map((account) => {
    const balance = parseFloat(account.Balance);
    const equity = parseFloat(account.Equity);
    const credit = parseFloat(account.Credit || 0);
    const pNl = equity - balance - credit;
    return {
      ...account,
      unrealisedPnL: pNl.toFixed(2),
    };
  });

  const result = {
    adminId,
    statisticData: {
      totals: [
        {
          _id: null,
          totalOrdersInProfit: 0,
          totalOrdersInLoss: 0,
          totalProfit: 0,
          totalLoss: 0,
        },
      ],
      topSymbols: [],
    },
    tradingAccounts: updatedTrAccDataData || [],
    totalTradingAccountsFreeMargin:
      getTradingAccountDetails.reduce((total, acc) => {
        return total + parseFloat(acc.MarginFree);
      }, 0) || 0,
    openOrders: [],
  };
  if (getTradingAccountDetails.length > 0) {
    const allLogins =
      getTradingAccountDetails?.map((acc) => {
        return acc.Login;
      }) || [];
    const { type = "real" } = req?.query;
    const allPositions = await Promise.all(
      allLogins.map((loginId) => {
        return postReqMT5Server(
          MTAPI_ROUTES.GET_POSITION_INFO,
          { login: loginId },
          req.user,
          type
        );
      })
    );
    const openOrders = allLogins.map((login, index) => {
      const orders =
        allPositions[index]?.data?.answer?.map((order) => {
          // console.log(order);
          return {
            PositionId: order?.Position,
            LoginId: order?.Login,
            OrderType: order?.Action,
            OpenPrice: order?.PriceOpen,
            CurrentPrice: order?.PriceCurrent,
            Symbol: order?.Symbol,
            CurrentProfit: order?.Profit,
            Swap: order?.Storage,
            Lots: order?.VolumeExt / 100000000,
            CreateDate: order?.TimeCreateMsc
              ? removeDiffFromTimestamp(order?.TimeCreateMsc)
              : "",
            AmountInvested:
              parseFloat(order?.Volume) * parseFloat(order?.PriceOpen),
          };
        }) || [];

      return {
        login,
        orders,
      };
    });
    result.openOrders = openOrders;
    result.statisticData = {
      totals: filteredChartData?.length
        ? filteredChartData[0]?.totals
        : [
            {
              _id: null,
              totalOrdersInProfit: 0,
              totalOrdersInLoss: 0,
              totalProfit: 0,
              totalLoss: 0,
            },
          ],
      topSymbols: getTradinfo[0].topSymbols || [],
      pNlGraphData: filteredChartData?.length
        ? filteredChartData[0]?.chartData
        : [],
    };
  }
  res.success(result, "Dashboard Data Success!", 200);
});
