import {Sequelize,DataTypes} from "sequelize";
import {sequelize} from "../sequelize.js";


export const DocumentModel  = sequelize.define('Document',{
    doc_name:{type:DataTypes.STRING,allowNull:false},
    category:{type:DataTypes.STRING,allowNull:false},
    expiry:{type:DataTypes.DATE,allowNull:true},
    attached_doc:{type:DataTypes.STRING,allowNull:true}
},{
    tableName:"documents",
    timestamps:true,
});











