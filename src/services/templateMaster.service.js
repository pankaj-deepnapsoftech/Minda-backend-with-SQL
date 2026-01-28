// @ts-nocheck
import { Op } from "sequelize";
import { TemplateMasterModel, ASSIGNED_USER_STATUS_ENUM } from "../models/templateMaster.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { UserModel } from "../models/user.modal.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
import { GroupUsersModel } from "../models/groupUsers.model.js";
import { WorkflowApprovalModel } from "../models/workflowApproval.model.js";
import { ReleseGroupModel } from "../models/ReleseGroup.modal.js";

// Normalize to [{ user_id, status }]. Accepts: [id], [{ user_id, status? }], [{ _id }]
function toAssignedUsersArray(raw) {
  if (!raw) return null;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out = raw
    .map((x) => {
      if (typeof x === "string" && x) return { user_id: String(x), status: "pending" };
      if (x && typeof x === "object" && (x.user_id != null || x._id != null)) {
        return {
          user_id: String(x.user_id ?? x._id),
          status: ASSIGNED_USER_STATUS_ENUM.includes(x.status) ? x.status : "pending",
        };
      }
      return null;
    })
    .filter(Boolean);
  return out.length ? out : null;
}

function extractUserIds(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x) => (typeof x === "string" ? x : x && (x.user_id || x._id)))
    .filter(Boolean);
}

const assignedUserInclude = {
  model: UserModel,
  as: "assignedUser",
  required: false,
  attributes: ["_id", "full_name", "email", "user_id"],
};

const workflowInclude = {
  model: WorkflowModel,
  as: "workflow",
  required: false,
  attributes: ["_id", "name"],
};

const templateFieldsInclude = {
  model: TemplateFieldModel,
  as: "fields",
  required: false,
};

export const createTemplateService = async ({ template_name, template_type, assigned_user, assigned_users }) => {
  const name = (template_name || "").trim();
  if (!name) {
    throw new BadRequestError("Template Name is required", "createTemplateService()");
  }

  const exist = await TemplateMasterModel.findOne({
    where: { template_name: { [Op.eq]: name } },
  });
  if (exist) {
    throw new BadRequestError("Template already exists", "createTemplateService()");
  }

  // assigned_users: [{ user_id, status }]. Accepts [id] or [{ user_id, status? }] or [{ _id }]
  let assignedUsersArray = null;
  if (assigned_users && Array.isArray(assigned_users) && assigned_users.length > 0) {
    assignedUsersArray = toAssignedUsersArray(assigned_users);
    const ids = extractUserIds(assigned_users);
    for (const uid of ids) {
      const user = await UserModel.findByPk(uid);
      if (!user) throw new BadRequestError(`Assigned user ${uid} not found`, "createTemplateService()");
    }
  } else if (assigned_user) {
    const userId = String(assigned_user).trim();
    if (userId) {
      const user = await UserModel.findByPk(userId);
      if (!user) throw new BadRequestError("Assigned user not found", "createTemplateService()");
      assignedUsersArray = [{ user_id: userId, status: "pending" }];
    }
  }

  const firstUserId = assignedUsersArray && assignedUsersArray.length > 0 ? assignedUsersArray[0].user_id : null;

  const created = await TemplateMasterModel.create({
    template_name: name,
    template_type: template_type || null,
    assigned_user: firstUserId,
    assigned_users: assignedUsersArray,
  });

  return created;
};

export const listTemplatesService = async () => {
  return await TemplateMasterModel.findAll({
    include: [assignedUserInclude, workflowInclude],
    order: [["createdAt", "DESC"]],
  });
};

