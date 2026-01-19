import { DocumentModel } from "../models/Document.model.js"
import { NotFoundError } from "../utils/errorHandler.js";


export const createDocumentService = async (data) => {
    const result = await DocumentModel.create(data);
    return result;
};

export const getDocumentService = async (skip, limit) => {
    const result = await DocumentModel.findAll({
        offset: skip,
        limit,
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const updateDocumentService = async (id,data) =>{
    const result = await DocumentModel.findByPk(id);
    if(!result){
        throw new NotFoundError("document not found","updateDocumentService() method error")
    }
    await result.update(data);
    return result;
}








