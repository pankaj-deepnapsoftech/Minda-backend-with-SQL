/* eslint-disable no-undef */
import dotenv from "dotenv";
dotenv.config();


class Config {
    DB_HOST;
    DB_PORT;
    DB_NAME;
    DB_USER;
    DB_PASSWORD;
    DB_SYNC;
    NODE_ENV;
    LOCAL_CLIENT_URL;
    CLIENT_URL;
    JWT_SECRET;
    EMAIL_AUTH;
    EMAIL_PASSWORD;
    LOCAL_SERVER_URL;
    SERVER_URL;
    constructor() {
        this.DB_HOST = process.env.DB_HOST;
        this.DB_PORT = process.env.DB_PORT;
        this.DB_NAME = process.env.DB_NAME;
        this.DB_USER = process.env.DB_USER;
        this.DB_PASSWORD = process.env.DB_PASSWORD;
        this.DB_SYNC = process.env.DB_SYNC;
        this.NODE_ENV = process.env.NODE_ENV;
        this.LOCAL_CLIENT_URL = process.env.LOCAL_CLIENT_URL;
        this.CLIENT_URL = process.env.CLIENT_URL;
        this.JWT_SECRET = process.env.JWT_SECRET;
        this.EMAIL_AUTH = process.env.EMAIL_AUTH;
        this.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
        this.SERVER_URL = process.env.SERVER_URL;
        this.LOCAL_SERVER_URL = process.env.LOCAL_SERVER_URL;
    }
};

export const config = new Config();

