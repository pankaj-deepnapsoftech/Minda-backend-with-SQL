import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const RoleModel = sequelize.define(
    "Role",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    },
    {
        tableName: "roles",
        timestamps: true,
        indexes: [{ fields: ["name"] }],
    }
);

RoleModel.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};


