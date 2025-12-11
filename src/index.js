import express from "express";
import { Start } from "./server.js";


const intiServer = () => {
    const app = express();
    Start(app);
};

intiServer();