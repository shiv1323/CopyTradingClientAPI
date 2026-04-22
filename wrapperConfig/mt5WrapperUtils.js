import axios from "axios";
import WhiteLabel from "../models/whiteLabel.model.js";

import mongoose from "mongoose";

// Get request to MT5 server
export const getReqMT5Server = async (
  path,
  params,
  user,
  type = "real",
  isPAMM = false
) => {
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
      token = getManagerWL?.managers?.real?.manager;
    }
    const axiosConfig = {
      url: path,
      method: "get",
      baseURL: getManagerWL?.managers?.real?.wrapperUrl,
      params: {
        ...params,
        managerId:getManagerWL?.managers?.real?.id,
        managerType: "real",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const postResult = await axios.request(axiosConfig);
    if (postResult?.data?.success) {
      return postResult?.data;
    }
  } catch (error) {
    return {
      status: false,
      message: error?.data?.message || error?.message,
    };
  }
};

// Post request to MT5 server
export const postReqMT5Server = async (
  path,
  body,
  user,
) => {
  try {
    let { whiteLabel } = user;
    if (!mongoose.Types.ObjectId.isValid(whiteLabel)) {
      throw new Error("Invalid whiteLabel ID");
    }
    whiteLabel = new mongoose.Types.ObjectId(whiteLabel);
    //console.log(whiteLabel)
    // const getAllWL = await whiteLabel.find();
    // console.log(getAllWL)
    const getManagerWL = await WhiteLabel.findOne({
      _id: whiteLabel,
    });
    let token = "";
    if (getManagerWL) {
      token = getManagerWL?.managers?.real?.manager;
    }
    const axiosConfig = {
      url: path,
      method: "post",
      baseURL: getManagerWL?.managers?.real?.wrapperUrl,
      data: {
        ...body,
        managerId:getManagerWL?.managers?.real?.id,
        managerType: "real",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    try {
      const postResult = await axios.request(axiosConfig);
      if (postResult?.success) {
        return postResult?.data;
      } else {
        return postResult?.data;
      }
    } catch (error) {
      console.error("MT api request failed",error.response.data.message || error?.message, error);
    }
  } catch (error) {
    console.log(error)
    return {

      status: false,
      message: error.response.data || error?.message,
    };
  }
};
