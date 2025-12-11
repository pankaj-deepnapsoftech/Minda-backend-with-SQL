/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();


class Config {
    MONGODB_URI;
    constructor(){
        this.MONGODB_URI = process.env.MONGODB_URI;
    }
};

export const config = new Config();

