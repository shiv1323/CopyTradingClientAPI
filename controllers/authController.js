import { publicKey } from "../config/keyLoader.js";

import { verifyUserAxios } from "../utils/verifyUserAxios.js";
import {
  verifyRSATokenData,
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


export const generateJWTAndLogin = async (req, res) => {
try {
    // 1. Extract request data 
    const { token, domain, sessionId} = req.body || req.query || {};
    const device = detectDevice(req.headers["user-agent"] ?? "UNKNOWN");
    const { clientType, deviceId } = getClientContext(req);
    const loginSessionId = generateSessionId();

    const loginActivityPayload = {
      sessionId: loginSessionId,
      loginTimestamp: new Date(),
      ipAddress: req.ip,
      clientType,
      deviceDetails: { type: device, deviceId },
      location: { country: null, city: null },
      status: "IN_PROGRESS",
    };

    // 2. Validate token and retrieve user info
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "JWT token is required in body.",
      });
    }
    if (!domain) {
        return res.status(400).json({
            success: false,
            message: "Domain is required",
        });
        }

    // 3. Validate whiteLabel domain 
    const whiteLabel = await whiteLabelRepository.findByDomain(domain);
    if (!whiteLabel) {
      return res.status(403).json({
        success: false,
        message:
          "Invalid domain. This whiteLabel is not registered or inactive.",
      });
    }
    const whiteLabelId = whiteLabel._id.toString();

    // 4. Verify token and extract user info 
    let payload;
    try {
      payload = verifyRSATokenData(token, publicKey);
      const verifyUser = await verifyUserAxios({ userId: payload.userId });
      if (!verifyUser.success) {
        return res.status(400).json({
          success: false,
          message: verifyUser.message,
        });
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired JWT token",
        error: err.message,
      });
    }

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
    });

    // ——— 6. Check blocked user ———
    // if (ctUserData.isBlocked) {
    //   await createLoginActivity({
    //     ...loginActivityPayload,
    //     status: "BLOCKED",
    //     failureReason: "User Status Is Blocked!",
    //     failureCode: HTTP_STATUS.UNAUTHORIZED,
    //     sid: sessionId,
    //   });
    //   failedLogins.inc();
    //   return ApiResponse.error(
    //     res,
    //     "Profile Has Been Blocked! Please reach out to our support team",
    //     HTTP_STATUS.UNAUTHORIZED
    //   );
    // }

    // ——— 7. Create login activity (login event only; no logoutTimestamp) ———
    const refreshToken = generateRsaRefreshToken({
      userId: ctUserData.userId,
      ctUserId: ctUserData._id,
    });
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sesId = generateSessionId();

    // await createLoginActivity({
    //   ...loginActivityPayload,
    //   status: "SUCCESS",
    //   sessionId: sesId,
    //   ipAddress: req.ip,
    //   deviceDetails: { type: device, deviceId },
    //   location: { country: null, city: null },
    //   sid: sessionId,
    // });

     // ——— 8. Create session ———
    // const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    req.session.userId = ctUserData.userId;
    req.session.name = name;
    req.session.email = email;
    req.session.whiteLabelId = whiteLabelId;
    req.session.ctUserId = ctUserData._id.toString();
    req.session.sessionId = sesId;
    // ——— 10. Generate tokens ———
    const accessToken = generateAccessToken({
      ctUserId: ctUserData._id,
      userId: ctUserData.userId,
      name,
      email,
    });

    // ——— 11. Save tokens and session to user ———
    let updateQuery = {};

    if (clientType === "WEB") {
    updateQuery["tokens.web"] = {
        refreshToken: {
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        },
        currentSessionId: sesId,
        subSessionId: null,
        lastLogoutAt: null,
    };
    } else if (clientType === "MOBILE") {
    updateQuery["tokens.mobile"] = {
        refreshToken: {
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        },
        currentSessionId: sesId,
        subSessionId: null,
        deviceId: deviceId,
        lastLogoutAt: null,
    };
    }

    await clientProfileRepository.update(ctUserData._id, {
    $set: updateQuery,
    });

    // ——— 12. Send response ———
    return res.json({
      success: true,
      message: "Login successful",
      user: {
        ctUserId: ctUserData._id,
        userId: ctUserData.whiteLabelUserId,
        loginType: ctUserData.loginType,
        name,
        email,
        phone: ctUserData.phone,
        country: ctUserData.country,
        lastLoginAt: ctUserData.lastLoginAt,
        lastActiveAt: ctUserData.lastActiveAt,
      },
      accessToken,
      refreshToken,
      whiteLabel: {
        primaryColor: whiteLabel.primaryColor,
        logo: whiteLabel.logo,
      },
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
  const { refreshToken } = req.body;

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
  const sessionId = generateSessionId();

  if (!clientType) {
    return res.error("Client type missing in token", 400);
  }

  const client = await clientProfileRepository.getClientById(id);
  if (!client) {
    return res.error("Client not found", 404);
  }

  const tokenBucket =
    clientType === "WEB" ? client.tokens?.web : client.tokens?.mobile;

  if (!tokenBucket || tokenBucket.refreshToken?.token !== refreshToken) {
    return res.error("Session expired or logged in from another device", 401);
  }

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

  tokenBucket.refreshToken = {
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  tokenBucket.currentSessionId = sessionId;
  tokenBucket.subSessionId = sessionId;
  tokenBucket.lastLogoutAt = null;
  if (clientType === "MOBILE") {
    tokenBucket.deviceId = null;
  }

  await client.save();

  if (clientType === "WEB") {
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return res.success(
    {
      refreshed_Token: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    },
    "Token refreshed successfully",
  );
});