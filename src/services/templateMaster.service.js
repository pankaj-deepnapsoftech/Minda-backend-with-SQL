// @ts-nocheck
import { Op } from "sequelize";
import { TemplateMasterModel, ASSIGNED_USER_STATUS_ENUM } from "../models/templateMaster.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { UserModel } from "../models/user.modal.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import { WorkflowApprovalModel } from "../models/workflowApproval.model.js";
import { GroupUsersModel } from "../models/groupUsers.model.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";
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

// assigned_users ke andar wale status: har (template, user) ke liye ek row, assigned_user fallback
export const getTemplateStatusListService = async (skip = 0, limit = 5) => {
  // First, get total count of all templates (before pagination)
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

  // Get all unique user IDs from all templates
  const allUserIds = new Set();
  templates.forEach(template => {
    const assignedUsers = template.assigned_users || [];
    assignedUsers.forEach(au => allUserIds.add(au.user_id));
  });

  // Get all unique group IDs from all workflows
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

  // Fetch all users at once
  const users = await UserModel.findAll({
    where: {
      _id: Array.from(allUserIds)
    },
    attributes: ['_id', 'full_name', 'email', 'desigination', 'user_id',
      'is_hod', 'employee_plant', "hod_id"]
  });

  // Fetch all group details at once
  const groups = await GroupUsersModel.findAll({
    where: {
      relese_group_id: Array.from(allGroupIds)
    }
  });

  // Fetch release group names
  const releaseGroups = await ReleseGroupModel.findAll({
    where: {
      _id: Array.from(allGroupIds)
    },
    attributes: ['_id', 'group_name', 'group_department']
  });

  // Fetch all workflow approvals for all templates
  const templateIds = templates.map(t => t._id);
  const workflowApprovals = await WorkflowApprovalModel.findAll({
    where: {
      template_id: templateIds
    },
    order: [["current_stage", "ASC"], ["createdAt", "ASC"]]
  });

  // Get all unique HOD IDs
  const allHodIds = new Set();
  users.forEach(user => {
    if (user.hod_id) {
      allHodIds.add(user.hod_id);
    }
  });

  // Get all unique user IDs from groups
  const allGroupUserIds = new Set();
  groups.forEach(g => {
    allGroupUserIds.add(g.user_id);
  });

  // Fetch HOD users
  const hodUsers = await UserModel.findAll({
    where: {
      _id: Array.from(allHodIds)
    },
    attributes: ['_id', 'full_name', 'email', 'desigination', 'user_id',
      'is_hod', 'employee_plant']
  });

  // Fetch group users
  const groupUsers = await UserModel.findAll({
    where: {
      _id: Array.from(allGroupUserIds)
    },
    attributes: ['_id', 'full_name', 'email', 'desigination', 'user_id',
      'is_hod', 'employee_plant']
  });

  // Create maps for quick lookup
  const userMap = new Map(users.map(u => [u._id, u.toJSON()]));
  const hodUserMap = new Map(hodUsers.map(u => [u._id, u.toJSON()]));
  const groupUserMap = new Map(groupUsers.map(u => [u._id, u.toJSON()]));
  const releaseGroupMap = new Map(releaseGroups.map(rg => [rg._id, rg.toJSON()]));

  // Group by relese_group_id
  const groupMap = new Map();
  groups.forEach(g => {
    const groupJson = g.toJSON();
    if (!groupMap.has(groupJson.relese_group_id)) {
      groupMap.set(groupJson.relese_group_id, []);
    }
    groupMap.get(groupJson.relese_group_id).push(groupJson);
  });

  // Create approval map: template_id -> current_stage -> array of approvals
  const approvalMap = new Map();
  workflowApprovals.forEach(approval => {
    const approvalJson = approval.toJSON();
    if (!approvalMap.has(approvalJson.template_id)) {
      approvalMap.set(approvalJson.template_id, new Map());
    }
    const templateApprovalMap = approvalMap.get(approvalJson.template_id);
    if (!templateApprovalMap.has(approvalJson.current_stage)) {
      templateApprovalMap.set(approvalJson.current_stage, []);
    }
    templateApprovalMap.get(approvalJson.current_stage).push(approvalJson);
  });

  // Flatten: har user ke liye template ka object
  const result = [];

  templates.forEach(template => {
    const templateJson = template.toJSON();
    const assignedUsers = templateJson.assigned_users || [];

    assignedUsers.forEach(au => {
      const currentUser = userMap.get(au.user_id);
      
      // Workflow details ko enhance karo
      if (templateJson.workflow && templateJson.workflow.workflow) {
        const templateApprovalMap = approvalMap.get(templateJson._id) || new Map();
        
        templateJson.workflow.workflow = templateJson.workflow.workflow.map((wf, index) => {
          let groupDetail = null;
          let groupInfo = null;
          
          if (wf.group === "HOD") {
            // HOD ke liye hod_id se user detail lao
            groupDetail = currentUser && currentUser.hod_id 
              ? hodUserMap.get(currentUser.hod_id) || null
              : null;
            groupInfo = { group_name: "HOD", group_department: null };
          } else {
            // Baaki groups ke liye plant match karo
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
          }

          // Get all approvals for this stage
          const stageApprovals = templateApprovalMap.get(index) || [];

          return {
            ...wf,
            group_name: groupInfo?.group_name || null,
            group_department: groupInfo?.group_department || null,
            groupDetail: groupDetail,
            approvals: stageApprovals // Ab array hai jisme multiple approvals ho sakte hain
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

  // Calculate pagination metadata
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

/**
 * Returns workflow approval chain: HOD -> only the approver to whom approval goes.
 * Approver is chosen by plant match: release group user whose plants_id matches assigned user's employee_plant.
 */
export const getTemplateWorkflowStatusService = async (templateId, assignedUserId = null) => {
  const template = await TemplateMasterModel.findByPk(templateId, {
    include: [
      {
        model: WorkflowModel,
        as: "workflow",
        required: false,
        attributes: ["_id", "name", "workflow"],
      },
    ],
  });
  if (!template) {
    throw new NotFoundError("Template not found", "getTemplateWorkflowStatusService()");
  }
  const w = template.workflow;
  const workflowName = w != null && w.name != null ? w.name : null;
  const workflowId = template.workflow_id != null ? template.workflow_id : null;
  const steps = Array.isArray(w && w.workflow) ? w.workflow : [];
  if (!steps.length) {
    return {
      template_id: template._id,
      template_name: template.template_name,
      workflow_id: workflowId,
      workflow_name: workflowName || null,
      chain: [],
    };
  }

  let assignedUserPlantId = null;
  if (assignedUserId) {
    const assignedUser = await UserModel.findOne({
      where: { _id: assignedUserId },
      attributes: ["employee_plant"],
      raw: true,
    });
    assignedUserPlantId = assignedUser && assignedUser.employee_plant != null ? assignedUser.employee_plant : null;
  }

  const chain = [];
  let stageIndex = 0;
  const releaseGroupIds = steps
    .filter((s) => s.group && String(s.group) !== "HOD")
    .map((s) => s.group);

  const hodUserIds = steps
    .filter((s) => s.group === "HOD" && s.user && String(s.user).trim())
    .map((s) => String(s.user).trim());
  const hodUsers =
    hodUserIds.length > 0
      ? await UserModel.findAll({
          where: { _id: { [Op.in]: [...new Set(hodUserIds)] } },
          attributes: ["_id", "full_name"],
          raw: true,
        })
      : [];
  const hodNameById = Object.fromEntries((hodUsers || []).map((u) => [u._id, u.full_name || "HOD"]));

  let groupUsers = [];
  if (releaseGroupIds.length) {
    groupUsers = await GroupUsersModel.findAll({
      where: { relese_group_id: { [Op.in]: releaseGroupIds } },
      include: [{ model: UserModel, as: "user", attributes: ["_id", "full_name"], required: false }],
      order: [["createdAt", "ASC"]],
    });
  }
  const groupUsersByGroup = new Map();
  for (const gu of groupUsers) {
    const gid = gu.relese_group_id != null ? gu.relese_group_id : (gu.get && gu.get("relese_group_id"));
    if (!groupUsersByGroup.has(gid)) groupUsersByGroup.set(gid, []);
    groupUsersByGroup.get(gid).push(gu);
  }

  for (const step of steps) {
    if (step.group === "HOD") {
      const hodUserId = (step.user && String(step.user).trim()) || null;
      const hodLabel = hodUserId && hodNameById[hodUserId] ? `${hodNameById[hodUserId]} (HOD)` : "HOD";
      chain.push({ stage_index: stageIndex, type: "HOD", label: hodLabel, user_id: hodUserId });
      stageIndex++;
    } else if (step.group) {
      const users = groupUsersByGroup.get(step.group) || [];
      for (const gu of users) {
        const u = gu.user != null ? gu.user : (gu.get && gu.get("user"));
        const uName = u && (u.full_name != null ? u.full_name : (typeof u.get === "function" ? u.get("full_name") : null));
        const label = uName || gu.user_id || "—";
        const uid = gu.user_id != null ? gu.user_id : (gu.get && gu.get("user_id"));
        chain.push({
          stage_index: stageIndex,
          type: "user",
          label: String(label),
          user_id: uid,
        });
        stageIndex++;
      }
    }
  }

  const isAssignedUser = (c) =>
    assignedUserId && c.user_id && String(c.user_id) === String(assignedUserId);

  const approvals = await WorkflowApprovalModel.findAll({
    where: { template_id: templateId },
    order: [["current_stage", "ASC"]],
    attributes: ["current_stage", "status", "remarks", "approved_by", "createdAt"],
  });
  const approvalByStage = {};
  for (const a of approvals) {
    approvalByStage[a.current_stage] = a;
  }

  let chainWithStatus = chain.map((c) => {
    const appr = approvalByStage[c.stage_index];
    const row = appr && (appr.toJSON ? appr.toJSON() : appr);
    return {
      stage_index: c.stage_index,
      type: c.type,
      label: c.label,
      user_id: c.user_id != null ? c.user_id : null,
      status: row && row.status != null ? row.status : null,
      approved_at: row && row.createdAt != null ? row.createdAt : null,
      remarks: row && row.remarks != null ? row.remarks : null,
      approved_by: row && row.approved_by != null ? row.approved_by : null,
    };
  });

  if (assignedUserId) {
    chainWithStatus = chainWithStatus.filter((c) => !isAssignedUser(c));
  }

  return {
    template_id: template._id,
    template_name: template.template_name,
    workflow_id: workflowId,
    workflow_name: workflowName,
    chain: chainWithStatus,
  };
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



const workflowApprovalsInclude = {
  model: WorkflowApprovalModel,
  as: "workflowApprovals",
  required: false,
  include: [
    { model: UserModel, as: "user", attributes: ["_id", "full_name", "email", "user_id"], required: false },
  ],
};

export const GetTemplateAssignModuleService = async (userIds) => {
  const templates = await TemplateMasterModel.findAll({
    where: Sequelize.literal(`
      EXISTS (
        SELECT 1
        FROM OPENJSON(assigned_users)
        WITH (
          user_id NVARCHAR(100) '$.user_id'
        ) AS users
        WHERE users.user_id IN (${userIds.map(id => `'${id}'`).join(",")})
      )
    `),
    include: [{ model: WorkflowModel, as: "workflow" }]
  });

  const result = {};

  userIds.forEach(userId => {
    result[userId] = [];
  });

  templates.forEach(template => {
    userIds.forEach(userId => {
      const matchedUser = template.assigned_users.find(
        u => u.user_id === userId
      );

      if (matchedUser) {
        result[userId].push({
          ...template.toJSON(),

          // ✅ ONLY ONE USER IN assigned_users
          assigned_users: [
            {
              user_id: matchedUser.user_id,
              status: matchedUser.status
            }
          ],

          // optional shortcut
          user_status: matchedUser.status
        });
      }
    });
  });

  return result;
};

export const updateTemplateMasterWithWorkflow = async (id, data) => {
  const templates = await TemplateMasterModel.findByPk(id);
  if (!templates) {
    throw new NotFoundError("Template not found", "updateTemplateMasterWithWorkflow()");
  }
  await templates.update(data);
};

export const testing = async (hodId) => {
  try {
    // 1️⃣ Get all users under HOD
    const users = await UserModel.findAll({
      where: { hod_id: hodId },
      attributes: ["_id", "email", "user_id", "full_name"],
    });

    if (!users.length) return [];

    // 2️⃣ Get all active templates
    const templates = await TemplateMasterModel.findAll({
      where: { is_active: true },
      include:[ { model: WorkflowModel, as: "workflow" }]
    });

    // 3️⃣ Get all workflow approvals (only required fields)
    const approvals = await WorkflowApprovalModel.findAll({
      attributes: [
        "_id",
        "status",
        "current_stage",
        "reassign_stage",
        "workflow_id",
        "user_id",
        "template_id",
        "remarks",
        "approved_by",
        "createdAt",
      ],
    });

    // 4️⃣ Mapping
    const response = users.map((user) => {
      const userId = String(user._id);

      const userTemplates = templates
        .map((tpl) => {
          // check if user is assigned to this template
          let isAssigned = false;

          // old single-user support
          if (tpl.assigned_user && String(tpl.assigned_user) === userId) {
            isAssigned = true;
          }

          // new multi-user support
          const assignedUsers = tpl.assigned_users || [];
          if (assignedUsers.some((u) => u.user_id === userId)) {
            isAssigned = true;
          }

          if (!isAssigned) return null;

          // workflow approvals for this user + template
          const tplApprovals = approvals.filter(
            (appr) =>
              String(appr.user_id) === userId &&
              String(appr.template_id) === String(tpl._id)
          );

          // Extract HOD user ID from workflow
          let hodId = null;
          const workflowData = tpl.workflow?.workflow || [];
          if (Array.isArray(workflowData)) {
            const hodStage = workflowData.find(
              (stage) => stage.group === "HOD" && stage.user && stage.user.trim() !== ""
            );
            if (hodStage && hodStage.user) {
              hodId = hodStage.user.trim();
            }
          }

          // Add workflow object with hod_id
          const workflowObj = tpl.workflow ? {
            ...tpl.workflow.toJSON ? tpl.workflow.toJSON() : tpl.workflow,
            hod_id: hodId
          } : null;

          // Add is_approved_by_hod field to workflow approvals based on approved_by
          const enrichedApprovals = tplApprovals.map((appr) => {
            const approvalData = appr.toJSON ? appr.toJSON() : appr;
            return {
              ...approvalData,
              is_approved_by_hod: hodId && approvalData.approved_by 
                ? String(approvalData.approved_by) === String(hodId) 
                : false
            };
          });

          return {
            _id: tpl._id,
            template_name: tpl.template_name,
            template_type: tpl.template_type,
            workflow_id: tpl.workflow_id,
            is_active: tpl.is_active,
            assigned_status:
              assignedUsers.find((u) => u.user_id === userId)?.status ??
              "pending",
            workflow_approvals: enrichedApprovals,
            workflow: workflowObj
          };
        })
        .filter(Boolean);

      return {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        user_id: user.user_id,
        template_masters: userTemplates,
      };
    });

    return response;
  } catch (error) {
    console.error("Testing API error:", error);
    throw error;
  }
};
