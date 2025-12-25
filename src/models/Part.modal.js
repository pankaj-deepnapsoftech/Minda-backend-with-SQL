import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const PartModal = sequelize.define(
    "Part",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        part_name: { type: DataTypes.STRING(255), allowNull: false },
        part_number: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        material_code: { type: DataTypes.STRING(100), allowNull: true },
    },
    {
        tableName: "parts",
        timestamps: true,
        indexes: [{ fields: ["part_name", "part_number"] }],
    }
);

PartModal.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};

