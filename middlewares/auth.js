import whiteLabelRepository from "../repositories/whiteLabelRepository.js";
import { verifyRSATokenData } from "../utils/jwt.js";
import { verifyUserAxios } from "../utils/verifyUserAxios.js";
import { publicKey  } from "../config/keyLoader.js";
export const validateWhiteLabel = async (req, res, next) => {
  try {
    const whiteLabel = await findWhiteLabelByDomain(req, res, next);
    // `findWhiteLabelByDomain` may already have responded (400/403/500).
    if (res.headersSent) return;
    if (!whiteLabel) return;
    // Attach whiteLabel to request
    req.whiteLabel = whiteLabel;
    req.whiteLabelId = whiteLabel._id.toString();

    next();
  } catch (error) {
    console.error('Error validating whiteLabel:', error);
    if (res.headersSent) return;
    return res.status(500).json({
      success: false,
      message: 'Error validating whiteLabel',
    });
  }
};

// find whiteLabel by domain 
export const findWhiteLabelByDomain = async (req, res, next) => {
  try {
    let domain = req.query.domain || req.body.domain;
    // console.log(domain);
    if (!domain && req.headers.referer) {
      try {
        const url = new URL(req.headers.referer);
        domain = url.hostname;
      } catch (e) {
        // Invalid referer URL, continue with domain as null
      }
    }

    // If still no domain, try origin header
    if (!domain && req.headers.origin) {
      try {
        const url = new URL(req.headers.origin);
        domain = url.hostname;
      } catch (e) {
        // Invalid origin URL
      }
    }

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required. Please provide domain parameter.',
      });
    }

    // Find whiteLabel by domain
    const whiteLabel = await whiteLabelRepository.getWhitelabelByWebsite(domain);

    if (!whiteLabel) {
      return res.status(403).json({
        success: false,
        message: 'Invalid domain. This whiteLabel is not registered or inactive.',
      });
    }
    return whiteLabel;
  } catch (error) {
    console.error('Error finding whiteLabel by domain:', error);
    return res.status(500).json({
      success: false,
      message: 'Error finding whiteLabel by domain',
    });
  }
}

export const verifyRSAToken = async (req, res, next) => {
  const token = req.body.token || req.query.token;
  const publicKeyValue = publicKey;
  if (!req.whiteLabelId || !req.whiteLabel) {
    return res.status(400).json({
      success: false,
      message: 'WhiteLabel context is missing',
    });
  }
  if (!publicKeyValue) {
    return res.status(400).json({
      success: false,
      message: 'Public key is required',
    });
  }
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'JWT token is required',
    });
  }
  try {
    const decoded = verifyRSATokenData(token, publicKeyValue);
    const verifyUser = await verifyUserAxios({ userId: decoded.userId });
    if (!verifyUser.success) {
      return res.status(400).json({
        success: false,
        message: 'User verification failed',
      });
    }
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    console.error('Error verifying RSA token:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired JWT token',
    });
  }
}