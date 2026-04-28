import clientProfileRepository from "../repositories/clientProfileRepository.js";
import { verifyAccessTokenData, verifyRSATokenData } from "../utils/jwt.js";
import { publicKey  } from "../config/keyLoader.js";
import { verifyToken } from "../utils/authUtils.js";
const getCookieValue = (cookieHeader = "", cookieName) => {
  if (!cookieHeader || !cookieName) return null;
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
};
// export const authHandler = async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     try {
//       token = req.headers.authorization.split(" ")[1];
//       const decoded = verifyToken(token);
//       const tokenIssuedAt = decoded.iat || Math.floor(Date.now() / 1000);
//       // console.log(tokenIssuedAt);
//       const user = await clientProfileRepository.getClinetLastLogout(
//         decoded.id,tokenIssuedAt
//       );
//       // console.log(user);
//       if (!user) {
//         throw new Error("Access Token Expired");
//       }
//       if(decoded?.sessionId != user?.tokens?.subSessionId){
//         throw new Error("Session Expired");
//       }
//       req.user = {
//         ...user._doc,
//         id: user?._id,
//       };
//       // console.log(req.user);
//       next();
//     } catch (error) {
//       return res.status(401).json({
//         success: false,
//         message: "Not authorized, token validation failed",
//       });
//     }
//   } else {
//     return res.status(401).json({
//       success: false,
//       message: "Not authorized, no token provided",
//     });
//   }
// };


export const authHandler = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = verifyToken(token);
      const { id, clientType, sessionId, iat } = decoded;
      if (!clientType || !sessionId) {
        throw new Error("Invalid token payload");
      }
      const tokenBucket =
        clientType === "WEB" ? "tokens.web" : "tokens.mobile";

      /**
       * Fetch user + validate:
       * - lastLogoutAt
       * - session binding
       */
      const user =
        await clientProfileRepository.getClientLastLogoutByClientType(
          id,
          iat,
          clientType
        );

      if (!user) {
        throw new Error("Access token expired");
      }

      const storedSessionId = user?.tokens?.[clientType.toLowerCase()]
        ?.subSessionId;

      if (!storedSessionId || storedSessionId !== sessionId) {
        throw new Error("Session expired");
      }

      req.user = {
        id: user._id,
        clientType,
        sessionId,
        ...user._doc,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || "Not authorized",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};
// export const authHandler = async (req, res, next) => {
// try {
//     const accessTokenFromCookie =
//       req.cookies?.accessToken ||
//       getCookieValue(req.headers.cookie, "accessToken");
//     const token = accessTokenFromCookie || req.headers.authorization?.split(" ")[1];
//     console.log(token);

//     if (!token) {
//       return res.status(401).json({ message: "No token" });
//     }
//     let decoded;
//     try {
//       // Primary path for app login cookies/tokens.
//       decoded = verifyAccessTokenData(token);
//     } catch (accessTokenError) {
//       // Backward compatibility for RS256 tokens.
//       const publicKeyValue = publicKey;
//       if (!publicKeyValue) {
//         return res.status(400).json({
//           success: false,
//           message: "Public key is required",
//         });
//       }
//       decoded = verifyRSATokenData(token, publicKeyValue);
//     }
//     const { id, clientType, sessionId, iat } = decoded;
//     if (!id || !clientType || !sessionId) {
//       return res.status(401).json({ message: "Invalid token payload" });
//     }

//     /**
//        * Fetch user + validate:
//        * - lastLogoutAt
//        * - session binding
//        */
//       const user =
//       await clientProfileRepository.getClientLastLogoutByClientType(
//         id,
//         iat,
//         clientType
//       );

//        if (!user) {
//       return res.status(401).json({
//         message: "Access token expired",
//       });
//     }

//     // 4. Validate session (IMPORTANT FIX HERE)
//     const storedSessionId =
//       user?.tokens?.[clientType.toLowerCase()]?.currentSessionId;

//     if (!storedSessionId || storedSessionId !== sessionId) {
//       return res.status(401).json({
//         message: "Session expired",
//       });
//     }
//     // Attach user info
//     req.user = decoded;

//     next();
//   } catch (error) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// };