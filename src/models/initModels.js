import { AssemblyModal } from "./AssemblyLine.modal.js";
import { PartModal } from "./Part.modal.js";
import { CheckListModal } from "./checkList.modal.js";
import { CheckListHistoryModal } from "./checkListHistory.modal.js";
import { CompanyModel } from "./company.modal.js";
import { NotificationModal } from "./notification.modal.js";
import { PlantModel } from "./plant.modal.js";
import { ProcessModel } from "./process.modal.js";
import { RoleModel } from "./role.modal.js";
import { TypeModal } from "./types.modal.js";
import { UserModel } from "./user.modal.js";

export const initModels = () => {
    CompanyModel.hasMany(PlantModel, { foreignKey: "company_id", as: "plants" });
    PlantModel.belongsTo(CompanyModel, { foreignKey: "company_id", as: "company_id" });

    RoleModel.hasMany(UserModel, { foreignKey: "role", as: "users" });
    UserModel.belongsTo(RoleModel, { foreignKey: "role", as: "role" });

    CompanyModel.hasMany(UserModel, { foreignKey: "employee_company", as: "employees" });
    UserModel.belongsTo(CompanyModel, { foreignKey: "employee_company", as: "employee_company" });

    PlantModel.hasMany(UserModel, { foreignKey: "employee_plant", as: "plant_employees" });
    UserModel.belongsTo(PlantModel, { foreignKey: "employee_plant", as: "employee_plant" });

    CompanyModel.hasMany(AssemblyModal, { foreignKey: "company_id", as: "assemblies" });
    AssemblyModal.belongsTo(CompanyModel, { foreignKey: "company_id", as: "company_id" });

    PlantModel.hasMany(AssemblyModal, { foreignKey: "plant_id", as: "assemblies" });
    AssemblyModal.belongsTo(PlantModel, { foreignKey: "plant_id", as: "plant_id" });

    UserModel.hasMany(AssemblyModal, { foreignKey: "responsibility", as: "assigned_assemblies" });
    AssemblyModal.belongsTo(UserModel, { foreignKey: "responsibility", as: "responsibility" });

    PartModal.hasMany(AssemblyModal, { foreignKey: "part_id", as: "assemblies" });
    AssemblyModal.belongsTo(PartModal, { foreignKey: "part_id", as: "part_id" });

    AssemblyModal.belongsToMany(ProcessModel, {
        through: "assembly_processes",
        foreignKey: "assembly_id",
        otherKey: "process_id",
        as: "process_id",
    });
    ProcessModel.belongsToMany(AssemblyModal, {
        through: "assembly_processes",
        foreignKey: "process_id",
        otherKey: "assembly_id",
        as: "assemblies",
    });

    ProcessModel.hasMany(CheckListModal, { foreignKey: "process", as: "checklists" });
    CheckListModal.belongsTo(ProcessModel, { foreignKey: "process", as: "process" });

    CheckListModal.hasMany(CheckListHistoryModal, { foreignKey: "checkList", as: "histories" });
    CheckListHistoryModal.belongsTo(CheckListModal, { foreignKey: "checkList", as: "checkList" });

    AssemblyModal.hasMany(CheckListHistoryModal, { foreignKey: "assembly", as: "history" });
    CheckListHistoryModal.belongsTo(AssemblyModal, { foreignKey: "assembly", as: "assembly" });

    ProcessModel.hasMany(CheckListHistoryModal, { foreignKey: "process_id", as: "history" });
    CheckListHistoryModal.belongsTo(ProcessModel, { foreignKey: "process_id", as: "process_id" });

    UserModel.hasMany(CheckListHistoryModal, { foreignKey: "user_id", as: "checked_items" });
    CheckListHistoryModal.belongsTo(UserModel, { foreignKey: "user_id", as: "user_id" });

    UserModel.hasMany(NotificationModal, { foreignKey: "reciverId", as: "received_notifications" });
    NotificationModal.belongsTo(UserModel, { foreignKey: "reciverId", as: "reciverId" });

    UserModel.hasMany(NotificationModal, { foreignKey: "senderId", as: "sent_notifications" });
    NotificationModal.belongsTo(UserModel, { foreignKey: "senderId", as: "senderId" });

    AssemblyModal.hasMany(NotificationModal, { foreignKey: "assembly", as: "notifications" });
    NotificationModal.belongsTo(AssemblyModal, { foreignKey: "assembly", as: "assembly" });

    ProcessModel.hasMany(NotificationModal, { foreignKey: "process_id", as: "notifications" });
    NotificationModal.belongsTo(ProcessModel, { foreignKey: "process_id", as: "process_id" });

    CheckListModal.hasMany(NotificationModal, { foreignKey: "checkList", as: "notifications" });
    NotificationModal.belongsTo(CheckListModal, { foreignKey: "checkList", as: "checkList" });

    return {
        AssemblyModal,
        PartModal,
        CheckListModal,
        CheckListHistoryModal,
        CompanyModel,
        NotificationModal,
        PlantModel,
        ProcessModel,
        RoleModel,
        TypeModal,
        UserModel,
    };
};

