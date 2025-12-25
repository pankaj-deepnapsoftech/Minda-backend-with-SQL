import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const CheckListHistoryModal = sequelize.define(
    "CheckListHistory",
    {
        checkList: { type: DataTypes.INTEGER, allowNull: false },
        assembly: { type: DataTypes.INTEGER, allowNull: false },
        process_id: { type: DataTypes.INTEGER, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        result: { type: DataTypes.STRING(100), allowNull: false },
        is_error: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        is_resolved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM("Checked", "Unchecked"),
            allowNull: false,
            defaultValue: "Unchecked",
        },
    },
    {
        tableName: "checklisthistories",
        timestamps: true,
        indexes: [{ name: "idx_ch_history", fields: ["checkList", "assembly", "process_id", "result", "status"] }],
    }
);

CheckListHistoryModal.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};


