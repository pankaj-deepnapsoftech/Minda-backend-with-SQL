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
import { DepartmentModel } from "./department.modal.js";
import { ItemCheckTimeModel } from "./itemCheckTime.model.js";

let modelsInitialized = false;

export const initModels = () => {
    if (modelsInitialized) {
        return;
    }
    CompanyModel.hasMany(PlantModel, { foreignKey: "company_id", as: "plants", constraints: false });
    PlantModel.belongsTo(CompanyModel, { foreignKey: "company_id", as: "company", constraints: false });

    RoleModel.hasMany(UserModel, { foreignKey: "role", as: "users", constraints: false });
    UserModel.belongsTo(RoleModel, { foreignKey: "role", as: "userRole", constraints: false });

    CompanyModel.hasMany(UserModel, { foreignKey: "employee_company", as: "employees", constraints: false });
    UserModel.belongsTo(CompanyModel, { foreignKey: "employee_company", as: "company", constraints: false });

    PlantModel.hasMany(UserModel, { foreignKey: "employee_plant", as: "plant_employees", constraints: false });
    UserModel.belongsTo(PlantModel, { foreignKey: "employee_plant", as: "plant", constraints: false });

    CompanyModel.hasMany(AssemblyModal, { foreignKey: "company_id", as: "assemblies", constraints: false });
    AssemblyModal.belongsTo(CompanyModel, { foreignKey: "company_id", as: "company", constraints: false });

    PlantModel.hasMany(AssemblyModal, { foreignKey: "plant_id", as: "assemblies", constraints: false });
    AssemblyModal.belongsTo(PlantModel, { foreignKey: "plant_id", as: "plant", constraints: false });

    UserModel.hasMany(AssemblyModal, { foreignKey: "responsibility", as: "assigned_assemblies", constraints: false });
    AssemblyModal.belongsTo(UserModel, { foreignKey: "responsibility", as: "responsibleUser", constraints: false });

    PartModal.hasMany(AssemblyModal, { foreignKey: "part_id", as: "assemblies", constraints: false });
    AssemblyModal.belongsTo(PartModal, { foreignKey: "part_id", as: "part", constraints: false });

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

    ProcessModel.hasMany(CheckListModal, { foreignKey: "process", as: "checklists", constraints: false });
    CheckListModal.belongsTo(ProcessModel, { foreignKey: "process", as: "processInfo", constraints: false });

    CheckListModal.hasMany(CheckListHistoryModal, { foreignKey: "checkList", as: "histories", constraints: false });
    CheckListHistoryModal.belongsTo(CheckListModal, { foreignKey: "checkList", as: "checklistItem", constraints: false });

    AssemblyModal.hasMany(CheckListHistoryModal, { foreignKey: "assembly", as: "history", constraints: false });
    CheckListHistoryModal.belongsTo(AssemblyModal, { foreignKey: "assembly", as: "assemblyLine", constraints: false });

    ProcessModel.hasMany(CheckListHistoryModal, { foreignKey: "process_id", as: "history", constraints: false });
    CheckListHistoryModal.belongsTo(ProcessModel, { foreignKey: "process_id", as: "processInfo", constraints: false });

    UserModel.hasMany(CheckListHistoryModal, { foreignKey: "user_id", as: "checked_items", constraints: false });
    CheckListHistoryModal.belongsTo(UserModel, { foreignKey: "user_id", as: "user", constraints: false });

    UserModel.hasMany(NotificationModal, { foreignKey: "reciverId", as: "received_notifications", constraints: false });
    NotificationModal.belongsTo(UserModel, { foreignKey: "reciverId", as: "receiver", constraints: false });

    UserModel.hasMany(NotificationModal, { foreignKey: "senderId", as: "sent_notifications", constraints: false });
    NotificationModal.belongsTo(UserModel, { foreignKey: "senderId", as: "sender", constraints: false });

    AssemblyModal.hasMany(NotificationModal, { foreignKey: "assembly", as: "notifications", constraints: false });
    NotificationModal.belongsTo(AssemblyModal, { foreignKey: "assembly", as: "assemblyLine", constraints: false });

    ProcessModel.hasMany(NotificationModal, { foreignKey: "process_id", as: "notifications", constraints: false });
    NotificationModal.belongsTo(ProcessModel, { foreignKey: "process_id", as: "processInfo", constraints: false });

    CheckListModal.hasMany(NotificationModal, { foreignKey: "checkList", as: "notifications", constraints: false });
    NotificationModal.belongsTo(CheckListModal, { foreignKey: "checkList", as: "checklistItem", constraints: false });

    DepartmentModel.hasMany(UserModel, { foreignKey: "department_id", as: "users", constraints: false });
    UserModel.belongsTo(DepartmentModel, { foreignKey: "department_id", as: "department", constraints: false });

    // Checklist → ItemCheckTime (1 : N)
    CheckListModal.hasMany(ItemCheckTimeModel, {
        foreignKey: "item_id",
        as: "time"
    });

    // ItemCheckTime → Checklist (N : 1)
    ItemCheckTimeModel.belongsTo(CheckListModal, {
        foreignKey: "item_id",
        as: "checklistItem"
    });


    modelsInitialized = true;

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

