import moment from "moment-timezone";
import { decrypt, encryptPasswordForStorage } from "../utils/authUtils.js";
import sgMail from "@sendgrid/mail";
import crypto from "crypto";
import emailTempRepository from "../repositories/emailTempRepository.js";
import whiteLabelRepository from "../repositories/whiteLabelRepository.js";

import axios from "axios";



export const COUNTRY_TO_ISO3 = {
  "AFGHANISTAN": "AFG",
  "ALBANIA": "ALB",
  "ALGERIA": "DZA",
  "ANDORRA": "AND",
  "ANGOLA": "AGO",
  "ANTIGUA AND BARBUDA": "ATG",
  "ARGENTINA": "ARG",
  "ARMENIA": "ARM",
  "AUSTRALIA": "AUS",
  "AUSTRIA": "AUT",
  "AZERBAIJAN": "AZE",
  "BAHAMAS": "BHS",
  "BAHRAIN": "BHR",
  "BANGLADESH": "BGD",
  "BARBADOS": "BRB",
  "BELARUS": "BLR",
  "BELGIUM": "BEL",
  "BELIZE": "BLZ",
  "BENIN": "BEN",
  "BHUTAN": "BTN",
  "BOLIVIA": "BOL",
  "BOSNIA AND HERZEGOVINA": "BIH",
  "BOTSWANA": "BWA",
  "BRAZIL": "BRA",
  "BRUNEI": "BRN",
  "BULGARIA": "BGR",
  "BURKINA FASO": "BFA",
  "BURUNDI": "BDI",
  "CABO VERDE": "CPV",
  "CAMBODIA": "KHM",
  "CAMEROON": "CMR",
  "CANADA": "CAN",
  "CENTRAL AFRICAN REPUBLIC": "CAF",
  "CHAD": "TCD",
  "CHILE": "CHL",
  "CHINA": "CHN",
  "COLOMBIA": "COL",
  "COMOROS": "COM",
  "CONGO": "COG",
  "CONGO (DEMOCRATIC REPUBLIC)": "COD",
  "COSTA RICA": "CRI",
  "CÔTE D’IVOIRE": "CIV",
  "CROATIA": "HRV",
  "CUBA": "CUB",
  "CYPRUS": "CYP",
  "CZECHIA": "CZE",
  "DENMARK": "DNK",
  "DJIBOUTI": "DJI",
  "DOMINICA": "DMA",
  "DOMINICAN REPUBLIC": "DOM",
  "ECUADOR": "ECU",
  "EGYPT": "EGY",
  "EL SALVADOR": "SLV",
  "EQUATORIAL GUINEA": "GNQ",
  "ERITREA": "ERI",
  "ESTONIA": "EST",
  "ESWATINI": "SWZ",
  "ETHIOPIA": "ETH",
  "FIJI": "FJI",
  "FINLAND": "FIN",
  "FRANCE": "FRA",
  "GABON": "GAB",
  "GAMBIA": "GMB",
  "GEORGIA": "GEO",
  "GERMANY": "DEU",
  "GHANA": "GHA",
  "GREECE": "GRC",
  "GRENADA": "GRD",
  "GUATEMALA": "GTM",
  "GUINEA": "GIN",
  "GUINEA-BISSAU": "GNB",
  "GUYANA": "GUY",
  "HAITI": "HTI",
  "HONDURAS": "HND",
  "HUNGARY": "HUN",
  "ICELAND": "ISL",
  "INDIA": "IND",
  "INDONESIA": "IDN",
  "IRAN": "IRN",
  "IRAQ": "IRQ",
  "IRELAND": "IRL",
  "ISRAEL": "ISR",
  "ITALY": "ITA",
  "JAMAICA": "JAM",
  "JAPAN": "JPN",
  "JORDAN": "JOR",
  "KAZAKHSTAN": "KAZ",
  "KENYA": "KEN",
  "KIRIBATI": "KIR",
  "KOREA (NORTH)": "PRK",
  "KOREA (SOUTH)": "KOR",
  "KUWAIT": "KWT",
  "KYRGYZSTAN": "KGZ",
  "LAOS": "LAO",
  "LATVIA": "LVA",
  "LEBANON": "LBN",
  "LESOTHO": "LSO",
  "LIBERIA": "LBR",
  "LIBYA": "LBY",
  "LIECHTENSTEIN": "LIE",
  "LITHUANIA": "LTU",
  "LUXEMBOURG": "LUX",
  "MADAGASCAR": "MDG",
  "MALAWI": "MWI",
  "MALAYSIA": "MYS",
  "MALDIVES": "MDV",
  "MALI": "MLI",
  "MALTA": "MLT",
  "MARSHALL ISLANDS": "MHL",
  "MAURITANIA": "MRT",
  "MAURITIUS": "MUS",
  "MEXICO": "MEX",
  "MICRONESIA": "FSM",
  "MOLDOVA": "MDA",
  "MONACO": "MCO",
  "MONGOLIA": "MNG",
  "MONTENEGRO": "MNE",
  "MOROCCO": "MAR",
  "MOZAMBIQUE": "MOZ",
  "MYANMAR": "MMR",
  "NAMIBIA": "NAM",
  "NAURU": "NRU",
  "NEPAL": "NPL",
  "NETHERLANDS": "NLD",
  "NEW ZEALAND": "NZL",
  "NICARAGUA": "NIC",
  "NIGER": "NER",
  "NIGERIA": "NGA",
  "NORTH MACEDONIA": "MKD",
  "NORWAY": "NOR",
  "OMAN": "OMN",
  "PAKISTAN": "PAK",
  "PALAU": "PLW",
  "PANAMA": "PAN",
  "PAPUA NEW GUINEA": "PNG",
  "PARAGUAY": "PRY",
  "PERU": "PER",
  "PHILIPPINES": "PHL",
  "POLAND": "POL",
  "PORTUGAL": "PRT",
  "QATAR": "QAT",
  "ROMANIA": "ROU",
  "RUSSIA": "RUS",
  "RWANDA": "RWA",
  "SAINT KITTS AND NEVIS": "KNA",
  "SAINT LUCIA": "LCA",
  "SAINT VINCENT AND THE GRENADINES": "VCT",
  "SAMOA": "WSM",
  "SAN MARINO": "SMR",
  "SAO TOME AND PRINCIPE": "STP",
  "SAUDI ARABIA": "SAU",
  "SENEGAL": "SEN",
  "SERBIA": "SRB",
  "SEYCHELLES": "SYC",
  "SIERRA LEONE": "SLE",
  "SINGAPORE": "SGP",
  "SLOVAKIA": "SVK",
  "SLOVENIA": "SVN",
  "SOLOMON ISLANDS": "SLB",
  "SOMALIA": "SOM",
  "SOUTH AFRICA": "ZAF",
  "SOUTH SUDAN": "SSD",
  "SPAIN": "ESP",
  "SRI LANKA": "LKA",
  "SUDAN": "SDN",
  "SURINAME": "SUR",
  "SWEDEN": "SWE",
  "SWITZERLAND": "CHE",
  "SYRIA": "SYR",
  "TAJIKISTAN": "TJK",
  "TANZANIA": "TZA",
  "THAILAND": "THA",
  "TIMOR-LESTE": "TLS",
  "TOGO": "TGO",
  "TONGA": "TON",
  "TRINIDAD AND TOBAGO": "TTO",
  "TUNISIA": "TUN",
  "TÜRKIYE": "TUR",
  "TURKMENISTAN": "TKM",
  "TUVALU": "TUV",
  "UGANDA": "UGA",
  "UKRAINE": "UKR",
  "UNITED ARAB EMIRATES": "ARE",
  "UNITED KINGDOM": "GBR",
  "UNITED STATES": "USA",
  "URUGUAY": "URY",
  "UZBEKISTAN": "UZB",
  "VANUATU": "VUT",
  "VATICAN CITY": "VAT",
  "VENEZUELA": "VEN",
  "VIETNAM": "VNM",
  "YEMEN": "YEM",
  "ZAMBIA": "ZMB",
  "ZIMBABWE": "ZWE"
};


