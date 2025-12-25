import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const CheckListModal = sequelize.define(
    "Checklist",
    {
        item: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        check_list_method: { type: DataTypes.STRING(255), allowNull: false },
        check_list_time: { type: DataTypes.STRING(100), allowNull: false },
        result_type: { type: DataTypes.STRING(100), allowNull: false },
        min: { type: DataTypes.FLOAT, allowNull: true },
        max: { type: DataTypes.FLOAT, allowNull: true },
        uom: { type: DataTypes.STRING(50), allowNull: true },
        process: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        tableName: "checklists",
        timestamps: true,
        indexes: [{ fields: ["item", "process"] }],
    }
);

CheckListModal.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};


