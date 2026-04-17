import crypto from "crypto";

export const generateHmac = (requestBody, secret) => {
  const sortedBody = Object.keys(requestBody)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = requestBody[key];
      return sorted;
    }, {});

  const keyBytes = Buffer.from(secret, "utf-8");

  const signature = crypto
    .createHmac("sha256", keyBytes)
    .update(JSON.stringify(sortedBody))
    .digest("hex");

  return signature;
};
