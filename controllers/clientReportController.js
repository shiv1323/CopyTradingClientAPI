import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { postReqMT5Server } from "../utils/mt5ServerUtils.js";
import tradingAccountRepository from "../repositories/tradingAccountRepository.js";
import accountTransRepository from "../repositories/clientAccountTransactionHistoryRepository.js";
import moment from "moment";
import tradeReportRepository from "../repositories/tradeReportRepository.js";
import { MTAPI_ROUTES } from "../config/mtTerminalConstanats.js";
import { catchAsync } from "../middlewares/catchAsync.js";
import { removeDiffFromTimestamp } from "../utils/commonUtils.js";

const getTodayDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = String(today.getFullYear());
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate;
};
export const getOpenOrders = asyncHandler(async (req, res) => {
  const { tAccountNo } = req.body;
  const tradingAccData = await tradingAccountRepository.getAccByOptions(
    {
      ClientId: req.user?.id,
      Login: tAccountNo,
    },
    "Login"
  );

  if (tradingAccData.length != 0) {
    const { type = "real" } = req?.query;
    const answer = await postReqMT5Server(
      MTAPI_ROUTES.GET_POSITION_INFO,
      { login: tAccountNo },
      req.user,
      type
    );
    // console.log("Answer from api",answer?.data.answer)
    if (answer?.success) {
      const result = [];
      answer?.data?.answer.map((order) => {
        const temp = {};
        temp.PositionId = order?.Position;
        temp.LoginId = order?.Login;
        temp.OrderType = order?.Action;
        temp.OpenPrice = order?.PriceOpen;
        temp.CurrentPrice = order?.PriceCurrent;
        temp.Symbol = order?.Symbol;
        temp.CurrentProfit = order?.Profit;
        temp.Swap = parseFloat(order.Storage);
        temp.Lots = order?.VolumeExt / 100000000;
        temp.CreateDate = order?.TimeCreateMsc ? removeDiffFromTimestamp(order?.TimeCreateMsc) : "";
        result.push(temp);
      });
      return res.success(result, "Order Fetched");
    } else {
      return res.error("Internal Server Error : Wrapper Fail");
    }
  } else {
    return res.error("Trading account not found!");
  }
});

export const getClosedOrders2 = asyncHandler(async (req, res) => {
  const { tAccountNo } = req.body;
  let { fromDate, toDate } = req.body;
  const { type = "real" } = req?.query;
  const getTotalResult = await postReqMT5Server(
    MTAPI_ROUTES.GETORDER_HISTORYBY_LOGIN,
    { login: tAccountNo, fDate: fromDate, tDate: toDate },
    req.user,
    type
  );
  if (getTotalResult?.success) {
    let result = {};
    getTotalResult?.data?.answer?.map((order) => {
      if (!result[order?.PositionID]) {
        result[order?.PositionID] = {};
        result[order?.PositionID].PositionId = order?.PositionID;
        result[order?.PositionID].LoginId = order?.Login;
        result[order?.PositionID].OrderType =
          order?.Type === "OP_BUY" ? "BUY" : "SELL";
        result[order?.PositionID].OpenPrice = order?.PriceCurrent;
        result[order?.PositionID].Symbol = order?.Symbol;
        result[order?.PositionID].CurrentProfit = order?.Profit;
        result[order?.PositionID].Lots = order?.VolumeInitial / 10000;
        result[order?.PositionID].CreateDate = order?.TimeSetupMsc;
        result[order?.PositionID].OpenOrderId = order?.Order;
      } else {
        result[order?.PositionID].CloseOrderId = order?.Order;
        result[order?.PositionID].ClosePrice = order?.PriceCurrent;
        result[order?.PositionID].EndDate = order?.TimeDoneMsc;
        result[order?.PositionID].ProfitLoss = parseFloat(
          (
            (parseFloat(result[order?.PositionID].ClosePrice) -
              parseFloat(result[order?.PositionID].OpenPrice)) *
            parseFloat(order.ContractSize) *
            result[order?.PositionID].Lots
          ).toFixed(2)
        );
        result[order?.PositionID].ProfitLoss =
          result[order?.PositionID].OrderType === "BUY"
            ? result[order?.PositionID].ProfitLoss
            : -result[order?.PositionID].ProfitLoss;

        // console.log(result[order?.PositionID].ClosePrice,result[order?.PositionID].OpenPrice,order.ContractSize,result[order?.PositionID].Lots)
      }
    });
    result = Object.values(result);
    result = result.filter((item) => item.EndDate);
    // console.log(result);
    return res.success(result, "Orders Fetched");
  } else {
    res.error("Internal Server Error : Wrapper fail");
  }
});

