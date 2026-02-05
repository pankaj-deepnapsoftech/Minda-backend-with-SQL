import { UserModel } from "../models/user.modal.js";
import { CompanyModel } from "../models/company.modal.js";
import { PlantModel } from "../models/plant.modal.js";
import { RoleModel } from "../models/role.modal.js";
import { Op } from "sequelize";
import { DepartmentModel } from "../models/department.modal.js";
import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import { GroupUsersModel } from "../models/groupUsers.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { TemplateSubmissionModel } from "../models/templateSubmission.model.js";
import { WorkflowApprovalModel } from "../models/workflowApproval.model.js";
import { getCurrentApproverForTemplateAssignee } from "./templateMaster.service.js";



export const createUserService = async (data) => {
    const result = await UserModel.create(data);
    return result;

};

export const GetUsersService = async (skip, limit) => {
    const result = await UserModel.findAll({
        where: { is_admin: false },
        include: [
            { model: RoleModel, as: "userRole" },
            { model: CompanyModel, as: "company" },
            { model: PlantModel, as: "plant" },
            { model: DepartmentModel, as: "department" },
        ],
        offset: skip,
        limit,
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const GetAllUsersService = async () => {
    const result = await UserModel.findAll({
        where: { is_admin: false },
        attributes: ["_id", "email", "user_id", "full_name"],
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const SearchUsersService = async (is_hod, company, plant, search = "", skip, limit) => {
    const q = search || "";
    const where = {
        is_admin: false,
        [Op.or]: [{ email: { [Op.like]: `%${q}%` } }, { user_id: { [Op.like]: `%${q}%` } }],
        ...(is_hod ? { is_hod } : {}),
        ...(company ? { employee_company: company } : {}),
        ...(plant ? { employee_plant: plant } : {}),
    }

    const result = await UserModel.findAll({
        where,
        include: [
            { model: RoleModel, as: "userRole" },
            { model: CompanyModel, as: "company" },
            { model: PlantModel, as: "plant" },
            { model: DepartmentModel, as: "department" },
        ],
        offset: skip,
        limit,
        order: [["createdAt", "ASC"]],
    });
    return result;
};

export const UpdateUsersService = async (id, data) => {
    const user = await UserModel.findByPk(id);
    if (!user) return null;
    const result = await user.update(data);
    return result;
};

export const DeleteUsersService = async (id) => {
    const user = await UserModel.findByPk(id);
    if (!user) return null;
    await user.destroy();
    const result = user;
    return result;
};

export const FindUserByEmailOrUserId = async (email) => {
    const result = await UserModel.findOne({
        where: { [Op.or]: [{ email }, { user_id: email }] },
    });
    return result;
};


export const FindUserById = async (id) => {
    const result = await UserModel.findByPk(id, {
        attributes: [
            "_id",
            "full_name",
            "email",
            "desigination",
            "user_id",
            "employee_plant",
            "employee_company",
            "role",
            "is_admin",
            "terminate",
            "is_hod",
            "hod_id",
        ],
        include: [
            { model: PlantModel, as: "plant" },
            { model: CompanyModel, as: "company" },
            { model: RoleModel, as: "userRole" },
            // { model: RoleModel, as: "department" },
        ],
    });
    return result;
};

export const FindUserByEmail = async (email) => {
    const result = await UserModel.findOne({ where: { email } });
    return result;
};


export const GetAdmin = async () => {
    const result = await UserModel.findOne({ where: { is_admin: true } });
    return result;
};


export const GetUsersByIdService = async (id) => {
    const result = await UserModel.findOne({
        where: {
            _id: id
        },
        attributes: [
            "_id",
            "full_name",
            "email",
            "desigination",
            "user_id",
            "hod_id",
        ]
    });
    return result;
};

export const getAllHodsServicesData = async () => {
    const result = await UserModel.findAll({
        attributes: ["_id", "full_name", "email", "user_id"],
        where: {
            is_hod: true
        }
    });
    return result;
};

export const getAllUsersUnderHod = async (id) => {
    const result = await UserModel.findAll({
        where: {
            hod_id: id
        },
        attributes: ["_id"]
    });
    return result.map((item) => item._id)
};

export const getAllReleseGroupUsers = async () => {
    const result = await UserModel.findAll({
        where: {
            is_hod: false,
            hod_id: null,
            is_admin: false
        },
        attributes: ["_id", "user_id", "email", "full_name"]
    });
    return result;

};

export const getEmployeesOnlyHaveHod = async () => {
    const result = await UserModel.findAll({
        where: {
            is_admin: false,
            is_hod: false,
            hod_id: { [Op.not]: null }
        },
        attributes: ["_id", "user_id", "email", "full_name", "is_hod", "hod_id"]
    });
    return result;
};

export const GetTemplateAssignModuleServiceByUser = async (filterUserId) => {
    // Get the filter user details first
    const filterUser = await UserModel.findOne({
        where: { _id: filterUserId },
        raw: true
    });

    const templateField = await TemplateFieldModel.findAll({
        where: {
            type: { [Op.in]: ['HOD', 'Approval'] }
        }
    });

    if (!filterUser) {
        throw new Error('Filter user not found');
    }


    // Get all non-admin users with HOD
    const allUsers = await UserModel.findAll({
        where: {
            is_admin: false,
            hod_id: { [Op.not]: null }
        },
        raw: true
    });

    // Get all active templates
    const templates = await TemplateMasterModel.findAll({
        where: {
            is_active: true
        },
        raw: false
    });


    // Get all template IDs
    const templateIds = templates.map(t => t._id);

    // Get all user IDs
    const userIds = allUsers.map(u => u._id);

    // Fetch all template fields for field_id to field_name mapping only
    const templateFields = await TemplateFieldModel.findAll({
        where: {
            template_id: { [Op.in]: templateIds }
        },
        raw: true
    });

    // Create a map of field_id to field_name (for form_data conversion)
    const fieldIdToNameMap = new Map();
    templateFields.forEach(field => {
        fieldIdToNameMap.set(field._id, field.field_name);
    });


    // Fetch only SUBMITTED template submissions
    const templateSubmissions = await TemplateSubmissionModel.findAll({
        where: {
            template_id: { [Op.in]: templateIds },
            user_id: { [Op.in]: userIds },
            status: "SUBMITTED" // Only get submitted submissions
        },
        raw: false
    });

    // Create a map of template_id + user_id to submission
    const submissionsMap = new Map();
    templateSubmissions.forEach(submission => {
        const key = `${submission.template_id}_${submission.user_id}`;

        // console.log(submission)

        // Convert form_data from field_id to field_name
        const originalFormData = submission.form_data || {};
        const convertedFormData = {};

        Object.keys(originalFormData).forEach(fieldId => {
            const fieldName = fieldIdToNameMap.get(fieldId);
            console.log(fieldId)
            if (fieldName) {
                convertedFormData[fieldName] = originalFormData[fieldId];
            } else {
                convertedFormData[fieldId] = originalFormData[fieldId];
            }
        });

        submissionsMap.set(key, {
            submission_id: submission._id,
            status: submission.status,
            form_data: convertedFormData,
            submitted_at: submission.createdAt,
            updated_at: submission.updatedAt,
            prev:submission.form_data
        });
    });

    // console.log("Submissions Map Size:", submissionsMap);

    // Get all unique workflow IDs from templates
    const workflowIds = [...new Set(
        templates
            .map(t => t.workflow_id)
            .filter(Boolean)
    )];

    // Fetch all workflow approvals
    const workflowApprovals = await WorkflowApprovalModel.findAll({
        where: {
            template_id: { [Op.in]: templateIds },
            user_id: { [Op.in]: userIds }
        },
        order: [['current_stage', 'ASC']],
        raw: true
    });

    // Create a map of template_id + user_id to approvals array
    const approvalsMap = new Map();
    // Rejected checklists: template_id_user_id - agar reject hua to next approver ko dikhana nahi
    const rejectedKeys = new Set();
    workflowApprovals.forEach(approval => {
        const key = `${approval.template_id}_${approval.user_id}`;
        if (!approvalsMap.has(key)) {
            approvalsMap.set(key, []);
        }
        approvalsMap.get(key).push({
            approval_id: approval._id,
            current_stage: approval.current_stage,
            reassign_stage: approval.reassign_stage,
            reassign_user_id: approval.reassign_user_id,
            reassign_status: approval.reassign_status,
            workflow_id: approval.workflow_id,
            status: approval.status,
            remarks: approval.remarks,
            approved_by: approval.approved_by,
            approved_at: approval.createdAt,
            updated_at: approval.updatedAt,
        })
        // Agar HOD/approver ne reject kiya, next wale ko approval list mein mat dikhao
        const isRejected = (approval.status || "").toLowerCase() === "reject" || approval.status === "rejected";
        if (isRejected) {
            rejectedKeys.add(key);
        }
    });

    // Fetch all workflows at once
    const workflows = await WorkflowModel.findAll({
        where: {
            _id: { [Op.in]: workflowIds }
        },
        raw: false
    });

    // Extract all unique release group IDs from all workflows
    const releaseGroupIds = new Set();
    workflows.forEach(workflow => {
        const workflowSteps = workflow.workflow || [];
        workflowSteps.forEach(step => {
            if (step.group && step.group !== "HOD" && step.group.trim() !== "") {
                releaseGroupIds.add(step.group);
            }
        });
    });

    // Fetch all group users for these release groups
    const groupUsers = await GroupUsersModel.findAll({
        where: {
            relese_group_id: { [Op.in]: Array.from(releaseGroupIds) }
        },
        order: [['createdAt', 'ASC']],
        raw: true
    });

    // Create a map of release_group_id to array of group users
    const groupUsersMap = new Map();
    groupUsers.forEach(gu => {
        if (!groupUsersMap.has(gu.relese_group_id)) {
            groupUsersMap.set(gu.relese_group_id, []);
        }
        groupUsersMap.get(gu.relese_group_id).push(gu);
    });

    // Process workflows and attach group users data
    const workflowMap = new Map(
        workflows.map(w => {
            const workflowSteps = (w.workflow || []).map(step => {
                if (step.group && step.group !== "HOD" && step.group.trim() !== "") {
                    const groupUsersList = groupUsersMap.get(step.group) || [];

                    const allGroupUsers = groupUsersList.map(gu => ({
                        user_id: gu.user_id,
                        plants_id: gu.plants_id
                    }));

                    return {
                        group: step.group,
                        group_users: allGroupUsers
                    };
                } else if (step.group === "HOD") {
                    return {
                        group: "HOD",
                        group_users: []
                    };
                }

                return {
                    group: step.group || "",
                    group_users: []
                };
            });

            return [
                w._id,
                {
                    workflow_id: w._id,
                    workflow_name: w.name,
                    workflow: workflowSteps
                }
            ];
        })
    );

    const approvalUserIds = new Set();
    workflowApprovals.forEach(a => {
        if (a.approved_by) approvalUserIds.add(a.approved_by);
        if (a.reassign_user_id) approvalUserIds.add(a.reassign_user_id);
    });
    const approvalUsersList = approvalUserIds.size > 0
        ? await UserModel.findAll({
            where: { _id: [...approvalUserIds] },
            attributes: ["_id", "full_name"],
            raw: true
        })
        : [];
    const approvalUserMap = new Map(approvalUsersList.map(u => [String(u._id), u.full_name || ""]));

    // Function to check if user should be included
    const shouldIncludeUser = (user) => {
        // STEP 1: Check if filterUserId is the HOD of this user
        if (user.hod_id === filterUserId) {
            return true;
        }

        // STEP 2: Check in workflow groups
        const userTemplates = templates.filter(template => {
            const assignedUsers = template.assigned_users;
            return assignedUsers.some(au => (au.user_id || au._id) === user._id);
        });

        for (const template of userTemplates) {
            const workflow = template.workflow_id ? workflowMap.get(template.workflow_id) : null;
            if (!workflow) continue;

            const workflowSteps = workflow.workflow || [];

            for (const step of workflowSteps) {
                if (step.group === "HOD") continue;
                if (!step.group_users || step.group_users.length === 0) continue;

                for (const groupUser of step.group_users) {
                    try {
                        const plantsArray = JSON.parse(groupUser.plants_id);
                        const plantMatches = plantsArray.includes(user.employee_plant);
                        const userIdMatches = groupUser.user_id === filterUserId;

                        if (plantMatches && userIdMatches) {
                            return true;
                        }
                    } catch (error) {
                        continue;
                    }
                }
            }
        }

        return false;
    };

    // Filter users based on the logic
    const filteredUsers = allUsers.filter(user => shouldIncludeUser(user));

    // Helper function to filter group_users for a specific user's employee_plant
    const filterGroupUsersForUser = (workflowSteps, employeePlant, templateId) => {
        // console.log(employeePlant,workflowSteps);
        if (!workflowSteps || workflowSteps.length === 0) return workflowSteps;

        return workflowSteps.map((step, index) => {
            // console.log(step)

            let fields = [];
            // Skip index 0 (HOD step), only filter from index 1 onwards
            if (index === 0 || step.group === "HOD") {
                fields = templateField.filter(tf => tf.template_id === templateId && tf.type === "HOD")
                return {
                    ...step,
                    fields
                };

            }

            if (!step.group_users || step.group_users.length === 0) {
                return step;
            }

            // Find the matching group_user
            const matchingGroupUser = step.group_users.find(gu => {
                try {
                    const plantsArray = JSON.parse(gu.plants_id);
                    const plantMatches = plantsArray.includes(employeePlant);
                    // const userIdMatches = gu.user_id === filterUserId;
                    fields = templateField.filter(tf => tf.template_id === templateId && tf.type === "Approval" && tf.group_id === step.group)


                    return plantMatches;
                } catch (error) {
                    return false;
                }
            });


            // Return the step with only the matching user, or empty array if no match
            return {
                ...step,
                group_users: matchingGroupUser ? [matchingGroupUser] : [],
                fields
            };
        });
    };

    // Map filtered users to result; only show template to user if they are the current approver (handles reassign)
    const result = await Promise.all(filteredUsers.map(async (user) => {
        const templatesForUser = templates.filter(template => {
            const assignedUsers = template.assigned_users;
            return assignedUsers.some(au =>
                (au.user_id || au._id) === user._id
            );
        });

        const allAllowedReassignIds = new Set();
        const templateApproversMap = new Map();
        for (const template of templatesForUser) {
            const submissionKey = `${template._id}_${user._id}`;
            const submission = submissionsMap.get(submissionKey) || null;
            if (!submission) continue;
            if (rejectedKeys.has(`${template._id}_${user._id}`)) continue;

            const currentApprover = await getCurrentApproverForTemplateAssignee(template._id, user._id);
            if (String(currentApprover.currentApproverUserId) !== String(filterUserId)) continue;

            templateApproversMap.set(String(template._id), currentApprover);
            (currentApprover.allowedReassignUserIds || []).forEach(id => allAllowedReassignIds.add(id));
        }

        const reassignUserList = allAllowedReassignIds.size > 0
            ? await UserModel.findAll({
                where: { _id: [...allAllowedReassignIds] },
                attributes: ["_id", "full_name"],
                raw: true
            })
            : [];
        const reassignUserMap = new Map(reassignUserList.map(u => [String(u._id), u]));

        const assignedTemplates = [];
        for (const template of templatesForUser) {
            const submissionKey = `${template._id}_${user._id}`;
            const submission = submissionsMap.get(submissionKey) || null;
            if (!submission) continue;
            if (rejectedKeys.has(`${template._id}_${user._id}`)) continue;

            const currentApprover = templateApproversMap.get(String(template._id));
            if (!currentApprover || String(currentApprover.currentApproverUserId) !== String(filterUserId)) continue;

            const workflow = template.workflow_id
                ? workflowMap.get(template.workflow_id)
                : null;

            // Filter workflow to show only matching group_user for this user's employee_plant
            const filteredWorkflow = workflow ? {
                ...workflow,
                workflow: filterGroupUsersForUser(workflow.workflow, user.employee_plant, template._id)
            } : null;

            const approvalsKey = `${template._id}_${user._id}`;
            const rawApprovals = approvalsMap.get(approvalsKey) || [];
            const approvals = rawApprovals.map(a => ({
                ...a,
                approved_by_name: a.approved_by ? approvalUserMap.get(String(a.approved_by)) : null,
                reassign_to_name: a.reassign_user_id ? approvalUserMap.get(String(a.reassign_user_id)) : null,
            }));

            const allowedReassignUserIds = currentApprover.allowedReassignUserIds || [];
            const allowed_reassign_users = allowedReassignUserIds
                .map(id => reassignUserMap.get(String(id)))
                .filter(Boolean)
                .map(u => ({ user_id: u._id, full_name: u.full_name || "" }));

            assignedTemplates.push({
                template_id: template._id,
                template_name: template.template_name,
                template_type: template.template_type,
                workflow: filteredWorkflow,  // Using filtered workflow
                submission: submission,
                approvals: approvals,
                has_submission: true,
                current_approver_stage: currentApprover.currentStage,
                allowed_reassign_user_ids: allowedReassignUserIds,
                allowed_reassign_users
            });
        }

        return {
            _id: user._id,
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            employee_plant: user.employee_plant,
            department_id: user.department_id,
            hod_id: user.hod_id,
            assigned_templates: assignedTemplates
        };
    }))
        .then(users => users.filter(user => user.assigned_templates.length > 0));

    return result;
};










