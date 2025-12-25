import { Sequelize } from "sequelize";
import { config } from "./config.js";

export const sequelize = new Sequelize(
    config.DB_NAME,
    config.DB_USER,
    config.DB_PASSWORD,
    {
        host: config.DB_HOST,
        port: config.DB_PORT ? Number(config.DB_PORT) : 1433,
        dialect: "mssql",
        dialectOptions: {
            options: {
                encrypt: true,
                trustServerCertificate: true,
                enableArithAbort: true,
                requestTimeout: 30000,
                connectTimeout: 30000,
            },
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        logging:false
    }
);

