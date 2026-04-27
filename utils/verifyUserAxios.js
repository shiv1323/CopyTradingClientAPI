import axios from "axios";
import "dotenv/config";
import { generateRSAToken } from "./jwt.js";
import env from "../config/env.js";

export const verifyUserAxios = async (userId) => {
    try {
        console.log("Verify user started with userId:", userId);
        const rsaToken = generateRSAToken(
            userId
        );
        const response = await axios.post(`${env.VERIFY_USER_URL}`, {
            token:rsaToken
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
}