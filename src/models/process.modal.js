import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const ProcessModel = sequelize.define(
    "Process",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        process_name: { type: DataTypes.STRING(255), allowNull: false },
        process_no: { type: DataTypes.STRING(100), allowNull: false },
    },
    {
        tableName: "processes",
        timestamps: true,
        indexes: [{ fields: ["process_name", "process_no"] }],
    }
);

ProcessModel.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};




