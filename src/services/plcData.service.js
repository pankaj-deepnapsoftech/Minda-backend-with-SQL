import { PlcDataModel } from "../models/plcData.model.js";
import { PlcProductModel } from "../models/plcProduct.model.js";
import { NotFoundError } from "../utils/errorHandler.js";
import { Op, Sequelize } from "sequelize";

/** Attach product name (from plc_products) to plc data by device_id = machine_name */
async function attachProductToPlcData(plcDataOrList) {
  const list = Array.isArray(plcDataOrList) ? plcDataOrList : [plcDataOrList];
  const products = await PlcProductModel.findAll({});
  const productNameByMachine = {};
  products.forEach((p) => {
    if (p.machine_name && p.machine_name.trim()) {
      const name = p.material_description || p.part_no || p.model_code || p.material_code || p.machine_name;
      productNameByMachine[p.machine_name.trim()] = name;
    }
  });
  list.forEach((item) => {
    const product = item.device_id && item.device_id.trim()
      ? productNameByMachine[item.device_id.trim()] || null
      : null;
    item.setDataValue("product", product);
  });
  return plcDataOrList;
}

// Known fields: incoming key -> DB column (for backward compatibility & filtering)
const KNOWN_MAP = {
  companyname: "company_name",
  company_name: "company_name",
  plantname: "plant_name",
  plant_name: "plant_name",
  linenumber: "line_number",
  line_number: "line_number",
  device_id: "device_id",
  timestamp: "timestamp",
  Start_time: "start_time",
  start_time: "start_time",
  Stop_time: "stop_time",
  stop_time: "stop_time",
  Status: "status",
  status: "status",
  model: "model",
  MODEL: "model",
  LATCH_FORCE: "latch_force",
  latch_force: "latch_force",
  CLAW_FORCE: "claw_force",
  claw_force: "claw_force",
  SAFETY_LEVER: "safety_lever",
  safety_lever: "safety_lever",
  CLAW_LEVER: "claw_lever",
  claw_lever: "claw_lever",
  STROKE: "stroke",
  stroke: "stroke",
  PRODUCTION_COUNT: "production_count",
  "PRODUCTION-COUNT": "production_count",
  production_count: "production_count",
  ALARM: "alarm",
  alarm: "alarm",
};

const DATE_FIELDS = ["timestamp", "start_time", "stop_time"];

/** Flatten nested payload (parameters, machine) into single object */
function flattenPayload(data) {
  if (!data || typeof data !== "object") return {};
  const flat = { ...data };
  if (data.machine && typeof data.machine === "object") {
    Object.assign(flat, data.machine);
  }
  if (data.parameters && typeof data.parameters === "object") {
    Object.assign(flat, data.parameters);
  }
  return flat;
}

/** Extract known columns + extra_data (dynamic fields) from flattened payload */
function extractKnownAndExtra(flat) {
  const known = {};
  const extra = {};
  for (const [key, value] of Object.entries(flat)) {
    if (key === "machine" || key === "parameters") continue;
    const dbCol = KNOWN_MAP[key];
    if (dbCol) {
      let val = value;
      if (DATE_FIELDS.includes(dbCol) && val) val = new Date(val);
      known[dbCol] = val ?? null;
    } else {
      // Dynamic field - jo bhi aaya, store
      let val = value;
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        try {
          val = new Date(value);
        } catch (_) {}
      }
      extra[key] = val;
    }
  }
  return { known, extra };
}

export const createPlcDataService = async (data) => {
  const flat = flattenPayload(data);
  const { known, extra } = extractKnownAndExtra(flat);

  const { stop_time, device_id, status, timestamp } = known;

  // Jab stop_time aaye: pehle wali row update karo
  if (stop_time && device_id) {
    const openRow = await PlcDataModel.findOne({
      where: { device_id, stop_time: null },
      order: [["start_time", "DESC"]],
    });
    if (openRow) {
      const updatePayload = {
        stop_time,
        extra_data: { ...(openRow.extra_data || {}), ...extra },
      };
      if (status != null) updatePayload.status = status;
      if (timestamp != null) updatePayload.timestamp = timestamp;
      await openRow.update(updatePayload);
      await attachProductToPlcData(openRow);
      return openRow;
    }
  }

  const plcData = await PlcDataModel.create({
    ...known,
    extra_data: Object.keys(extra).length ? extra : null,
  });

  await attachProductToPlcData(plcData);
  return plcData;
};

