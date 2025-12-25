import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const AssemblyModal = sequelize.define(
    "Assembly",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        assembly_name: { type: DataTypes.STRING(255), allowNull: false },
        assembly_number: { type: DataTypes.STRING(100), allowNull: false },
        company_id: { type: DataTypes.UUID, allowNull: false },
        plant_id: { type: DataTypes.UUID, allowNull: false },
        responsibility: { type: DataTypes.UUID, allowNull: true },
        part_id: { type: DataTypes.UUID, allowNull: true },
    },
    {
        tableName: "assemblies",
        timestamps: true,
        indexes: [
            {
                name: "idx_assemblies_main",
                fields: [
                    "company_id",
                    "plant_id",
                    "responsibility",
                    "part_id",
                    "assembly_name",
                    "assembly_number",
                ],
            },
        ],
    }
);

AssemblyModal.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};
