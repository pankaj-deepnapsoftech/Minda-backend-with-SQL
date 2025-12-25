import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const TypeModal = sequelize.define(
    "Type",
    {
        uom: { type: DataTypes.STRING(100), allowNull: true },
        checking_time: { type: DataTypes.STRING(100), allowNull: true },
        checking_method: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
        tableName: "types",
        timestamps: true,
    }
);

TypeModal.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};

