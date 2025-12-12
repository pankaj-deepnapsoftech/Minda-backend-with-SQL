
import http from "http";
import cors from "cors";
import { json, urlencoded } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";

// ----------------- local imports ---------------------
import { CheckDbConnection } from "./dbConnection.js";
import { config } from "./config.js";
import { logger } from "./utils/logger.js";
import { BadRequestError, Customerror } from "./utils/errorHandler.js";


const SERVER_PORT = 4040;





export const Start = (app) => {
    middlewares(app);
    errorHandler(app);
    StartServer(app)
    Connections()
}

function middlewares(app){
    // Initialize middlewares here
    app.use(json({limit:"20mb"}));
    app.use(urlencoded({extended:true,limit:"20mb"}));
    app.use(cors({
        origin:"",
        methods:["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
        credentials:true,
    }));
    app.use(compression());
    app.use(cookieParser());
}

function errorHandler (app){
    app.get("/",(req,res,next)=>{
        next(new BadRequestError("this route is not exist ","errorHandler() method error"))
    });

    app.use((err,_req,res,next)=>{
        if(err instanceof Customerror){
            logger.log(`error coming from ${err?.comingfrom} with message: ${err.message} and status code: ${err.statusCode}`);
            return res.status(err.statusCode).json(err.seriyalizeErrors());
        };
        next();
    });
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

