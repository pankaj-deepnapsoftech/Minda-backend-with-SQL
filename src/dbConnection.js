import { logger } from "./utils/logger.js";
import { config } from "./config.js";
import { initModels } from "./models/initModels.js";
import { sequelize } from "./sequelize.js";

export const CheckDbConnection = async () => {
    let isConnected = false;
    do {
        try {
            logger.info("Attempting to authenticate with SQL Server...");
            await sequelize.authenticate();
            logger.info("Authentication successful. Initializing models...");
            
            initModels();
            logger.info("Models initialized.");
            
            if (config.DB_SYNC === "true" || config.NODE_ENV === "development") {
                logger.info("Starting database sync...");
                
                // Use sequelize.sync() - it should handle table creation order
                // But for SQL Server, we need to ensure tables are created in the right order
                // The issue is foreign keys being created inline
                await sequelize.sync({ alter: false, force: true });
                
                logger.info("Database sync completed.");
            }
            
            logger.info(`SQL Server Connection successful ${config.DB_HOST}:${config.DB_PORT || 1433}/${config.DB_NAME}`);
            isConnected = true;
        } catch (error) {
            const errorDetails = {
                message: error.message,
                name: error.name,
                originalMessage: error.original?.message || error.message,
                sql: error.sql || null,
                host: config.DB_HOST,
                port: config.DB_PORT || 1433,
                database: config.DB_NAME,
                user: config.DB_USER,
            };
            logger.error("Error connecting to SQL Server:", errorDetails);
            if (error.stack) {
                logger.error("Stack trace:", error.stack);
            }
            logger.info("Retrying in 5 seconds...");
            await new Promise((r) => globalThis.setTimeout(r, 5000));
        }
    } while (!isConnected);
};