export const getCloseOrderDemo = asyncHandler(async (req, res,detail) => {
  const { tAccountNo ,sortOrder} = req.body;
  const positionNo = req.body.positionID;
  let { fromDate, toDate } = req.body;
  const { type = "real" } = req?.query;
  fromDate = moment(fromDate).subtract(1, "days").format("DD/MM/YYYY");
  toDate = moment(toDate).add(1, "days").format("DD/MM/YYYY");
  //console.log(fromDate,toDate)
  const getTotalResult = await postReqMT5Server(
    "/api/trades/get-deal-info-by-batch",
    { logins: [tAccountNo], fromDate: fromDate, toDate: toDate },
    req.user,
    type
  );
  if (getTotalResult?.success) {
    const grouped = {};
    const orders = getTotalResult?.data?.answer?.answer?.sort(
      (a, b) => a.Time - b.Time
    );

    orders.forEach((order) => {
      const posId = order?.PositionID;
      if (!grouped[posId]) grouped[posId] = [];
      grouped[posId].push(order);
    });

    let finalResult = [];
    Object.entries(grouped).forEach(([positionID, trades]) => {
      const uniqueOrders = [...new Set(trades.map((t) => t.Order))];
      const openTrades = trades.filter((t) => t.PositionID === t.Order);

      const closedTrades = trades.filter((t) => t.PositionID !== t.Order);
      const isPartial = closedTrades.length > 1;
      const totalLots = closedTrades.reduce(
        (sum, t) => sum + t.Volume / 10000,
        0
      );

      if (detail) {
        const detailresult = closedTrades.filter((t) => t.PositionID ===positionNo);
        // DETAIL MODE
        detailresult.forEach((trade) => {
          const orderType = trade.Action === "1" ? "SELL" : "BUY";
          const lots = parseFloat((trade.Volume / 10000).toFixed(2));
          const profit = parseFloat(trade.Profit || 0);
          const commission = parseFloat(trade.Commission || 0);
          const swap = parseFloat(trade.Storage || 0);
          const fee = parseFloat(trade.Fee || 0);
          const closePrice = parseFloat(trade.Price || 0);
          const endTime = moment.unix(trade.Time).valueOf();
          const openTrade = openTrades[0] || trades[0];
          const openTime = moment.unix(openTrade.Time).valueOf();
          finalResult.push({
            PositionId: positionID,
            LoginId: trade.Login,
            OrderType: orderType,
            Symbol: trade.Symbol,
            Lots: lots,
            OpenPrice: parseFloat(trade.PricePosition),
            CreateDate: openTime,
            OpenOrderId: trade?.Order,
            CloseOrderId: trade.Order,
            ClosePrice: closePrice,
            EndDate: endTime,
            Commission: commission,
            Swap: swap,
            Fee: fee,
            ProfitLoss: profit,
            Partial: isPartial,
          });
        });
        
      } else {
        const openTrade = openTrades[0] || trades[0];
        const openTime = moment.unix(openTrade.Time).valueOf();
        const openPrice = parseFloat(openTrade.Price);
        const orderType = openTrade.Action === "1" ? "SELL" : "BUY";
        // Process closed trades for aggregation
        let profitSum = 0;
        let commissionSum = 0;
        let swapSum = 0;
        let weightedCloseSum = 0;
        let closeLots = 0;
        let latestCloseTime = 0;
        let lastCloseOrderId = null;

        closedTrades.forEach((trade) => {
          const lots = trade.Volume / 10000;
          const price = parseFloat(trade.Price);
          const profit = parseFloat(trade.Profit || 0);
          const commission = parseFloat(trade.Commission || 0);
          const swap = parseFloat(trade.Storage || 0);
          const time = moment.unix(trade.Time).valueOf();

          profitSum += profit;
          commissionSum += commission;
          swapSum += swap;
          weightedCloseSum += price * lots;
          closeLots += lots;

          if (time > latestCloseTime) {
            latestCloseTime = time;
            lastCloseOrderId = trade.Order;
          }
        });

        const avgClosePrice = closeLots
          ? parseFloat((weightedCloseSum / closeLots).toFixed(5))
          : 0;

        finalResult.push({
          PositionId: positionID,
          LoginId: openTrade.Login,
          OrderType: orderType,
          Symbol: openTrade.Symbol,
          Lots: parseFloat(totalLots.toFixed(2)), // open + closed
          OpenPrice: openPrice,
          CreateDate: removeDiffFromTimestamp(openTime),
          OpenOrderId: openTrade.Order,
          CloseOrderId: lastCloseOrderId,
          ClosePrice: avgClosePrice,
          EndDate: latestCloseTime ? removeDiffFromTimestamp(latestCloseTime) : null,
          Commission: parseFloat(commissionSum.toFixed(2)),
          Swap: parseFloat(swapSum.toFixed(2)),
          ProfitLoss: parseFloat(profitSum.toFixed(2)), // only closed
          Partial: isPartial,
        });
      }
    });
    finalResult = finalResult.filter((item) => item.EndDate);
    if (sortOrder === 2) {
      finalResult.sort((a, b) => new Date(b.EndDate) - new Date(a.EndDate)); 
    } else {
      finalResult.sort((a, b) => new Date(a.EndDate) - new Date(b.EndDate)); 
    }
    return res.success(finalResult, "Orders Fetched");
  } else {
    res.error("Internal Server Error : Wrapper fail");
  }
});

