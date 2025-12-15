/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();


class Config {
    MONGODB_URI;
    NODE_ENV;
    LOCAL_CLIENT_URL;
    CLIENT_URL;
    JWT_SECRET;
    EMAIL_AUTH;
    EMAIL_PASSWORD;
    constructor() {
        this.MONGODB_URI = process.env.MONGODB_URI;
        this.NODE_ENV = process.env.NODE_ENV;
        this.LOCAL_CLIENT_URL = process.env.LOCAL_CLIENT_URL;
        this.CLIENT_URL = process.env.CLIENT_URL;
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.EMAIL_AUTH = process.env.EMAIL_AUTH;
        this.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
    }
};

export const config = new Config();

