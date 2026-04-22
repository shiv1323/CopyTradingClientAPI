import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';

const JWT_SECRET =
  'E4jH2kK9nUqT8wV6zY5aD1mF4oR7lN5bY2hX6qH1sJ0pA8wZ9sR1vT4kJ7xM0y';
const ENCRYPTION_KEY1 =
  'fbccfa2e05dec20ef56ab55c34c70c3b487971643d3241626b5fff8a02d1c1a8';
const ENCRYPTION_KEY2 =
  '5b339cbc4fc60f67ff8ed4f5eb3c07e73850656dde226be582530e2df7dc030b';

// Encrypt text
export const encrypt = (text) => {
  if (typeof text !== 'string') {
    throw new Error('Input text must be a string');
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
// Decrypt text
export const decrypt = (encryptedText) => {
  if (typeof encryptedText !== 'string') {
    throw new Error('Encrypted text must be a string');
  }
  const parts = encryptedText.split(':');
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
// Create manager credentials
export const createManagerCred = (id, name, password, url) => {
  const payload = {
    manager: { login: id, password: password, name: name, URL: url },
  };
  const encryptedPayload = encrypt(JSON.stringify(payload));
  const token = jwt.sign({ data: encryptedPayload }, JWT_SECRET);
  return token;
};
// Verify token
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const decryptedPayload = JSON.parse(decrypt(decoded.data));
    return decryptedPayload;
  } catch (err) {
    throw new Error('Invalid or expired access token');
  }
};