const queryDeals = catchAsync(async (req, tAccountNo, type = "real") => {
  const fromTimestamp = "01/01/1970";
  const toTimestamp = getTodayDate();
  const fetchDeals = await postReqMT5Server(
    MTAPI_ROUTES.GET_DEALS,
    { logins: tAccountNo.logins, fromDate: fromTimestamp, toDate: toTimestamp },
    req.user,
    type
  );
  const dealsByOrder = {};
  for (const deal of fetchDeals.data?.answer?.answer) {
    const key = deal.PositionID;
    if (!dealsByOrder[key]) {
      dealsByOrder[key] = [];
    }
    dealsByOrder[key].push({
      Order: deal.Order,
      Symbol: deal.Symbol,
      Price: deal.Price,
      Volume: deal.Volume,
      Profit: deal.Profit,
      Storage: deal.Storage,
      Commission: deal.Commission,
    });
  }

  return dealsByOrder || {};
});

const transformOrders = (orders) => {
  if (orders.length == 0) {
    return [];
  }
  return orders.map((order) => ({
    PositionId: order.positionID,
    LoginId: order.accountId,
    OrderType: order.type,
    OpenPrice: order.openPrice?.toFixed(5),
    Symbol: order.symbol,
    Lots: order.volume,
    CreateDate: new Date(order.openingTime).getTime(),
    OpenOrderId: order.order,
    CloseOrderId: order.order,
    ClosePrice: order.closePrice?.toFixed(5),
    EndDate: new Date(order.closingTime).getTime(),
    ProfitLoss: order.profit,
    Swap: order.swap,
    Commission: order.commission,
  }));
};

export const getClosedOrders = asyncHandler(async (req, res) => {
  const { whiteLabel, id } = req.user;
  let { fromDate, toDate, tAccountNo, sortOrder } = req.body;
  const { type = "real" } = req?.query;
  if (type === "demo") {
    return await getCloseOrderDemo(req, res);
  }
  const tradingAccData = await tradingAccountRepository.getAccByOptions(
    {
      ClientId: req.user?.id,
      Login: tAccountNo,
    },
    "Login"
  );

  if (tradingAccData.length != 0) {
    const fields = {
      id,
      whiteLabel,
      tAccountNo,
      fromDate,
      toDate,
      sortOrder
    };
    // const closedDealDic = await queryDeals(req, { logins: logins });
    const getClosedOrders = await tradeReportRepository.getCloseOrders(fields);
    const transforedData = newtransformOrders(getClosedOrders);
    return res.success(
      transforedData,
      transforedData.length > 0 ? "Order Fetched" : "No Orders Found",
      200
    );
  } else {
    return res.error("Trading account not found!");
  }
});

export const getClosedOrdersDetails = asyncHandler(async (req, res) => {
  const { whiteLabel, id } = req.user;
  let { tAccountNo, positionID } = req.body;
  const { type = "real" } = req.query;
  if (type === "demo") {
    return await getCloseOrderDemo(req, res,"details");
  }

  const tradingAccData = await tradingAccountRepository.getAccByOptions(
    { ClientId: id, Login: tAccountNo },
    "Login"
  );

  if (tradingAccData.length === 0) {
    return res.error("Trading account not found!");
  }

  const fields = {
    id,
    whiteLabel,
    tAccountNo,
    positionID,
  };

  const closedOrders = await tradeReportRepository.getCloseOrders(fields);
  const transformedData = transformOrders(closedOrders);
  return res.success(
    transformedData,
    transformedData.length > 0 ? "Orders fetched" : "No Orders Found",
    200
  );
});

