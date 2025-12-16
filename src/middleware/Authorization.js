import jwt from "jsonwebtoken";

// --------------------------- local imports ----------------------------
import { AsyncHandler } from "../utils/asyncHandler.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { FindUserById } from "../services/users.service.js";
import { config } from "../config.js";


export const Authorization = AsyncHandler(async (req,res,next) => {
    const token = req?.cookies?.AT || req?.headers?.authorization?.split(" ")[1];

    if(!token){
        throw new BadRequestError("invalid request User not Authorized","Authorization() method error");
    };

    const payload = jwt.verify(token,config.JWT_SECRET);

    const user = await FindUserById(payload.id);

    if(user.terminate){
        throw new NotFoundError("User Terminated by Admin Please Contact to organization","Authorization() method error")
    }

    req.currentUser = user;
    next()
})