export const getAllPlcDataService = async (filters = {}, pagination = {}) => {
  const where = {};

  if (filters.device_id) {
    where.device_id = { [Op.like]: `%${filters.device_id}%` };
  }

  if (filters.model) {
    where.model = { [Op.like]: `%${filters.model}%` };
  }

  if (filters.status) {
    where.status = { [Op.like]: `%${filters.status}%` };
  }

  if (filters.company_name) {
    where.company_name = { [Op.like]: `%${filters.company_name}%` };
  }

  if (filters.plant_name) {
    where.plant_name = { [Op.like]: `%${filters.plant_name}%` };
  }

  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [filters.startDate, filters.endDate],
    };
  }

  if (filters.timestampStart && filters.timestampEnd) {
    where.timestamp = {
      [Op.between]: [filters.timestampStart, filters.timestampEnd],
    };
  }

  const plcDataList = await PlcDataModel.findAll({
    where,
    order: [["created_at", "DESC"]],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  await attachProductToPlcData(plcDataList);
  return plcDataList;
};


export const getPlcDataByIdService = async (id) => {
  const plcData = await PlcDataModel.findByPk(id);
  if (!plcData) {
    throw new NotFoundError("PLC Data not found", "getPlcDataByIdService()");
  }
  await attachProductToPlcData(plcData);
  return plcData;
};

export const updatePlcDataService = async (id, data) => {
  const plcData = await PlcDataModel.findByPk(id);
  if (!plcData) {
    throw new NotFoundError("PLC Data not found", "updatePlcDataService()");
  }

  const flat = flattenPayload(data);
  const { known, extra } = extractKnownAndExtra(flat);

  const updateData = { ...known };
  if (Object.keys(extra).length) {
    updateData.extra_data = { ...(plcData.extra_data || {}), ...extra };
  }

  await plcData.update(updateData);
  await attachProductToPlcData(plcData);

  return plcData;
};

export const deletePlcDataService = async (id) => {
  const plcData = await PlcDataModel.findByPk(id);
  if (!plcData) {
    throw new NotFoundError("PLC Data not found", "deletePlcDataService()");
  }

  await plcData.destroy();
  return true;
};

export const getPlcErrorDistributionService = async (filters = {}) => {
  const where = {};

  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [filters.startDate, filters.endDate],
    };
  }

  if (filters.companyName) {
    where.companyname = {
      [Op.like]: `%${filters.companyName}%`,
    };
  }

  if (filters.plantName) {
    where.plantname = {
      [Op.like]: `%${filters.plantName}%`,
    };
  }

  if (filters.deviceId) {
    where.device_id = {
      [Op.like]: `%${filters.deviceId}%`,
    };
  }

  if (filters.model) {
    where.model = {
      [Op.like]: `%${filters.model}%`,
    };
  }

  const results = await PlcDataModel.findAll({
    attributes: [
      [Sequelize.literal("JSON_VALUE(extra_data, '$.ERROR_CODE')"), 'name'],
      [Sequelize.fn('COUNT', Sequelize.col('_id')), 'value']
    ],
    where: {
      ...where,
    },
    group: [Sequelize.literal("JSON_VALUE(extra_data, '$.ERROR_CODE')")],
    raw: true
  });

  return results.filter(item => item.name);
};

export const getPlcDowntimeByMachineService = async (filters = {}) => {
  const where = {};

  // If status is 'Stopped' or 'Stop', then stop_time - start_time is downtime.
  // We need to filter by status or just check where stop_time is not null?
  // User said "stoppage jo meri stopped time aa rha h". 
  // Let's assume records with non-null stop_time contribute to downtime, 
  // or specifically status='Stopped'.
  // However, often stop_time - start_time IS the duration of the state.
  // If status is 'Running', it's runtime. If 'Stopped', it's downtime.
  
  // Let's try to filter for status NOT 'Running' (case insensitive)
  where.status = {
    [Op.notLike]: 'Running' 
  };
  // Or maybe better: where status LIKE 'Stop%' or similar.
  // Let's assume anything NOT Running is downtime for now, or check for non-null Stop_time.
  // But wait, if Stop_time is present, it means the cycle finished.
  // If Status was 'Running' during that cycle, then Stop - Start is Run Time.
  // If Status was 'Stopped', then Stop - Start is Stop Time.
  // So we must filter by Status = 'Stopped' or similar.
  
  // Refined Logic:
  // 1. Filter by date range
  if (filters.startDate && filters.endDate) {
    where.created_at = {
      [Op.between]: [filters.startDate, filters.endDate],
    };
  }
  
  if (filters.companyName) where.companyname = { [Op.like]: `%${filters.companyName}%` };
  if (filters.plantName) where.plantname = { [Op.like]: `%${filters.plantName}%` };
  if (filters.deviceId) where.device_id = { [Op.like]: `%${filters.deviceId}%` };
  if (filters.model) where.model = { [Op.like]: `%${filters.model}%` };

  // 2. Filter for Stopped status
  // We'll search for status containing 'Stop' or 'Error' or 'Alarm'?
  // User specifically said "stopped time aa rha h".
  // Let's assume status='Stopped'.
  // But to be safe, let's include anything that is not 'Running'.
  // Actually, let's stick to what the user implies: downtime.
  where.status = {
    [Op.or]: [
      { [Op.like]: '%Stop%' },
      { [Op.like]: '%Down%' },
      { [Op.like]: '%Error%' },
      { [Op.like]: '%Alarm%' }
    ]
  };

  // 3. Sum (stop_time - start_time) in seconds/minutes
  // SQL Server: DATEDIFF(SECOND, start_time, stop_time)
  
  const results = await PlcDataModel.findAll({
    attributes: [
      ['device_id', 'name'],
      [Sequelize.fn('SUM', Sequelize.literal("DATEDIFF(SECOND, start_time, stop_time)")), 'value_seconds']
    ],
    where: {
      ...where,
      start_time: { [Op.ne]: null },
      stop_time: { [Op.ne]: null }
    },
    group: ['device_id'],
    order: [[Sequelize.literal('value_seconds'), 'DESC']],
    raw: true
  });

  // Convert seconds to hours for display (or keep as minutes/seconds depending on magnitude)
  // User chart says "183 h", so let's return hours (or minutes and let frontend format).
  // Let's return hours rounded to 2 decimal for better precision.
  return results.map(r => ({
    name: r.name,
    value: parseFloat((r.value_seconds / 3600).toFixed(2)) // Seconds to Hours
  })).filter(r => r.value > 0);
};
