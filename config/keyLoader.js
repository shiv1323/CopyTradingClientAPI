import fs from "fs";
import path from "path";

const privateKey = fs.readFileSync(
  path.join(process.cwd(), "config/keys/private.pem"),
  "utf8"
);
const publicKey = fs.readFileSync(
  path.join(process.cwd(), "config/keys/public.pem"),
  "utf8"
);
export { privateKey, publicKey };