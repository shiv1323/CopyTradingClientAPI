// import transactionService from '../services/transactionService.js';
// import apiResponse from '../utils/apiResponse.js';

// exports.transferFromWalletToTrading = async (req, res) => {
//   try {
//     const { clientId, tradingAccountId, amount, comment } = req.body;
//     const result = await transactionService.transferFromWalletToTrading(clientId, tradingAccountId, amount, comment);
//     apiResponse.success(res, "Transfer successful", result);
//   } catch (err) {
//     apiResponse.error(res, "Transfer failed", err.message);
//   }
// };

// exports.withdrawFromTradingToWallet = async (req, res) => {
//   try {
//     const { clientId, tradingAccountId, amount, comment } = req.body;
//     const result = await transactionService.withdrawFromTradingToWallet(clientId, tradingAccountId, amount, comment);
//     apiResponse.success(res, "Withdrawal successful", result);
//   } catch (err) {
//     apiResponse.error(res, "Withdrawal failed", err.message);
//   }
// };
