import { publicKey } from "../config/keyLoader.js";
import { verifyUserAxios } from "../utils/verifyUserAxios.js";
import { verifyRSATokenData, generateRefreshToken, generateAccessToken } from "../utils/jwt.js";
import clientProfileRepository from "../repositories/clientProfileRepository.js";
import whiteLabelRepository from "../repositories/whiteLabelRepository.js";
import {detectDevice,generateSessionId } from "../utils/utility.js";
// export const createLoginActivity = async ({
//   clientId,
//   userId,
//   sessionId,
//   ipAddress,
//   deviceDetails,
//   location,
//   status,
//   authenticationMethod,
//   twoFactorAuthenticated = false,
//   failureReason = null,
//   failureCode = null,
//   clientType,
//   sid,
// }) => {
//   const loginActivityData = {
//     clientId: userId ?? clientId,
//     sessionId,
//     ipAddress,
//     deviceDetails,
//     location,
//     status,
//     authenticationMethod,
//     twoFactorAuthenticated,
//     failureReason,
//     failureCode,
//     loginTimestamp: Date.now(),
//     clientType,
//     sid,
//   };
//   try {
//     const activity =
//       await loginActivityRepository.createActivityLog(loginActivityData);
//       console.log(activity);
//     return activity;
//   } catch (error) {
//     logger.error("Error saving login activity:", error);
//     throw new Error("Failed to save login activity.");
//   }
// };

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
    const refreshToken = generateRefreshToken({ userId: ctUserData.userId, ctUserId: ctUserData._id });
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
