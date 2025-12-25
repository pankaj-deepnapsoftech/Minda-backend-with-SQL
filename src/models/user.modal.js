import bcrypt from "bcrypt"
import { DataTypes, Op, Sequelize } from "sequelize";
import { sequelize } from "../sequelize.js";

export const UserModel = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: Sequelize.literal("NEWID()"),
            primaryKey: true,
        },
        full_name: { type: DataTypes.STRING(255), allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        password: { type: DataTypes.STRING(255), allowNull: false },
        desigination: { type: DataTypes.STRING(255), allowNull: true },
        user_id: { type: DataTypes.STRING(50), allowNull: true, unique: true },
        employee_plant: { type: DataTypes.UUID, allowNull: true },
        employee_company: { type: DataTypes.UUID, allowNull: true },
        role: { type: DataTypes.UUID, allowNull: true },
        terminate: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        refresh_token: { type: DataTypes.TEXT, allowNull: true },
        is_admin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
        tableName: "users",
        timestamps: true,
        indexes: [
            { fields: ["email"] },
            { fields: ["user_id"] },
            { fields: ["employee_plant"] },
            { fields: ["employee_company"] },
            { fields: ["role"] },
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.role && !user.user_id) {
                    const lastUser = await UserModel.findOne({
                        where: { user_id: { [Op.ne]: null } },
                        order: [["createdAt", "DESC"]],
                        attributes: ["user_id"],
                    });

                    let nextNumber = 1;
                    if (lastUser?.user_id) {
                        const lastNumber = Number.parseInt(lastUser.user_id.split("-")[1], 10);
                        nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
                    }

                    user.user_id = `EMP-${String(nextNumber).padStart(4, "0")}`;
                }

                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
                if (user.email) {
                    user.email = user.email.toLowerCase();
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed("password")) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
                if (user.changed("email") && user.email) {
                    user.email = user.email.toLowerCase();
                }
            },
        },
    }
);

UserModel.prototype.toJSON = function () {
    const values = { ...this.get({ plain: true }) };
    values._id = values.id;
    delete values.id;
    return values;
};
