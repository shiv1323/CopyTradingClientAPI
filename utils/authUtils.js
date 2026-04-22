import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";

dotenv.config();
const ENCRYPTION_KEY1 = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY1); 
const ENCRYPTION_KEY2 = CryptoJS.enc.Hex.parse(process.env.ENCRYPTION_KEY2); 
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export const generateToken = (id, email,userId,whiteLabel,sessionId,clientType) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const payload = { id: id, email: email, userId:userId ,whiteLabel:whiteLabel,sessionId:sessionId,iat: currentTime,clientType};
  const encryptedPayload = encrypt(JSON.stringify(payload));
  const token = jwt.sign({ data: encryptedPayload}, JWT_SECRET, {
    expiresIn: "10m",
  });
  return token;
};
export const generateRefreshToken = (id, email,userId,whiteLabel,clientType) => {
  const payload = {
    id: id,
    email: email,
    userId: userId,
    whiteLabel:whiteLabel,
    clientType
  };
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return token;
};
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decryptedPayload = JSON.parse(decrypt(decoded.data));
    return decryptedPayload;
  } catch (err) {
    throw new Error("Invalid or expired access token");
  }
};
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
};
export const encrypt = (text) => {
  if (typeof text !== "string") {
    throw new Error("Input text must be a string");
  }
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted1 = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY1, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const encrypted2 = CryptoJS.AES.encrypt(
    encrypted1.toString(),
    ENCRYPTION_KEY2,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted2.toString()}`;
};
export const decrypt = (encryptedText) => {
  if (typeof encryptedText !== "string") {
    throw new Error("Encrypted text must be a string");
  }
  const parts = encryptedText.split(":");
  const iv = CryptoJS.enc.Hex.parse(parts[0]);
  const encryptedTextPart = parts[1];
  const decrypted1 = CryptoJS.AES.decrypt(encryptedTextPart, ENCRYPTION_KEY2, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const decrypted2 = CryptoJS.AES.decrypt(
    decrypted1.toString(CryptoJS.enc.Utf8),
    ENCRYPTION_KEY1,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );
  return decrypted2.toString(CryptoJS.enc.Utf8);
};
export const encryptPasswordForStorage = async (password) => {
  const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
  return await bcrypt.hash(password, saltRounds);
};
export async function fetchIp() {
  const { ip } = await (await fetch("https://ipecho.io/json")).json();
  return ip;
}
export const encryptTextMt5 = (data) => {
  try {
    const key = CryptoJS.enc.Hex.parse(process.env.CRYPTOJS_KEYMT5);
    const iv = CryptoJS.enc.Hex.parse(process.env.CRYPTOJS_IVMT5);

    const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv }).ciphertext;
    return encrypted.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.log("In catch", error);
    return "";
  }
};

export const decryptTextMt5 = (encryptedDataHex) => {
  try {
    const key = CryptoJS.enc.Hex.parse(process.env.CRYPTOJS_KEYMT5);
    const iv = CryptoJS.enc.Hex.parse(process.env.CRYPTOJS_IVMT5);

    const ciphertext = CryptoJS.enc.Hex.parse(encryptedDataHex);

    const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertext }, key, {
      iv: iv,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.log("In catch", error);
    return "";
  }
};


export function detectDevice(userAgent) {
  if (!userAgent) {
    return "UNKNOWN";
  }

  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    return "Mobile";
  } else if (/Macintosh|Windows|X11/i.test(userAgent)) {
    return "Desktop";
  }

  return "UNKNOWN";
}


export const getClientContext = (req) => {
  const ua = req.headers["user-agent"] || "";
  const appId = req.headers["x-app-id"];
  const deviceId = req.headers["x-device-id"];

  if (appId && deviceId) {
    return {
      clientType: "MOBILE",
      deviceId,
      appId
    };
  }

  return {
    clientType: "WEB",
    deviceId: null,
    appId: null
  };
};