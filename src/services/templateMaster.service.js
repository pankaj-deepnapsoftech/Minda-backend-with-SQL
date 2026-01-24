// @ts-nocheck
import { Op } from "sequelize";
import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { UserModel } from "../models/user.modal.js";
import { WorkflowModel } from "../models/workflow.modal.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";

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

  // Handle assigned_users (array) - preferred
  let assignedUsersArray = null;
  if (assigned_users && Array.isArray(assigned_users) && assigned_users.length > 0) {
    // Validate all users exist
    for (const userId of assigned_users) {
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new BadRequestError(`Assigned user ${userId} not found`, "createTemplateService()");
      }
    }
    assignedUsersArray = assigned_users;
  } else if (assigned_user) {
    // Backward compatibility: handle single assigned_user
    const userId = String(assigned_user).trim();
    if (userId) {
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new BadRequestError("Assigned user not found", "createTemplateService()");
      }
      assignedUsersArray = [userId];
    }
  }

  const created = await TemplateMasterModel.create({
    template_name: name,
    template_type: template_type || null,
    assigned_user: assignedUsersArray && assignedUsersArray.length > 0 ? assignedUsersArray[0] : null, // Keep first user for backward compatibility
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

  // Handle assigned_users (array) - preferred
  let assignedUsersArray = template.assigned_users || []; // Keep existing value by default
  if (assigned_users !== undefined) {
    if (assigned_users === null || (Array.isArray(assigned_users) && assigned_users.length === 0)) {
      assignedUsersArray = null;
    } else if (Array.isArray(assigned_users) && assigned_users.length > 0) {
      // Validate all users exist
      for (const userId of assigned_users) {
        const user = await UserModel.findByPk(userId);
        if (!user) {
          throw new BadRequestError(`Assigned user ${userId} not found`, "updateTemplateService()");
        }
      }
      assignedUsersArray = assigned_users;
    }
  } else if (assigned_user !== undefined) {
    // Backward compatibility: handle single assigned_user
    if (assigned_user === null || assigned_user === "") {
      assignedUsersArray = null;
    } else {
      const userId = String(assigned_user).trim();
      if (userId) {
        const user = await UserModel.findByPk(userId);
        if (!user) {
          throw new BadRequestError("Assigned user not found", "updateTemplateService()");
        }
        assignedUsersArray = [userId];
      } else {
        assignedUsersArray = null;
      }
    }
  }

  await template.update({
    template_name: name,
    template_type: template_type || null,
    assigned_user: assignedUsersArray && assignedUsersArray.length > 0 ? assignedUsersArray[0] : null, // Keep first user for backward compatibility
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

  // Filter templates where user is assigned (either in assigned_user or assigned_users array)
  const assignedTemplates = allTemplates.filter((template) => {
    // Check backward compatibility: single assigned_user
    if (template.assigned_user === userId) {
      return true;
    }
    // Check assigned_users array
    const assignedUsers = template.assigned_users || [];
    if (Array.isArray(assignedUsers) && assignedUsers.includes(userId)) {
      return true;
    }
    return false;
  });

  return assignedTemplates;
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

export const UpdateOnlyTemplateMaster = async (templateId,next,data) => {
  const result = await TemplateMasterModel.findByPk(templateId);
  if(!result){
   next(new NotFoundError("Data not found","UpdateOnlyTemplateMaster() method error"))
  }
  return await result.update(data);
}

