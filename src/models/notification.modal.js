import { DataTypes } from "sequelize";
import { sequelize } from "../sequelize.js";

export const NotificationModal = sequelize.define(
    "Notification",
    {
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        reciverId: { type: DataTypes.INTEGER, allowNull: false },
        senderId: { type: DataTypes.INTEGER, allowNull: true },
        status: {
            type: DataTypes.ENUM("send", "recived", "view"),
            allowNull: false,
            defaultValue: "send",
        },
        assembly: { type: DataTypes.INTEGER, allowNull: false },
        process_id: { type: DataTypes.INTEGER, allowNull: false },
        checkList: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
        tableName: "notifications",
        timestamps: true,
    }
);

NotificationModal.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};