const conversionRate = {
  base: "USD",
  rates: {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 151.43,
    AUD: 1.52,
    CAD: 1.35,
    CHF: 0.89,
    CNY: 7.23,
    HKD: 7.82,
    NZD: 1.64,
    SEK: 10.42,
    KRW: 1335.24,
    SGD: 1.34,
    NOK: 10.51,
    MXN: 17.05,
    INR: 83.31,
    RUB: 92.5,
    ZAR: 18.97,
    TRY: 31.93,
    BRL: 4.98,
    TWD: 31.89,
    DKK: 6.85,
    PLN: 3.98,
    THB: 35.89,
    IDR: 15875,
    HUF: 356.24,
    CZK: 23.15,
    ILS: 3.67,
    CLP: 962.45,
    PHP: 56.12,
    AED: 3.67,
    COP: 3945,
    SAR: 3.75,
    MYR: 4.72,
    RON: 4.57,
    BGN: 1.8,
    ARS: 869.12,
    DZD: 134.52,
    BHD: 0.376,
    CRC: 517.23,
    DOP: 58.75,
    EGP: 30.89,
    ISK: 137.25,
    JOD: 0.709,
    KWD: 0.308,
  },
};

export const convertCurrency = (
  amount,
  fromCurrency,
  toCurrency,
  conversionRates = conversionRate
) => {
  if (
    !conversionRates.rates[fromCurrency] ||
    !conversionRates.rates[toCurrency]
  ) {
    throw new Error(`Invalid currency: ${fromCurrency} or ${toCurrency}`);
  }
  const baseToFromRate = conversionRates.rates[fromCurrency];
  const baseToToRate = conversionRates.rates[toCurrency];

  // Conversion formula
  let convertedAmount = (amount / baseToFromRate) * baseToToRate;
  convertedAmount = convertedAmount.toFixed(2);
  convertedAmount = parseFloat(convertedAmount);
  return convertedAmount;
};

