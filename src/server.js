
import http from "http";
import cors from "cors";
import express , { json, urlencoded } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import path from "path";

// ----------------- local imports ---------------------
import { CheckDbConnection } from "./dbConnection.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { BadRequestError, Customerror } from "./utils/errorHandler.js";
import mainRoutes from "./routes.js";


const SERVER_PORT = 4040;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const Start = (app) => {
    middlewares(app);
    routeMiddlewares(app);
    errorHandler(app);
    StartServer(app)
    Connections()
}

function middlewares(app) {
    app.use(express.static(path.join(__dirname, 'pages')));
    app.use(json({ limit: "20mb" }));
    app.use(urlencoded({ extended: true, limit: "20mb" }));
    app.use(cors({
        origin: config.NODE_ENV === "development" ? config.LOCAL_CLIENT_URL : config.CLIENT_URL,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
    }));
    app.use(compression());
    app.use(cookieParser());
}

function routeMiddlewares(app) {
    app.use("/health", (_req, res) => res.send("server is running and ok"))
    app.use("/api/v1", mainRoutes);
}

function errorHandler(app) {
    app.get("/", (_req, _res, next) => {
        next(new BadRequestError("this route is not exist ", "errorHandler() method error"))
    });

    app.use((err, _req, res, next) => {
        if (err instanceof Customerror) {
            logger.error(`error coming from ${err?.comingfrom} with message: ${err.message} and status code: ${err.statusCode}`);
            res.status(err.statusCode).json(err.seriyalizeErrors());
        };
        next();
    });
}

function Connections() {
    // Initialize database connections or other services here
    CheckDbConnection();
}

function StartServer(app) {
    const server = http.createServer(app);
    server.listen(SERVER_PORT, () => {
        // eslint-disable-next-line no-undef
        logger.info(`Server will start with process id : ${process.pid} started on port ${SERVER_PORT}`);
    })
}

