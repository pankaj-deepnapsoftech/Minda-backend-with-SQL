import { Op } from "sequelize";
import { TemplateMasterModel } from "../models/templateMaster.model.js";
import { TemplateFieldModel } from "../models/templateField.model.js";
import { BadRequestError, NotFoundError } from "../utils/errorHandler.js";

export const createTemplateService = async ({ template_name, template_type }) => {
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

  const created = await TemplateMasterModel.create({
    template_name: name,
    template_type: template_type || null,
  });

  return created;
};

export const listTemplatesService = async () => {
  return await TemplateMasterModel.findAll({
    order: [["createdAt", "DESC"]],
  });
};

export const getTemplateByIdService = async (id) => {
  const result = await TemplateMasterModel.findByPk(id, {
    include: [
      {
        model: TemplateFieldModel,
        as: "fields",
        required: false,
      },
    ],
    order: [[{ model: TemplateFieldModel, as: "fields" }, "sort_order", "ASC"]],
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

export const deleteFieldService = async (fieldId) => {
  const field = await TemplateFieldModel.findByPk(fieldId);
  if (!field) {
    throw new NotFoundError("Field not found", "deleteFieldService()");
  }
  await field.destroy();
  return true;
};

