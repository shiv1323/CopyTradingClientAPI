import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import tradingAccountRepository from "../repositories/tradingAccountRepository.js";
import { catchAsync } from "../middlewares/catchAsync.js";
import orderHistoryRepository from "../repositories/orderHistoryRepository.js";
import tradeReportRepository from "../repositories/tradeReportRepository.js";
import moment from "moment";
import { postReqMT5Server } from "../utils/mt5ServerUtils.js";
import { MTAPI_ROUTES } from "../config/mtTerminalConstanats.js";



export const getTrAccountDdown = asyncHandler(async (req, res) => {
  const { id, whiteLabel, userId } = req.user;
  const filter = {
    WhiteLabel: whiteLabel,
    ClientId: id,
  };
  const trAccountDdown =
    await tradingAccountRepository.getTradingAccountByField(filter);
  //   console.log(trAccountDdown);
  const trAccountRes = trAccountDdown
    ?.map((acc) => {
      //   console.log(acc?.ManagerType);
      //   let accountType = acc?.Group.split("\\")[0];
      let groupSuffix = acc?.Group.split("\\")[1];
      if (acc?.ManagerType.toLowerCase() == "real") {
        return {
          id: acc?._id,
          ClientId: acc?.ClientId,
          WhiteLabel: acc?.WhiteLabel,
          Login: `${groupSuffix} ${acc?.Login}`,
        };
      }
      return null;
    })
    .filter((acc) => acc !== null);
  res.success(
    { ClientsTradingAccounts: trAccountRes },
    "Retrived Trading Account",
    200
  );
});

const getUnrealisedPLandEquity = async(clientId,accountId,user,fromDate,toDate)=>{
  try{
    let profitLoss = 0.00,equity = 0.00;
    // const fromDateUn = new Date(fromDate).getTime() / 1000; 
    // const  toDateUn = new Date(toDate).getTime() / 1000; 

    const fromDateUn = Math.floor(new Date(fromDate).getTime() / 1000);
    const toDateUn = Math.floor(new Date(toDate).getTime() / 1000);
    // console.log(fromDateUn,toDateUn);

    const filter = {ClientId : new mongoose.Types.ObjectId(clientId),
      ManagerType :"real"}
      if(accountId){
        filter.Login = accountId
      }
      // console.log(filter);
    const getTradingAcc = await tradingAccountRepository.getAccByOptions(filter);
    // console.log(getTradingAcc);
    const openOrderArray = []
    if (getTradingAcc?.length) {
      const promises = getTradingAcc.map(async (account) => {
        equity =parseFloat(equity)+parseFloat(account?.Equity)
        const answer = await postReqMT5Server(
          MTAPI_ROUTES.GET_POSITION_INFO,
          { login: account?.Login },
          user,
          "real"
        );
        // console.log(answer) 
        if (answer?.success) {
          return answer?.data?.answer;
        }
        return []; 
      });
      const results = await Promise.all(promises); 
      //console.log(results)
      openOrderArray.push(...results.flat());
      //console.log(openOrderArray)
      openOrderArray.map((order)=>{
        if(order?.TimeCreate >= fromDateUn && order?.TimeCreate <= toDateUn){
          profitLoss = parseFloat((profitLoss + parseFloat(order?.Profit)).toFixed(2))
        }
      })
      return {profitLoss,equity} 
    }
    return {profitLoss,equity};
  }
  catch(error){
    let profitLoss = 0.00,equity = 0.00;
    console.log(error);
    return {profitLoss,equity};
  }
}

export const getSummaryReport = asyncHandler(async (req, res) => {
  const { id, whiteLabel, userId } = req.user;
  let { accountId , fromDate, toDate } = req.body;
  // let from = new Date(fromDate);
  // let to = new Date(toDate);
  // to.setDate(to.getDate() + 1);
  // fromDate = moment(fromDate, "DD-MM-YYYY HH:mm:ss").toISOString();
  // toDate = moment(toDate, "DD-MM-YYYY HH:mm:ss").toISOString();
  fromDate = new Date(fromDate);
  toDate = new Date(toDate);
  //console.log(fromDate,toDate)
  let filter = {
    whiteLabel : whiteLabel,
    clientId : id,
    closingTime : {$gte: fromDate, $lte: toDate }
  };
  if(accountId){
    filter.accountId = accountId;
  }
  //console.log(filter)
  const {profitLoss,equity} = await getUnrealisedPLandEquity(id,accountId,req.user,fromDate,toDate)
  const getData = await tradeReportRepository.getAggregate([
    { $match: filter },
    {
        $group: {
            _id: null,
            totalOrdersInProfit: { $sum: { $cond: [{ $gt: ["$profit", 0] }, 1, 0] } },
            totalOrdersInLoss: { $sum: { $cond: [{ $lte: ["$profit", 0] }, 1, 0] } },
            totalProfit: { $sum: { $cond: [{ $gt: ["$profit", 0] }, "$profit", 0] } },
            totalLoss: { $sum: { $cond: [{ $lte: ["$profit", 0] }, "$profit", 0] } },
            totalVolume: { $sum: "$volume" }
        }
    }
])
const result = {
  totalOrdersInLoss : getData?.[0]?.totalOrdersInLoss || 0,
  totalOrdersInProfit : getData?.[0]?.totalOrdersInProfit || 0,
  totalProfit : getData?.[0]?.totalProfit || 0,
  totalLoss: getData?.[0]?.totalLoss || 0,
  totalPL : parseFloat(((getData?.[0]?.totalProfit || 0) + (getData?.[0]?.totalLoss || 0)).toFixed(2)) ,
  totalOrders : (getData?.[0]?.totalOrdersInLoss || 0) + (getData?.[0]?.totalOrdersInProfit || 0) ,
  tradingVolume : getData?.[0]?.totalVolume || 0,
  lifetimeTradingVolume : 0,
  equity : equity,
  currentEquity : equity,
  unrealizedPL : profitLoss 
}
//console.log(result);
return res.success(result,"Summary Fetched")
});
