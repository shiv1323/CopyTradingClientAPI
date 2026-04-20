// Encrypt text
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
      },
    );
    return `${iv.toString(CryptoJS.enc.Hex)}:${encrypted2.toString()}`;
  };
  
  // Decrypt text
  export const decrypt = (encryptedText) => {
    try {
      if (typeof encryptedText !== "string") {
        throw new Error("Encrypted text must be a string");
      }
      const parts = encryptedText.split(":");
      const iv = CryptoJS.enc.Hex.parse(parts[0]);
      const encryptedTextPart = parts[1];
      const decrypted1 = CryptoJS.AES.decrypt(
        encryptedTextPart,
        ENCRYPTION_KEY2,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      const decrypted2 = CryptoJS.AES.decrypt(
        decrypted1.toString(CryptoJS.enc.Utf8),
        ENCRYPTION_KEY1,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        },
      );
      return decrypted2.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.log("Error while password decryption", error);
      return false
    }
  };
  