import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ---------------------------- local imports  -------------------------
import { AsyncHandler } from "../utils/asyncHandler.js";
import { createUserService, FindUserByEmailOrUserId, FindUserById, GetUsersService, SearchUsersService, UpdateUsersService } from "../services/users.service.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { StatusCodes } from "http-status-codes";
import { config } from "../config.js";
import { UserModel } from "../models/user.modal.js";


export const registerUser = AsyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction()
    try {
        const data = req.body;
        const exist = await FindUserByEmailOrUserId(data.email);
        if (exist) {
            throw new BadRequestError("User already Register with the email or User id", "registerUser() method error")
        }

        const result = await createUserService(data);
        res.status(StatusCodes.CREATED).json({
            message: "User register successfully",
            user: result
        });
    } catch (error) {
        await session.abortTransaction();
        throw new BadRequestError(error.message, "registerUser() method error")
    } finally {
        session.endSession()
    }
});

export const LoginUser = AsyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await FindUserByEmailOrUserId(email);

    if (!user) {
        throw new NotFoundError("Invalid credentials", "LoginUser() method error 1")
    }

    const isCorrect = await bcrypt.compare(password, user.password);

    if (!isCorrect) {
        throw new NotFoundError("Invalid credentials", "LoginUser() method error 1")
    }

    const accessToken = jwt.sign({ email: user.email, id: user._id }, config.JWT_SECRET, { expiresIn: "30days" })
    const refreshToken = jwt.sign({ email: user.email, id: user._id }, config.JWT_SECRET, { expiresIn: "31days" })

    res.cookie("AT", accessToken, {
        httpOnly: true,        // Cookie not accessible via document.cookie
        secure: config.NODE_ENV !== "development",          // Sent only over HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000, // Lifetime in milliseconds
        sameSite: "strict",    // "strict" | "lax" | "none"
    }).cookie("RT", refreshToken, {
        httpOnly: true,        // Cookie not accessible via document.cookie
        secure: config.NODE_ENV !== "development",          // Sent only over HTTPS
        maxAge: 31 * 24 * 60 * 60 * 1000, // Lifetime in milliseconds
        sameSite: "strict",    // "strict" | "lax" | "none"
    });

    res.status(StatusCodes.OK).json({
        message: "User login Successfully"
    });

    await UserModel.findByIdAndUpdate(user._id, { refresh_token: refreshToken })

});

export const LogoutUser = AsyncHandler(async (req, res) => {
    const user = req.currentUser;
    if (!user) {
        throw new NotFoundError("user is not authorized", "LogoutUser() method error");
    };
    res.clearCookie("AT").clearCookie("RT");
    res.status(StatusCodes.OK).json({
        message: "Logout Successfully"
    })
});

export const LogedInUser = AsyncHandler(async (req, res) => {
    res.status(StatusCodes.OK).json({
        user: req?.currentUser
    })
});

export const UpdateUser = AsyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const result = await UpdateUsersService(id, data);
    if (!result) {
        throw new NotFoundError("User not found ", "UpdateUser() method error");
    };

    res.status(StatusCodes.OK).json({
        message: "User updated successfully",
        user: result
    })
});

export const RefreshToken = AsyncHandler(async (req, res) => {
    const token = req?.cookies?.AT || req?.headers?.authorization?.split(" ")[1];

    if (!token) {
        throw new NotFoundError("Token is required field", "RefreshToken() method error")
    };
    const payload = jwt.verify(token, config.JWT_SECRET);
    const user = await FindUserById(payload.id);

    if (!user) {
        throw new NotFoundError("Invalid user Please try again...", "RefreshToken() method error")
    }

    const accessToken = jwt.sign({ email: user.email, id: user._id }, config.JWT_SECRET, { expiresIn: "30days" })
    const refreshToken = jwt.sign({ email: user.email, id: user._id }, config.JWT_SECRET, { expiresIn: "31days" })

    res.cookie("AT", accessToken, {
        httpOnly: true,        // Cookie not accessible via document.cookie
        secure: config.NODE_ENV !== "development",          // Sent only over HTTPS
        maxAge: 30 * 24 * 60 * 60 * 1000, // Lifetime in milliseconds
        sameSite: "none",    // "strict" | "lax" | "none"
    }).cookie("RT", refreshToken, {
        httpOnly: true,        // Cookie not accessible via document.cookie
        secure: config.NODE_ENV !== "development",          // Sent only over HTTPS
        maxAge: 31 * 24 * 60 * 60 * 1000, // Lifetime in milliseconds
        sameSite: "none",    // "strict" | "lax" | "none"
    });

    res.status(StatusCodes.OK).json({
        message: "user logedin Successfully"
    });

    await UserModel.findByIdAndUpdate(user._id, { refresh_token: refreshToken })
});

export const GetAllemployees = AsyncHandler(async (req, res) => {
    let { limit, page } = req.query;
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const skip = (page - 1) * limit;
    const result = await GetUsersService(skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    });
});

export const SearchEmployees = AsyncHandler(async (req, res) => {
    let { search, limit, page } = req.query;
    limit = parseInt(limit) || 10;
    page = parseInt(page) || 1;
    const skip = (page - 1) * limit;
    const result = await SearchUsersService(search, skip, limit);
    res.status(StatusCodes.OK).json({
        data: result
    });

})