import { DocumentModel } from "../models/Document.model.js"


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

// export const updateDocumentService = async () =>{
    
// }








