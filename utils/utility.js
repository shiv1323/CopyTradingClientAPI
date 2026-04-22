import crypto from "crypto";
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

export function generateSessionId() {
const timestamp = Date.now().toString(36);
const randomPart = crypto.randomBytes(8).toString("hex");
return `${timestamp}-${randomPart}`;
}