// @ts-nocheck
import { Op, Sequelize } from "sequelize";
import { TemplateMasterModel, ASSIGNED_USER_STATUS_ENUM } from "../models/templateMaster.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { UserModel } from "../models/user.modal.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";

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
export const getTemplateStatusListService = async () => {
  const templates = await TemplateMasterModel.findAll({
    include: [workflowInclude],
    order: [["createdAt", "DESC"]],
  });
  const allUserIds = [];
  const rows = [];
  for (const t of templates) {
    const list = t.assigned_users || [];
    const seen = new Set();
    for (const au of list) {
      if (au && au.user_id) {
        seen.add(au.user_id);
        allUserIds.push(au.user_id);
        rows.push({
          template_id: t._id,
          template_name: t.template_name,
          template_type: t.template_type || null,
          workflow_name: t.workflow?.name || null,
          user_id: au.user_id,
          user_name: null,
          status: au.status || "pending",
        });
      }
    }
    const legacyId = t.assigned_user;
    if (legacyId && !seen.has(legacyId)) {
      allUserIds.push(legacyId);
      rows.push({
        template_id: t._id,
        template_name: t.template_name,
        template_type: t.template_type || null,
        workflow_name: t.workflow?.name || null,
        user_id: legacyId,
        user_name: null,
        status: "pending",
      });
    }
  }
  const uniqueIds = [...new Set(allUserIds)];
  if (uniqueIds.length > 0) {
    const users = await UserModel.findAll({
      where: { _id: { [Op.in]: uniqueIds } },
      attributes: ["_id", "full_name", "user_id", "email"],
    });
    const userDataMap = Object.fromEntries(
      users.map((u) => [
        u._id,
        {
          full_name: u.full_name || u._id,
          employee_user_id: u.user_id || null,
          email: u.email || null,
        },
      ])
    );
    for (const r of rows) {
      const u = userDataMap[r.user_id];
      r.user_name = u?.full_name ?? r.user_id;
      r.employee_user_id = u?.employee_user_id ?? null;
      r.email = u?.email ?? null;
    }
  }
  return rows;
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

