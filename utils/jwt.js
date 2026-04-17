import { privateKey } from "../config/keyLoader.js";
import jwt from 'jsonwebtoken';

JWT_SECRET = process.env.JWT_SECRET;
JWT_ISSUER = process.env.JWT_ISSUER;
JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY;
JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY;

export const generateRSAToken = (payload, expiresIn = "5m") => {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn: expiresIn,
    // issuer: JWT_ISSUER,
  });
};

export const verifyRSATokenData = (token, publicKey) => {
  try {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      // issuer: JWT_ISSUER,
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
    issuer: JWT_ISSUER,
  });
};

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: JWT_ISSUER,
  });
};
