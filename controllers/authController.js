import {
  generateRefreshToken as generateRsaRefreshToken,
  generateAccessToken,
} from "../utils/jwt.js";
import clientProfileRepository from "../repositories/clientProfileRepository.js";
import whiteLabelRepository from "../repositories/whiteLabelRepository.js";
import {detectDevice,generateSessionId } from "../utils/utility.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import tradingAccountRepository from "../repositories/tradingAccountRepository.js";
import {
  getClientContext,
  decrypt,
  generateToken,
  generateRefreshToken as generateLegacyRefreshToken,
  verifyRefreshToken,
} from "../utils/authUtils.js";
import bcrypt from "bcryptjs";
import { LOGIN_TYPES } from "../config/constants.js";
import env from "../config/env.js";


export const generateJWTAndLogin = async (req, res) => {
try {
    // 1. Pull context prepared by middlewares.
    const payload = req.tokenPayload;
    const whiteLabel = req.whiteLabel;
    const device = detectDevice(req.headers["user-agent"] ?? "UNKNOWN");
    const { clientType, deviceId } = getClientContext(req);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired JWT token",
      });
    }
    if (!whiteLabel || !req.whiteLabelId) {
      return res.status(400).json({
        success: false,
        message: "Invalid domain or WhiteLabel context",
      });
    }

    // 2. Validate whiteLabel context.
    const whiteLabelId = req.whiteLabelId;

    const { userId, 
        email, 
        country, 
        phoneNo,
        name,
        status,
        countryCode,
        } = payload;
    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: "JWT payload must contain userId and email.",
      });
    }

    // ——— 5. Find or create ctUserData ———
    const ctUserData = await clientProfileRepository.findOrCreate({
        email,
        name,
        whiteLabel:whiteLabelId,
        userId,
        status,
        phoneNo,
        countryCode,
        country,
        type: LOGIN_TYPES.SSO
    });
    // // check for existing sessionId 
    // let subSessionId = null;
    // if(clientType === "WEB" && ctUserData.tokens?.web?.currentSessionId){
    //   subSessionId = ctUserData.tokens.web.currentSessionId;
    // } else if(clientType === "MOBILE" && ctUserData.tokens?.mobile?.currentSessionId){
    //   subSessionId = ctUserData.tokens.mobile.currentSessionId;
    // };
     // ——— 8. Create session ———
    const sesId = generateSessionId();
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // ——— 9. Create refresh token ———
    const refreshToken = generateRsaRefreshToken({
      id: ctUserData._id,
      userId: ctUserData.userId,
      whiteLabelId,
      clientType,
      sessionId: sesId,
      sessionExpiry,
    });
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ——— 10. Generate tokens ———
    const accessToken = generateAccessToken({
      id: ctUserData._id,
      userId: ctUserData.userId,
      whiteLabelId,
      clientType,
      sessionId: sesId,
      sessionExpiry,
    });

    // ——— 11. Save tokens and session to user ———
    let updateQuery = {
      type: LOGIN_TYPES.SSO,
    };

    if (clientType === "WEB") {
    updateQuery["tokens.web"] = {
        refreshToken: {
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        },
        currentSessionId: sesId,
        lastLogoutAt: null,
    };
    } else if (clientType === "MOBILE") {
    updateQuery["tokens.mobile"] = {
        refreshToken: {
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        },
        currentSessionId: sesId,
        deviceId: deviceId,
        lastLogoutAt: null,
    };
    }

    await clientProfileRepository.update(ctUserData._id, {
    $set: updateQuery,
    });

    res.cookie("refreshToken", refreshToken, 
      { httpOnly: true, 
        secure: true, sameSite: "Strict", 
        maxAge: 7 * 24 * 60 * 60 * 1000, }); 
        
    res.cookie("accessToken", accessToken, 
      { httpOnly: true, 
        secure: true, 
        sameSite: "Strict", 
        maxAge: 15 * 60 * 1000, });

    // ——— 12. Send response ———
    return res.json({
      success: true,
      message: "Login successful",
      // accessToken,
      // refreshToken,
    });
  } catch (error) {
    console.error("Error in generateJWTAndLogin:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

const checkValidWhiteLabel = async (origin, user) => {
  try {
    const whiteLabelInfo = await whiteLabelRepository.findWhiteLabelById(
      user?.whiteLabel,
    );
    if (whiteLabelInfo?.website === origin) {
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const login = asyncHandler(async (req, res) => {
  const { email, password, userId, otpCode } = req.body;
  const sessionId = generateSessionId();
  const ip = req.ip;
  const deviceType = detectDevice(req.headers["user-agent"] || "UNKNOWN");
  const { clientType, deviceId } = getClientContext(req);
  if (clientType === "MOBILE" && !deviceId) {
    return res.error("Device ID required for mobile login", 400);
  }


  try {
    let origin = req.headers.origin;
    // let origin;
    if (!origin || origin.split(":").includes("http://localhost")) {
      origin = "https://client.clashdx.com";
    }
    const decryptedIdentifier = userId ? decrypt(userId) : decrypt(email);
    const client =
      await clientProfileRepository.findClientByEmail(decryptedIdentifier);
    if (!client) {
      return res.error("Invalid User Credentials", 401);
    }

    const decryptedPassword = decrypt(password);
    // console.log(decryptedPassword);
    const isValidPassword = await bcrypt.compare(
      decryptedPassword,
      client.password,
    );
    if (!isValidPassword) {
      return res.error("Invalid Password Credentials", 401);
    }
    if (client.status.toLowerCase() === "blocked") {
      return res.error(
        "Profile Has Been Blocked! Please reach out to our support team",
        401,
      );
    }


    return generateAndReturnTokens(client, res, sessionId, {
      clientType,
      deviceId,
    });
  } catch (error) {
    return res.error(
      `An error occurred during login. Please try again later: ${error.message}`,
      500,
    );
  }
});

const generateAndReturnTokens = async (
  client,
  res,
  sessionId,
  context = { clientType: "WEB", deviceId: null },
) => {
  // console.log(client);
  // const accessToken = generateAccessToken({
  //   id: client._id,
  //   userId: client.userId,
  //   whiteLabelId: client.whiteLabel,
  //   clientType:context.clientType,
  //   sessionId: sessionId,
  //   sessionExpiry: new Date(Date.now() + 15 * 60 * 1000),
  // });
  const accessToken = generateToken(
    client._id,
    client.email,
    client.userId,
    client.whiteLabel,
    sessionId,
    context.clientType,
  );
  const refreshToken = generateLegacyRefreshToken(
    client._id,
    client.email,
    client.userId,
    client.whiteLabel,
    context.clientType,
  );
  // client.token = refreshToken;
  if (context.clientType === "WEB") {
    client.tokens.web = {
      refreshToken: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      currentSessionId: sessionId,
      subSessionId: sessionId,
      lastLogoutAt: null,
    };
  }

  if (context.clientType === "MOBILE") {
    client.tokens.mobile = {
      refreshToken: {
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      currentSessionId: sessionId,
      subSessionId: sessionId,
      deviceId: context.deviceId,
      lastLogoutAt: null,
    };
  }

  await client.save();
const data = await tradingAccountRepository.getAllTradingAccountsByUniqueKey(
      "ClientId",
      client._id,
      ["marginFree", "login", "-_id"],
    );
    console.log(data);
  
  return res.success(
    {
      sessionId: sessionId,
      user: {
        _id: client._id,
        email: client.email,
        userId: client.userId,
        accessToken,
        refreshToken,

        role: client.role,
        tradingAccLimit: client.tradingAccLimit,
        countryCode: client.countryCode,
        country: client.country,
        name: client.name,
        phoneNo: client.phoneNo
      },
    },
    "Login successful",
  );
};

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.headers?.cookie
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("refreshToken="))
      ?.split("=")
      .slice(1)
      .join("=");

  if (!refreshToken) {
    return res.error("No refresh token provided", 400);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    return res.error("Invalid or expired refresh token", 401);
  }

  const { id, clientType } = decoded;

  if (!clientType) {
    return res.error("Client type missing in token", 400);
  }

  const client = await clientProfileRepository.getClientById(id);
  if (!client) {
    return res.error("Client not found", 404);
  }

  const tokenPath = clientType === "WEB" ? "tokens.web" : "tokens.mobile";
  const tokenBucket = clientType === "WEB" ? client.tokens?.web : client.tokens?.mobile;

  if (!tokenBucket || tokenBucket.refreshToken?.token !== refreshToken) {
    return res.error("Session expired or logged in from another device", 401);
  }
  const sessionId = generateSessionId();

  const newAccessToken = generateToken(
    client._id,
    client.email,
    client.userId,
    client.whiteLabel,
    sessionId,
    clientType,
  );

  const newRefreshToken = generateLegacyRefreshToken(
    client._id,
    client.email,
    client.userId,
    client.whiteLabel,
    clientType,
  );

  const updateData = {
    [`${tokenPath}.refreshToken`]: {
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    [`${tokenPath}.currentSessionId`]: sessionId,
    [`${tokenPath}.subSessionId`]: sessionId,
    [`${tokenPath}.lastLogoutAt`]: null,
  };

  await clientProfileRepository.updateOneRecord(
    { _id: client._id, [`${tokenPath}.refreshToken.token`]: refreshToken },
    { $set: updateData },
  );

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.success(
    {},
    "Token refreshed successfully",
  );
});

export const logout = asyncHandler(async (req, res) => {
  const { id, clientType, sessionId } = req.user || {};

  if (!id || !clientType || !sessionId) {
    return res.error("Invalid user session", 400);
  }

  const tokenPath = clientType === "WEB" ? "tokens.web" : "tokens.mobile";
  const now = new Date();

  const updateResult = await clientProfileRepository.updateOneRecord(
    { _id: id, [`${tokenPath}.currentSessionId`]: sessionId },
    {
      $set: {
        [`${tokenPath}.lastLogoutAt`]: now,
        [`${tokenPath}.refreshToken.token`]: null,
        [`${tokenPath}.refreshToken.expiresAt`]: null,
        [`${tokenPath}.currentSessionId`]: null,
        [`${tokenPath}.subSessionId`]: null,
      },
    },
  );

  if (!updateResult?.matchedCount) {
    return res.error("Session mismatch or already logged out", 401);
  }

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return res.success({}, "Logout successful");
});

export const authenticateOtp = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const client = await clientProfileRepository.getClientById(id);
  if (!client) {
    return res.error("Client not found! Please refresh you token", 500);
  }
  const otpResult = await client.generateAndSendOTP();
  const tempToken = jwt.sign(
    {
      email: client.email,
      type: "withdraw_request",
    },
    process.env.TEMP_TOKEN_SECRET,
    { expiresIn: "15m" },
  );
  const response = {
    status: "Success!",
    message: `OTP sent to your ${otpResult?.authMode} for verification.`,
    otpSent: otpResult?.status,
    tempToken: tempToken,
  };
  return res.customSuccess(response, 200);
});

export const authenticateOtpValidate = asyncHandler(async (req, res) => {
  const { otpCode, tempToken } = req.body;
  const { id } = req.user;
  const client = await clientProfileRepository.getClientById(id);
  if (!client) {
    return res.error("Client not found! Please refresh you token", 500);
  }
  if (!client.validateOTP(otpCode)) {
    return res.error("Invalid or Expired OTP", 400);
  }
  const decoded = jwt.verify(tempToken, env.TEMP_TOKEN_SECRET);
  if (decoded.type !== "withdraw_request" || decoded.email !== client.email) {
    return res.error("Token Invalid", 400);
  }
  client.TwoFactorCompletion.otpSecret = null;
  client.TwoFactorCompletion.otpExpiresAt = null;
  await client.save();
  return res.success(null, "OTP validated successfully");
});