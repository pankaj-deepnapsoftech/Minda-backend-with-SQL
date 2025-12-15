import mongoose from "mongoose";

// ------------------------------- local imports -------------------------------
import { AsyncHandler } from "../utils/asyncHandler.js";
import { createRoleService, deleteRoleService, findRoleBuName, getAllRoleService, getRolesListService, searchRoleByName, updateRoleService } from "../services/role.service.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../utils/errorHandler.js";


export const createRole = AsyncHandler(async (req, res) => {
    const data = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const find = await findRoleBuName(data.name);
        if (find) {
            throw new BadRequestError("Role already exists","createRole() method error");
        }
        const role = await createRoleService(data);
        await session.commitTransaction();
        res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: role,
        });
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

export const getRolesList = AsyncHandler(async (req,res) => {
    let {page,limit} = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page -1 ) * limit;
    const result = await getRolesListService(skip,limit);
    res.status(StatusCodes.OK).json({
        data:result
    })
});

export const updateRoleList = AsyncHandler(async (req,res) => {
    const {id} = req.params;
    const data = req.body;
    const result = await updateRoleService(id,data);
    if(!result){
        throw new BadRequestError("Role does not ","updateRoleList() method error")
    };

    res.status(StatusCodes.OK).json({
        messgae:"Role updated successfully",
        data:result
    })
});

export const DeleteRoleList = AsyncHandler(async (req,res) => {
    const {id} = req.params;
    const result = await deleteRoleService(id);
    if(!result){
        throw new BadRequestError("Role not found","DeleteRoleList() method error")
    }
    res.status(StatusCodes.OK).json({
        message:"Role deleted successfully",
        data:result
    })
});

export const searchRoleData = AsyncHandler(async (req,res) => {
    let {name,limit,page} = req.query;
    limit = parseInt(limit) || 10;
    page =  parseInt(page) || 1;
    const skip = (page -1 ) * limit;
    const result = await searchRoleByName(name.trim(),skip,limit);
    res.status(StatusCodes.OK).json({
        data:result
    });
});

export const getAllRoleData = AsyncHandler(async (req,res) => {
    const data = await getAllRoleService();
    res.status(StatusCodes.OK).json({
        data
    })
})