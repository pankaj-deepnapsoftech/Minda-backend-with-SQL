import { DataTypes, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const NotificationModal = sequelize.define(
    "Notification",
    {
        _id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        title: { type: DataTypes.STRING(255), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        reciverId: { type: DataTypes.UUID, allowNull: false },
        senderId: { type: DataTypes.UUID, allowNull: true },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "send",
            validate: {
                isIn: [["send", "recived", "view"]],
            },
        },
        assembly: { type: DataTypes.UUID, allowNull: false },
        process_id: { type: DataTypes.UUID, allowNull: false },
        checkList: { type: DataTypes.UUID, allowNull: false },
    },
    {
        tableName: "notifications",
        timestamps: true,
    }
);

NotificationModal.prototype.toJSON = function () {
    return this.get({ plain: true });
};








