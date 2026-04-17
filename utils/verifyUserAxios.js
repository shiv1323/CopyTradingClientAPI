import axios from "axios";
import "dotenv/config";
import { generateRSAToken } from "./jwt.js";

export const verifyUserAxios = async (token) => {
    try {
        // console.log(process.env.VERIFY_USER_URL);
        const rsaToken = generateRSAToken(
            token
        );
        const response = await axios.post(`${process.env.VERIFY_USER_URL}`, {
            token:rsaToken
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
}