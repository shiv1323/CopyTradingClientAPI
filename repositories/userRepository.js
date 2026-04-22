import {ObjectId } from "mongodb";
import User from "../models/user.model.js";
import 'dotenv/config';


class UserRepository {

    async getUserByWhiteLabel(userId) {
        const user = await User.findOne({ whiteLabel: new ObjectId(userId) });
        return user;
    }

    async getUserByFilter(filter) {
        const user = await User.findOne(filter);
        return user;
    }

    async getUserByReferalCode(whiteLabel) {
            const user = await User.findOne({whiteLabel: whiteLabel });
        return user;
    }
}

export default new UserRepository();
