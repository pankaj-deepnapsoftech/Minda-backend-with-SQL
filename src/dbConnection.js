import mongoose from "mongoose";
import { logger } from "./utils/logger.js";

export const CheckDbConnection = async (mongoUri) => {
    let isConnected = false;
    do{
        try {
            const dbConnection = await mongoose.connect(mongoUri,{dbName:"cms"});
            logger.info(`mongodb Connection successful ${dbConnection.connection.host}`);
            isConnected = true;
        } catch (error) {
            logger.error("Error connecting to MongoDB:", error);
            logger.info("Retrying in 5 seconds...");
        }
    }while(!isConnected)
};