export const getTemplateByIdService = async (id) => {
  const result = await TemplateMasterModel.findByPk(id, {
    include: [
      templateFieldsInclude,
      assignedUserInclude,
      workflowInclude,
    ],
  });
  if (!result) {
    throw new NotFoundError("Template not found", "getTemplateByIdService()");
  }
  // Sequelize 'order' inside include does not reliably sort hasMany; sort in-memory
  if (result.fields && Array.isArray(result.fields)) {
    result.fields.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
  return result;
};

export const addFieldToTemplateService = async (
  templateId,
  { field_name, field_type, is_mandatory, sort_order, dropdown_options }
) => {
  const template = await TemplateMasterModel.findByPk(templateId);
  if (!template) {
    throw new NotFoundError("Template not found", "addFieldToTemplateService()");
  }

  const name = (field_name || "").trim();
  if (!name) {
    throw new BadRequestError("Field Name is required", "addFieldToTemplateService()");
  }
  if (!field_type) {
    throw new BadRequestError("Field Type is required", "addFieldToTemplateService()");
  }

  let dropdownOptionsString = null;
  if (field_type === "DROPDOWN" || field_type === "RADIO") {
    if (!dropdown_options || (Array.isArray(dropdown_options) && dropdown_options.length === 0)) {
      throw new BadRequestError(
        `Options are required for ${field_type} field type`,
        "addFieldToTemplateService()"
      );
    }
    // allow array or comma-separated string
    let arr = [];
    if (Array.isArray(dropdown_options)) {
      arr = dropdown_options.map((x) => String(x).trim()).filter(Boolean);
    } else if (typeof dropdown_options === "string") {
      arr = dropdown_options.split(",").map((x) => x.trim()).filter(Boolean);
    }
    if (arr.length === 0) {
      throw new BadRequestError(
        `Options are required for ${field_type} field type`,
        "addFieldToTemplateService()"
      );
    }
    dropdownOptionsString = JSON.stringify(arr);
  }

  const created = await TemplateFieldModel.create({
    template_id: templateId,
    field_name: name,
    field_type,
    is_mandatory: Boolean(is_mandatory),
    sort_order: Number.isFinite(Number(sort_order)) ? Number(sort_order) : 0,
    dropdown_options: dropdownOptionsString,
  });

  return created;
};

export const updateFieldService = async (
  fieldId,
  { field_name, field_type, is_mandatory, dropdown_options }
) => {
  const field = await TemplateFieldModel.findByPk(fieldId);
  if (!field) {
    throw new NotFoundError("Field not found", "updateFieldService()");
  }

  const name = (field_name || "").trim();
  if (!name) {
    throw new BadRequestError("Field Name is required", "updateFieldService()");
  }
  if (!field_type) {
    throw new BadRequestError("Field Type is required", "updateFieldService()");
  }

  let dropdownOptionsString = null;
  if (field_type === "DROPDOWN" || field_type === "RADIO") {
    if (!dropdown_options || (Array.isArray(dropdown_options) && dropdown_options.length === 0)) {
      throw new BadRequestError(
        `Options are required for ${field_type} field type`,
        "updateFieldService()"
      );
    }
    let arr = [];
    if (Array.isArray(dropdown_options)) {
      arr = dropdown_options.map((x) => String(x).trim()).filter(Boolean);
    } else if (typeof dropdown_options === "string") {
      arr = dropdown_options.split(",").map((x) => x.trim()).filter(Boolean);
    }
    if (arr.length === 0) {
      throw new BadRequestError(
        `Options are required for ${field_type} field type`,
        "updateFieldService()"
      );
    }
    dropdownOptionsString = JSON.stringify(arr);
  }

  await field.update({
    field_name: name,
    field_type,
    is_mandatory: Boolean(is_mandatory),
    dropdown_options: dropdownOptionsString,
  });

  return field;
};

export const deleteFieldService = async (fieldId) => {
  const field = await TemplateFieldModel.findByPk(fieldId);
  if (!field) {
    throw new NotFoundError("Field not found", "deleteFieldService()");
  }
  await field.destroy();
  return true;
};

export const updateTemplateService = async (templateId, { template_name, template_type, assigned_user, assigned_users }) => {
  const template = await TemplateMasterModel.findByPk(templateId);
  if (!template) {
    throw new NotFoundError("Template not found", "updateTemplateService()");
  }

  const name = (template_name || "").trim();
  if (!name) {
    throw new BadRequestError("Template Name is required", "updateTemplateService()");
  }

  // Check if another template with same name exists (excluding current template)
  const exist = await TemplateMasterModel.findOne({
    where: {
      template_name: { [Op.eq]: name },
      _id: { [Op.ne]: templateId },
    },
  });
  if (exist) {
    throw new BadRequestError("Template already exists", "updateTemplateService()");
  }

  // assigned_users: [{ user_id, status }]. Accepts [id] or [{ user_id, status? }]. Merge with existing to preserve status when only ids sent.
  let assignedUsersArray = template.assigned_users || [];
  if (assigned_users !== undefined) {
    if (assigned_users === null || (Array.isArray(assigned_users) && assigned_users.length === 0)) {
      assignedUsersArray = null;
    } else if (Array.isArray(assigned_users) && assigned_users.length > 0) {
      let toSave = toAssignedUsersArray(assigned_users);
      if (toSave) {
        const existing = template.assigned_users || [];
        for (const t of toSave) {
          const e = existing.find((x) => x && x.user_id === t.user_id);
          if (e && e.status && ASSIGNED_USER_STATUS_ENUM.includes(e.status)) t.status = e.status;
        }
        const ids = toSave.map((o) => o.user_id);
        for (const uid of ids) {
          const user = await UserModel.findByPk(uid);
          if (!user) throw new BadRequestError(`Assigned user ${uid} not found`, "updateTemplateService()");
        }
        assignedUsersArray = toSave;
      }
    }
  } else if (assigned_user !== undefined) {
    if (assigned_user === null || assigned_user === "") {
      assignedUsersArray = null;
    } else {
      const userId = String(assigned_user).trim();
      if (userId) {
        const user = await UserModel.findByPk(userId);
        if (!user) throw new BadRequestError("Assigned user not found", "updateTemplateService()");
        assignedUsersArray = [{ user_id: userId, status: "pending" }];
      } else {
        assignedUsersArray = null;
      }
    }
  }

  const firstUserId = assignedUsersArray && assignedUsersArray.length > 0 ? assignedUsersArray[0].user_id : null;

  await template.update({
    template_name: name,
    template_type: template_type || null,
    assigned_user: firstUserId,
    assigned_users: assignedUsersArray,
  });

  return template;
};

export const deleteTemplateService = async (templateId) => {
  const template = await TemplateMasterModel.findByPk(templateId);
  if (!template) {
    throw new NotFoundError("Template not found", "deleteTemplateService()");
  }

  // Delete all fields associated with this template first
  await TemplateFieldModel.destroy({
    where: { template_id: templateId },
  });

  // Then delete the template
  await template.destroy();
  return true;
};

export const getAssignedTemplatesService = async (userId) => {
  // Fetch all active templates
  const allTemplates = await TemplateMasterModel.findAll({
    where: {
      is_active: true,
    },
    include: [
      templateFieldsInclude,
      assignedUserInclude,
    ],
    order: [["createdAt", "DESC"]],
  });

  // Sequelize 'order' inside include does not reliably sort hasMany; sort in-memory
  allTemplates.forEach((t) => {
    if (t.fields && Array.isArray(t.fields)) {
      t.fields.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }
  });

  // Filter templates where user is in assigned_user or in assigned_users[].user_id
  const assignedTemplates = allTemplates.filter((template) => {
    if (template.assigned_user === userId) return true;
    const list = template.assigned_users || [];
    return list.some((a) => a && (a.user_id === userId || (typeof a === "string" && a === userId)));
  });

  return assignedTemplates;
};

export const getTemplateStatusListService = async (skip = 0, limit = 5) => {
  const totalTemplates = await TemplateMasterModel.count();

  const templates = await TemplateMasterModel.findAll({
    include: [{
      model: WorkflowModel,
      as: "workflow",
      required: false,
    }],
    order: [["createdAt", "ASC"]],
    offset: skip,
    limit
  });

  const allUserIds = new Set();
  templates.forEach(template => {
    const assignedUsers = template.assigned_users || [];
    assignedUsers.forEach(au => allUserIds.add(au.user_id));
  });

  const allGroupIds = new Set();
  templates.forEach(template => {
    if (template.workflow && template.workflow.workflow) {
      template.workflow.workflow.forEach(wf => {
        if (wf.group && wf.group !== "HOD") {
          allGroupIds.add(wf.group);
        }
      });
    }
  });

  const users = await UserModel.findAll({
    where: {
      _id: Array.from(allUserIds)
    },
    attributes: ['_id', 'full_name', 'email', 'desigination', 'user_id',
      'is_hod', 'employee_plant', "hod_id"]
  });

  const groups = await GroupUsersModel.findAll({
    where: {
      relese_group_id: Array.from(allGroupIds)
    }
  });

  const releaseGroups = await ReleseGroupModel.findAll({
    where: {
      _id: Array.from(allGroupIds)
    },
    attributes: ['_id', 'group_name', 'group_department']
  });

  const templateIds = templates.map(t => t._id);
  const workflowApprovals = await WorkflowApprovalModel.findAll({
    where: {
      template_id: templateIds,
    },
    order: [["current_stage", "ASC"], ["createdAt", "ASC"]]
  });

  const allHodIds = new Set();
  users.forEach(user => {
    if (user.hod_id) {
      allHodIds.add(user.hod_id);
    }
  });

  const allGroupUserIds = new Set();
  groups.forEach(g => {
    allGroupUserIds.add(g.user_id);
  });

  // Collect all approved_by IDs from approvals
  const allApprovedByIds = new Set();
  workflowApprovals.forEach(approval => {
    if (approval.approved_by) {
      allApprovedByIds.add(approval.approved_by);
    }
  });

  const hodUsers = await UserModel.findAll({
    where: {
      _id: Array.from(allHodIds)
    },
    attributes: ['_id', 'full_name', 'email', 'desigination', 'user_id',
      'is_hod', 'employee_plant']
  });

  const groupUsers = await UserModel.findAll({
    where: {
      _id: Array.from(allGroupUserIds)
    },
    attributes: ['_id', 'full_name', 'email', 'desigination', 'user_id',
      'is_hod', 'employee_plant']
  });

  // Fetch approved_by users
  const approvedByUsers = await UserModel.findAll({
    where: {
      _id: Array.from(allApprovedByIds)
    },
    attributes: ['_id', 'full_name', 'email', 'desigination', 'user_id',
      'is_hod', 'employee_plant']
  });

  const userMap = new Map(users.map(u => [u._id, u.toJSON()]));
  const hodUserMap = new Map(hodUsers.map(u => [u._id, u.toJSON()]));
  const groupUserMap = new Map(groupUsers.map(u => [u._id, u.toJSON()]));
  const releaseGroupMap = new Map(releaseGroups.map(rg => [rg._id, rg.toJSON()]));
  const approvedByUserMap = new Map(approvedByUsers.map(u => [u._id, u.toJSON()]));

  const groupMap = new Map();
  groups.forEach(g => {
    const groupJson = g.toJSON();
    if (!groupMap.has(groupJson.relese_group_id)) {
      groupMap.set(groupJson.relese_group_id, []);
    }
    groupMap.get(groupJson.relese_group_id).push(groupJson);
  });

  // Create approval map with proper key: template_id-workflow_id-user_id-current_stage
  const approvalMap = new Map();
  workflowApprovals.forEach(approval => {
    const approvalJson = approval.toJSON();
    
    // Add approved_by user details
    if (approvalJson.approved_by) {
      approvalJson.approved_by_user = approvedByUserMap.get(approvalJson.approved_by) || null;
    }
    
    // Key with user_id (user_id = jo approve karna chahiye tha)
    const key = `${approvalJson.template_id}-${approvalJson.workflow_id}-${approvalJson.user_id}-${approvalJson.current_stage}`;
    
    if (!approvalMap.has(key)) {
      approvalMap.set(key, []);
    }
    approvalMap.get(key).push(approvalJson);
  });

  const result = [];

  templates.forEach(template => {
    const templateJson = template.toJSON();
    const assignedUsers = templateJson.assigned_users || [];

    assignedUsers.forEach(au => {
      const currentUser = userMap.get(au.user_id);
      
      if (templateJson.workflow && templateJson.workflow.workflow) {
        
        templateJson.workflow.workflow = templateJson.workflow.workflow.map((wf, index) => {
          let groupDetail = null;
          let groupInfo = null;
          let expectedApproverUserId = null; // Who should approve (user_id in approval table)
          
          if (wf.group === "HOD") {
            groupDetail = currentUser && currentUser.hod_id 
              ? hodUserMap.get(currentUser.hod_id) || null
              : null;
            groupInfo = { group_name: "HOD", group_department: null };
            expectedApproverUserId = currentUser?.hod_id || null; // HOD ki ID
          } else {
            const groupDetailsArray = groupMap.get(wf.group) || [];
            const matchedUser = groupDetailsArray.find(gd => {
              try {
                const plantsArray = JSON.parse(gd.plants_id);
                return currentUser && plantsArray.includes(currentUser.employee_plant);
              } catch {
                return false;
              }
            });

            groupDetail = matchedUser ? groupUserMap.get(matchedUser.user_id) || null : null;
            groupInfo = releaseGroupMap.get(wf.group) || null;
            expectedApproverUserId = matchedUser?.user_id || null; // Group user ki ID
          }

          // Get approvals where user_id matches expected approver
          const approvalKey = `${templateJson._id}-${templateJson.workflow_id}-${expectedApproverUserId}-${index}`;
          const stageApprovals = approvalMap.get(approvalKey) || [];

          return {
            ...wf,
            group_name: groupInfo?.group_name || null,
            group_department: groupInfo?.group_department || null,
            groupDetail: groupDetail,
            approvals: stageApprovals // Each approval has approved_by_user
          };
        });
      }

      result.push({
        user_id: au.user_id,
        status: au.status,
        userDetail: currentUser || null,
        template_data: {
          _id: templateJson._id,
          template_name: templateJson.template_name,
          template_type: templateJson.template_type,
          is_active: templateJson.is_active,
          workflow_id: templateJson.workflow_id,
          createdAt: templateJson.createdAt,
          updatedAt: templateJson.updatedAt,
          workflow: templateJson.workflow
        }
      });
    });
  });

  const totalResults = result.length;
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(totalTemplates / limit);

  return {
    data: result,
    pagination: {
      total: totalTemplates,
      totalResults: totalResults,
      currentPage: currentPage,
      totalPages: totalPages,
      limit: limit,
      skip: skip,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
  };
};

export const assignWorkflowToTemplateService = async (templateId, workflowId) => {
  // Validate template exists
  const template = await TemplateMasterModel.findByPk(templateId);
  if (!template) {
    throw new NotFoundError("Template not found", "assignWorkflowToTemplateService()");
  }

  // Validate workflow exists (if workflowId is provided)
  if (workflowId) {
    const workflow = await WorkflowModel.findByPk(workflowId);
    if (!workflow) {
      throw new NotFoundError("Workflow not found", "assignWorkflowToTemplateService()");
    }
  }

  // Update template with workflow_id (can be null to unassign)
  await template.update({
    workflow_id: workflowId || null,
  });

  return template;
};



// Update status of one assigned user. Body: { user_id, status }
export const updateAssignedUserStatusService = async (templateId, { user_id, status }) => {
  const template = await TemplateMasterModel.findByPk(templateId);
  if (!template) throw new NotFoundError("Template not found", "updateAssignedUserStatusService()");
  const uid = (user_id || "").toString().trim();
  if (!uid) throw new BadRequestError("user_id is required", "updateAssignedUserStatusService()");
  const st = ASSIGNED_USER_STATUS_ENUM.includes(status) ? status : null;
  if (!st) throw new BadRequestError(`status must be one of: ${ASSIGNED_USER_STATUS_ENUM.join(", ")}`, "updateAssignedUserStatusService()");

  const list = (template.assigned_users || []).map((a) => ({ ...a }));
  const i = list.findIndex((a) => a && a.user_id === uid);
  if (i < 0) throw new NotFoundError("User is not assigned to this template", "updateAssignedUserStatusService()");
  list[i].status = st;
  await template.update({ assigned_users: list });
  return template;
};




export const updateTemplateMasterWithWorkflow = async (id, data) => {
  const templates = await TemplateMasterModel.findByPk(id);
  if (!templates) {
    throw new NotFoundError("Template not found", "updateTemplateMasterWithWorkflow()");
  }
  await templates.update(data);
};

