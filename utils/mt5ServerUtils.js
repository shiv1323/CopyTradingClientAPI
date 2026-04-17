import axios from "axios";
import WhiteLabel from "../models/whiteLevel.model.js";
import mongoose from "mongoose";

const baseURL = process.env.MT5_SERVER_ENDPOINT;
const paamBaseURL = process.env.PAMM_MT5_SERVER_ENDPOINT;

export const getReqMT5Server = async (path, params, user, type = "real", isPamm = false) => {
  try {
    let { whiteLabel } = user;
    if (!mongoose.Types.ObjectId.isValid(whiteLabel)) {
      throw new Error("Invalid whiteLabel ID");
    }
    whiteLabel = new mongoose.Types.ObjectId(whiteLabel);
    const getManagerWL = await WhiteLabel.findOne({
      _id: whiteLabel,
    });
    let token = "";
    if (getManagerWL) {
      token =
        type === "demo"
          ? getManagerWL?.managers?.demo?.manager
          : getManagerWL?.managers?.real?.manager;
    }
    const axiosConfig = {
      url: path,
      method: "get",
      baseURL: isPamm
        ? paamBaseURL
        : type === "demo"
          ? getManagerWL?.managers?.demo?.wrapperUrl
          : getManagerWL?.managers?.real?.wrapperUrl,
      params: {
        ...params,
        managerId:
          type === "demo"
            ? getManagerWL?.managers?.demo?.id
            : getManagerWL?.managers?.real?.id,
        managerType: type === "demo" ? "demo" : "real",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    // console.log(axiosConfig);
    const postResult = await axios.request(axiosConfig);
    if (postResult?.data?.success) {
      return postResult?.data;
    }
  } catch (error) {
    return {
      status: false,
      success: false,
      message: error?.data?.message || error?.message,
    };
  }
};

export const postReqMT5Server = async (path, body, user, type = "real", isPamm = false) => {
  try {
    // console.log(user)
    let { whiteLabel } = user;
    if (!mongoose.Types.ObjectId.isValid(whiteLabel)) {
      throw new Error("Invalid whiteLabel ID");
    }
    whiteLabel = new mongoose.Types.ObjectId(whiteLabel);
    //console.log(whiteLabel)
    // const getAllWL = await WhiteLabel.find();
    // console.log(getAllWL)
    const getManagerWL = await WhiteLabel.findOne({
      _id: whiteLabel,
    });
    // console.log(getManagerWL);
    let token = "";
    if (getManagerWL) {
      token =
        type === "demo"
          ? getManagerWL?.managers?.demo?.manager
          : getManagerWL?.managers?.real?.manager;
    }
    const axiosConfig = {
      url: path,
      method: "post",
      // baseURL: baseURL,
      baseURL: isPamm
        ? paamBaseURL
        : type === "demo"
          ? getManagerWL?.managers?.demo?.wrapperUrl
          : getManagerWL?.managers?.real?.wrapperUrl,
      data: {
        ...body,
        managerId:
          type === "demo"
            ? getManagerWL?.managers?.demo?.id
            : getManagerWL?.managers?.real?.id,
        managerType: type === "demo" ? "demo" : "real",
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    const postResult = await axios.request(axiosConfig);
    // console.log(postResult);
    if (postResult?.data?.success) {
      return postResult?.data;
    }
  } catch (error) {
    //console.log(error)
    return {
      status: false,
      success: false,
      message: error?.data?.message || error?.message,
    };
  }
};
