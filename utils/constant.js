export const USER_ROLES = {
    SU: 'SUPERADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
  };
  
  // Mongoose enum helpers
  export const USER_STATUS_ENUM = ['active', 'suspended'];
  export const USER_ROLE_NAME_ENUM = [USER_ROLES.SU, USER_ROLES.ADMIN, USER_ROLES.MANAGER];
  
  export const COPY_REASON_ENUM = ['TRADER', 'MANAGER', 'EXPERT'];
  export const COPY_MODE_ENUM = ['BALANCE', 'EQUITY', 'VOLUME_PERCENT', 'FIXED'];
  
  export const CT_MASTER_REQUEST_STATUS_ENUM = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELATION',
    'CANCELLED',
  ];
  export const CT_MASTER_REQUEST_TYPE_ENUM = ['MARK', 'UNMARK'];
  
  export const CT_FOLLOW_REQUEST_STATUS_ENUM = [0, 1, 2, 3, 4, 5]; // 0: PENDING, 1: Approved by Master, 2: Approved by Admin, 3:Rejected By Master, 4: Rejected By Admin, 5: Invalidated Request
  
  export const TRADING_CONDITION_ENUM = ['EQUITY', 'BALANCE', 'FIXED', 'VOLUME_PERCENT']; // Equity: Equity based trading, Balance: Balance based trading, Fixed: Fixed volume trading, Volume Percent: Volume percentage trading
  
  export const TRADE_EXEC_STAGE_STATUS_ENUM = [
    'PENDING',
    'PASSED',
    'FAILED',
    'DONE',
    'SENT',
    'CONFIRMED',
    'SKIPPED',
  ];
  export const TRADE_EXEC_TYPE_ENUM = ['OPEN', 'CLOSE', 'PARTIAL_CLOSE']; // Open: Open position, Close: Close position, Partial Close: Partial close position
  export const TRADE_EXEC_FINAL_STATUS_ENUM = [
    'SUCCESS',
    'FAILED_VALIDATION',
    'FAILED_VOLUME',
    'FAILED_MARGIN',
    'FAILED_RUNTIME',
  ];
  
  export const IB_COMMISSION_TYPE_ENUM = ['FIXED', 'PERCENTAGE'];
  
  export const CLIENT_STATUS_ENUM = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'];
  export const EXPIRES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  export const STATUS_MAP = {
    PENDING: 0,
    APPROVED_BY_MASTER: 1,
    APPROVED_BY_ADMIN: 2,
    REJECTED_BY_MASTER: 3,
    REJECTED_BY_ADMIN: 4,
    INVALIDATED: 5,
  };
  
  /** Client transaction / ledger enums */
  export const VerificationStatus = Object.freeze({
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
  });
  
  export const PAYMENT_STATUS = Object.freeze({
    DEPOSITE: "DEPOSIT",
    WITHDRAWL: "WITHDRAWAL",
    INTERNAL_TRANSFER: "INTERNAL_TRANSFER",
    CREDITIN: "CREDITIN",
    CREDITOUT: "CREDITOUT",
    BONUSIN: "BONUSIN",
    BONUSOUT: "BONUSOUT",
    CORRECTIONIN: "CORRECTIONIN",
    CORRECTIONOUT: "CORRECTIONOUT",
    CHARGEIN: "CHARGEIN",
    CHARGEOUT: "CHARGEOUT",
    WITHDRAWALOUT: "WITHDRAWALOUT",
    DEPOSITIN: "DEPOSITIN",
  });
  
  export const TRANSACTION_TYPES = Object.freeze({
    DEPOSIT: "DEPOSIT",
    WITHDRAWAL: "WITHDRAWAL",
    CREDIT: "CREDIT",
    CHARGE: "CHARGE",
    DEBIT: "DEBIT",
    TRANSFER: "TRANSFER",
    BONUS: "BONUS",
    CORRECTION: "CORRECTION",
    REVERSAL: "REVERSAL",
    WITHDRAWALOUT: "WITHDRAWALOUT",
    BALANCE: "BALANCE",
  });
  
  export const TRANSACTION_STATUSES = Object.freeze({
    INITIATED: "INITIATED",
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    REVERSED: "REVERSED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
  });
  
  export const ACCOUNT_TYPE = Object.freeze({
    WALLET: "WALLET",
    TRADING_ACCOUNT: "TRADING",
  });
  