export function getUTCTime() {
  return moment.utc().format();
}
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};
export const hashedPassword = async (password, confirmPassword) => {
  const decryptPass = decrypt(password);
  const decryptConfPass = decrypt(confirmPassword);
  const pass = await encryptPasswordForStorage(decryptPass);
  const confirmPass = await encryptPasswordForStorage(decryptConfPass);
  return { pass, confirmPass };
};

export const validateEncryptedPasswordFormat = (password) => {
  const parts = password.split(":");
  if (parts.length !== 2) {
    throw new Error("Password format is invalid");
  }
  const [hexPart, base64Part] = parts;
  const isHexValid = /^[a-f0-9]{32}$/.test(hexPart);
  if (!isHexValid) {
    throw new Error(
      "First part of the password must be a 32-character hexadecimal string"
    );
  }
  const isBase64Valid =
    /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      base64Part
    );
  if (!isBase64Valid) {
    throw new Error(
      "Second part of the password must be a valid Base64 string"
    );
  }

  return true;
};



export function convertUnixTimestampToISO(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toISOString();
}

export const sendCustomEmail = async (
  whitelabel,
  eventName,
  recipients,
  variables,
  type = "no-reply",
  defaultTemplateData = null,
) => {
  try {
    if (!whitelabel) throw new Error("Whitelabel is missing");
    let [templateData, getWhiteLabelData] = await Promise.all([
      await emailTempRepository.getRecordsByOptions(
        { whiteLabel: whitelabel, eventName },
        "emailBody from",
      ),
      await whiteLabelRepository.findWhiteLabelById(whitelabel),
    ]);
    let whitelabelName = "";
    if (getWhiteLabelData) {
      whitelabelName = templateData?.[0]?.from || getWhiteLabelData?.company;
    }

    // If no specific template is found for the whitelabel, use the default template
    if ((!templateData || templateData.length === 0) && defaultTemplateData) {
      templateData = await emailTempRepository.getRecordsByOptions(
        { whitelabel: { $exists: false }, eventName },
        "emailBody",
      );
      if (defaultTemplateData) {
        templateData = [defaultTemplateData];
      }
    }

    if (!templateData || templateData.length === 0) {
      throw new Error(`No email template found for event: ${eventName}`);
    }

    const formattedEventName = eventName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const { emailBody } = templateData[0];

    const formData = new FormData();
    formData.append("mailBody", emailBody);
    formData.append("whitelabel", whitelabelName);
    formData.append("eventName", formattedEventName);
    formData.append("variables", JSON.stringify(variables || {}));
    formData.append("recipients", JSON.stringify(recipients));
    formData.append("whitelabelId", whitelabel.toString());
    formData.append("type", type);
    //console.log(formData);

    const response = await axios.post(
      `${process.env.ADMIN_SERVER_BASEURL}/email/sendEmail`,
      formData,
    );
    console.log("response", response);
 
    if (response) {
      console.log("sendEmail has been hit from the helper Function");
    }
    return response.data;
  } catch (error) {
    console.log(error);
  }
};





