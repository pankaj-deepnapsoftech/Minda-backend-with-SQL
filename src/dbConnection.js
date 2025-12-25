import { logger } from "./utils/logger.js";
import { config } from "./config.js";
import { initModels } from "./models/initModels.js";
import { sequelize } from "./sequelize.js";

export const CheckDbConnection = async () => {
    let isConnected = false;
    do {
        try {
            await sequelize.authenticate();
            initModels();
            if (config.DB_SYNC === "true" || config.NODE_ENV === "development") {
                await sequelize.sync();
            }
            logger.info(`mysql Connection successful ${config.DB_HOST}:${config.DB_PORT || 3306}/${config.DB_NAME}`);
            isConnected = true;
        } catch (error) {
            logger.error("Error connecting to MySQL:", error);
            logger.info("Retrying in 5 seconds...");
            await new Promise((r) => globalThis.setTimeout(r, 5000));
        }
    } while (!isConnected);
};

