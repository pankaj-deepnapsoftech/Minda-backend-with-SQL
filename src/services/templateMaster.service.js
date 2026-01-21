// @ts-nocheck
import { Op } from "sequelize";
import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { UserModel } from "../models/user.modal.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";

const assignedUserInclude = {
  model: UserModel,
  as: "assignedUser",
  required: false,
  attributes: ["_id", "full_name", "email", "user_id"],
};

const templateFieldsInclude = {
  model: TemplateFieldModel,
  as: "fields",
  required: false,
};

export const createTemplateService = async ({ template_name, template_type, assigned_user }) => {
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

  // Validate assigned_user if provided
  let assignedUserId = null;
  if (assigned_user) {
    const userId = String(assigned_user).trim();
    if (userId) {
      // Check if user exists
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new BadRequestError("Assigned user not found", "createTemplateService()");
      }
      assignedUserId = userId;
    }
  }

  const created = await TemplateMasterModel.create({
    template_name: name,
    template_type: template_type || null,
    assigned_user: assignedUserId,
  });

  return created;
};

export const listTemplatesService = async () => {
  return await TemplateMasterModel.findAll({
    include: [assignedUserInclude],
    order: [["createdAt", "DESC"]],
  });
};

export const getTemplateByIdService = async (id) => {
  const result = await TemplateMasterModel.findByPk(id, {
    include: [
      {
        ...templateFieldsInclude,
        order: [["sort_order", "ASC"]],
      },
      assignedUserInclude,
    ],
  });
  if (!result) {
    throw new NotFoundError("Template not found", "getTemplateByIdService()");
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
  if (field_type === "DROPDOWN") {
    if (!dropdown_options || (Array.isArray(dropdown_options) && dropdown_options.length === 0)) {
      throw new BadRequestError(
        "Dropdown options are required for DROPDOWN field type",
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
        "Dropdown options are required for DROPDOWN field type",
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
  if (field_type === "DROPDOWN") {
    if (!dropdown_options || (Array.isArray(dropdown_options) && dropdown_options.length === 0)) {
      throw new BadRequestError(
        "Dropdown options are required for DROPDOWN field type",
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
        "Dropdown options are required for DROPDOWN field type",
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

export const updateTemplateService = async (templateId, { template_name, template_type, assigned_user }) => {
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

  // Handle assigned_user update
  let assignedUserId = template.assigned_user; // Keep existing value by default
  if (assigned_user !== undefined) {
    if (assigned_user === null || assigned_user === "") {
      assignedUserId = null;
    } else {
      const userId = String(assigned_user).trim();
      if (userId) {
        // Check if user exists
        const user = await UserModel.findByPk(userId);
        if (!user) {
          throw new BadRequestError("Assigned user not found", "updateTemplateService()");
        }
        assignedUserId = userId;
      } else {
        assignedUserId = null;
      }
    }
  }

  await template.update({
    template_name: name,
    template_type: template_type || null,
    assigned_user: assignedUserId,
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

