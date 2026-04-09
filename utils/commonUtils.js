import moment from "moment-timezone";

export function getUTCTime() {
  return moment.utc().format();
};