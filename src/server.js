
import http from "http";
import { CheckDbConnection } from "./dbConnection.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";


const SERVER_PORT = 4040;





export const Start = (app) => {
    Connections()
    StartServer(app)
}

function Connections() {
    // Initialize database connections or other services here
    CheckDbConnection(config.MONGODB_URI);
}

function StartServer(app) {
    const server = http.createServer(app);
    server.listen(SERVER_PORT, () => {
        logger.info(`Server started on port ${SERVER_PORT}`);
    })
}