export const getReportOverview = asyncHandler(async (req, res) => {
  let { toDate, fromDate } = req.body;
  const { whiteLabel, id, mt5Login } = req.user;
  const { type } = req?.query;
  fromDate = moment(fromDate, "DD-MM-YYYY HH:mm:ss").toISOString();
  toDate = moment(toDate, "DD-MM-YYYY HH:mm:ss").toISOString();
  const getAccountTypes =
    await tradingAccountRepository.getTradingAccountByField({
      ClientId: new mongoose.Types.ObjectId(id),
      ManagerType: type === "demo" ? "demo" : "real",
    });
  const tAccountArray = getAccountTypes.map((tAccount) => {
    return tAccount?.Login;
  });
  //console.log(tAccountArray)
  const totalDepositFromClient = await accountTransRepository.getAggregate([
    {
      $match: {
        paymentStatus: "DEPOSIT",
        clientId: new mongoose.Types.ObjectId(id),
        whiteLabel: new mongoose.Types.ObjectId(whiteLabel),
        createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      },
    },
    {
      $group: {
        _id: "$transactionId",
        amount: { $first: "$amount" },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);
  const totalWithdrawalFromClient = await accountTransRepository.getAggregate([
    {
      $match: {
        paymentStatus: "WITHDRAWAL",
        accountType: "WALLET",
        clientId: new mongoose.Types.ObjectId(id),
        whiteLabel: new mongoose.Types.ObjectId(whiteLabel),
        createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      },
    },
    {
      $group: {
        _id: "$transactionId",
        amount: { $first: "$amount" },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);
  const totalProfitLoss = await tradeReportRepository.getAggregate([
    {
      $match: {
        accountId: { $in: tAccountArray },
        whiteLabel: new mongoose.Types.ObjectId(whiteLabel),
        closingTime: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      },
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$profit" },
      },
    },
  ]);
  // console.log(
  //   totalWithdrawalFromClient,
  //   totalDepositFromClient,
  //   totalProfitLoss
  // );
  return res.success(
    {
      deposit:
        totalDepositFromClient.length > 0
          ? totalDepositFromClient[0].totalAmount
          : 0,
      withdrawal:
        totalWithdrawalFromClient.length > 0
          ? totalWithdrawalFromClient[0].totalAmount
          : 0,
      profitLoss:
        totalProfitLoss.length > 0 ? totalProfitLoss[0].totalAmount : 0,
    },
    "Report Ready"
  );
});

const newtransformOrders = (orders) => {
  if (!orders || orders.length === 0) return [];

  const grouped = new Map();

  for (const order of orders) {
    const posId = order.positionID;

    if (!grouped.has(posId)) {
      grouped.set(posId, []);
    }
    grouped.get(posId).push(order);
  }

  const transformed = [];

  for (const [positionID, group] of grouped.entries()) {
    if (group.length === 1) {
      const order = group[0];
      transformed.push({
        PositionId: order.positionID,
        LoginId: order.accountId,
        OrderType: order.type,
        OpenPrice: order.openPrice?.toFixed(5),
        Symbol: order.symbol,
        Lots: order.volume,
        CreateDate: new Date(order.openingTime).getTime(),
        OpenOrderId: order.order,
        CloseOrderId: order.order,
        ClosePrice: order.closePrice?.toFixed(5),
        EndDate: new Date(order.closingTime).getTime(),
        ProfitLoss: order.profit,
        Swap: order.swap,
        Commission: order.commission,
        Partial: !order.fullyClosed??false,
      });
    } else {
      // Multiple order with same positionID:
      const totalVolume = group.reduce((sum, o) => sum + o.volume, 0);
      const totalProfit = group.reduce((sum, o) => sum + o.profit, 0);
      const totalCommission = group.reduce(
        (sum, o) => sum + (o.commission || 0),
        0
      );
      const totalSwap = group.reduce((sum, o) => sum + (o.swap || 0), 0);

      // Volume-weighted average close price
      const weightedClosePrice =
        group.reduce((sum, o) => sum + o.closePrice * o.volume, 0) /
        totalVolume;

      const latestClosingTime = Math.max(
        ...group.map((o) => new Date(o.closingTime).getTime())
      );

      const order = group[0];
      transformed.push({
        PositionId: order.positionID,
        LoginId: order.accountId,
        OrderType: order.type,
        OpenPrice: order.openPrice?.toFixed(5),
        Symbol: order.symbol,
        Lots: totalVolume,
        CreateDate: new Date(order.openingTime).getTime(),
        OpenOrderId: order.order,
        CloseOrderId: order.order,
        ClosePrice: weightedClosePrice.toFixed(5),
        EndDate: latestClosingTime,
        ProfitLoss: totalProfit,
        Swap: totalSwap,
        Commission: totalCommission,
        Partial: true,
      });
    }
  }

  return transformed;
};