export const removeDiffFromTimestamp = (timestamp) => {
  let date;

  // Handle seconds vs milliseconds
  if (typeof timestamp === "number" || /^\d+$/.test(timestamp)) {
    if (String(timestamp).length === 10) {
      date = moment.unix(Number(timestamp)); // seconds
    } else {
      date = moment(Number(timestamp)); // milliseconds
    }
  } else {
    date = moment(timestamp);
  }

  // Apply diff in minutes (positive = add, negative = subtract)
  const diffMinutes = parseInt(process.env.UTC_TIME_DIFF, 10);
  if (!isNaN(diffMinutes) && diffMinutes !== 0) {
    date.add(diffMinutes, "minutes");
  }

  // Return timestamp in milliseconds
  return date.valueOf();
};

export const getLocationandDeviceInfoFromIp = async (ipAddress) => {
  const accessKey = process.env.IPAPI_ACCESS_KEY;

  try {
    const url = `https://apiip.net/api/check?ip=${ipAddress}&accessKey=${accessKey}`;
    const { data } = await axios.get(url);

    const responseData = {
      location: {
        country: data?.countryName,
        city: data?.city,
        region: data?.regionName,
        postalCode: data?.postalCode,
        latitude: data?.latitude,
        longitude: data?.longitude,
        timezone: data?.timeZone?.id,
      },
      deviceDetails: {
        type:
          Object.keys(data?.userAgent)
            .filter((key) => data?.userAgent[key])
            .map((key) => key.replace(/^is/, ""))[0] || "DESKTOP",
        browser: data?.userAgent?.browser,
        browserVersion: data?.userAgent?.browserVersion,
        isMobile: data?.userAgent?.isMobile,
      },
    };

    return { apiStatus: "SUCCESS", data: responseData };
  } catch (error) {
    console.error("Error fetching IP data:", error.message);

    return { apiStatus: "FILURE", data: {} };
  }
};

export const formatDateTime = (dateTimeStr, withTime = true) => {
  let date;
  if (dateTimeStr) {
    // Check if format is MM/DD/YYYY or MM/DD/YYYY HH:MM:SS
    const parts = String(dateTimeStr).split(/[\/ :]/);

    if (
      parts?.length >= 3 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      !isNaN(parts[2])
    ) {
      const [month, day, year, hour = 0, minute = 0, second = 0] =
        parts?.map(Number);
      date = new Date(year, month - 1, day, hour, minute, second);
    } else {
      // Fallback to default parsing (ISO etc.)
      date = new Date(dateTimeStr);
    }

    // Final fallback if still invalid
    if (isNaN(date)) return "Invalid Date";

    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();

    // Detect presence of time in original string
    if (withTime) {
      const hasTime =
        /[0-9]:[0-9]/.test(dateTimeStr) || /AM|PM/i.test(dateTimeStr);

      if (hasTime) {
        const time = date.toLocaleTimeString("en-US", {
          hour12: true,
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
        });
        return `${day} ${month} ${year}, ${time}`;
      }
    }

    return `${day} ${month} ${year}`;
  }
  return null;
};

export const calculateDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const diffTime = Math.abs(end - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const checkMinimumBalance = (balance, currency, minBalanceOverride = null) => {
  if (balance == null || !currency) return false;
  const minBalance =
    minBalanceOverride != null && typeof minBalanceOverride === "number"
      ? minBalanceOverride
      : MIN_BALANCE_REQUIREMENTS[currency.toUpperCase()] || MIN_BALANCE_REQUIREMENTS.USD;
  return balance >= minBalance;
};

export async function generateUniqueNumericId(
  model,
  { field = 'userId', digits = 10, maxAttempts = 25 } = {}
) {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;

  if (!model?.db?.models) {
    throw new Error('generateUniqueNumericId: invalid mongoose model provided');
  }

  // Only check models where the field exists AND is a Number.
  // This avoids accidentally querying unrelated models where `userId` is an ObjectId
  // (e.g. `token.userId`) which would cause ObjectId cast errors.
  const modelsToCheck = Object.values(model.db.models).filter((m) => {
    const p = m?.schema?.path(field);
    return p && p.instance === "Number";
  });

  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = crypto.randomInt(min, max + 1);

    const hits = await Promise.all(
      modelsToCheck.map((m) =>
        m
          .findOne({ [field]: candidate })
          .select('_id')
          .lean()
      )
    );

    if (hits.every((doc) => !doc)) {
      return candidate;
    }
  }

  throw new Error(
    `generateUniqueNumericId: could not generate unique ${field} after ${maxAttempts} attempts`
  );
}