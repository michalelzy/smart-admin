const { Point } = require("@influxdata/influxdb-client");
const {
  writeApi,
  queryApi,
  measurement,
  bucket,
  org,
} = require("../config/influxdb");

/**
 * 数据校验函数
 * @param {Object} data - 待校验的数据
 * @returns {string|null} - 错误信息或null
 */
// function validateData(data) {
//   // 检查必填字段
//   const requiredFields = ['device_id', 'gateway_id', 'device_status', 'pv_power', 'pv_voltage', 'output_voltage', 'output_current', 'dc_meter_power'];
//   const missingFields = requiredFields.filter(field => data[field] === undefined);

//   if (missingFields.length > 0) {
//     return `缺少必要字段：${missingFields.join(', ')}`;
//   }

//   // 检查数值类型
//   const numberFields = ['pv_power', 'pv_voltage', 'output_voltage', 'output_current', 'dc_meter_power'];
//   for (const field of numberFields) {
//     if (typeof data[field] !== 'number' || isNaN(data[field])) {
//       return `${field} 必须是有效的数字，当前值：${data[field]}`;
//     }
//   }

//   // 检查时间戳格式
//   if (data.report_time && (typeof data.report_time !== 'number' || data.report_time < 1000000000 || data.report_time > 9999999999)) {
//     return `report_time 格式不正确，应为秒级时间戳`;
//   }

//   return null;
// }

/**
 * 数据校验 - 兼容 MQTT上报格式 + TCP解析格式 双数据源
 * @param {Object} data 入参数据
 * @returns {String|null} 错误信息/null(校验通过)
 */
function validateData(data) {
  // TCP解析的光伏数据：核心校验 dtuNumber
  if (data.cmdId && (data.cmdId === 1 || data.cmdId === 2)) {
    if (!data.dtuNumber) return "TCP数据缺少必要字段：dtuNumber(设备唯一标识)";
    if (!data.deviceKey) return "TCP数据缺少必要字段：deviceKey(网关标识)";
    if (!data.deviceStatus && data.deviceStatus !== 0)
      return "TCP数据缺少必要字段：deviceStatus";
    return null;
  }
  // 原有MQTT/前端上报的数据：校验你原来的字段
  if (!data.device_id) return "缺少必要字段：device_id";
  if (!data.gateway_id) return "缺少必要字段：gateway_id";
  if (!data.device_status && data.device_status !== 0)
    return "缺少必要字段：device_status";
  return null;
}

// 校验【实时数据】专用函数：只校验实时数据
function validateTcpData(tcpData) {
  if (!tcpData.dtuNumber) return "缺少必要字段：dtuNumber";
  if (!tcpData.deviceKey) return "缺少必要字段：deviceKey";
  if (tcpData.deviceStatus === undefined) return "缺少必要字段：deviceStatus";
  if (!tcpData.cmdId) return "缺少必要字段：cmdId";
  if (!tcpData.receiveTime) return "缺少必要字段：receiveTime";
  return null;
}

/**
 * 光伏【运行数据】专用校验函数
 * @param {Object} data TCP解析的运行数据
 * @returns {String|null} 错误信息/校验通过
 */
function validateRunData(data) {
  if (!data.dtuNumber) return "运行数据缺少必要字段：dtuNumber";
  if (!data.deviceKey) return "运行数据缺少必要字段：deviceKey";
  if (data.cmdId !== 2) return "运行数据指令ID错误，必须为2";
  if (!data.receiveTime) return "运行数据缺少必要字段：receiveTime";
  return null;
}

// 初始化写入API配置
// writeApi.enableGzip(); // 启用压缩
writeApi.useDefaultTags({ system: "pv-power-management" }); // 全局默认标签

/**
 * 写入单条光伏数据
 * @param {Object} data - 光伏设备数据
 * @returns {Promise<void>}
 */
async function writePvData(data) {
  try {
    // 数据校验
    const validationError = validateData(data);
    if (validationError) {
      throw new Error(validationError);
    }

    // 时间戳处理
    const reportTimeNano = data.report_time
      ? BigInt(data.report_time) * 1000000000n
      : BigInt(Date.now()) * 10n;

    // const reportTimeSeconds = data.report_time;
    // const reportTimeNano = BigInt(reportTimeSeconds)*BigInt(1000000000);
    // 构建 InfluxDB 数据点
    const point = new Point(measurement)
      .tag("device_id", data.device_id)
      .tag("gateway_id", data.gateway_id)
      .tag("region_code", data.region_code || "未知区域")
      .tag("device_status", data.device_status.toString()) // Tag 必须是字符串
      .floatField("pv_power", data.pv_power)
      .floatField("pv_voltage", data.pv_voltage)
      .floatField("output_voltage", data.output_voltage)
      .floatField("output_current", data.output_current)
      .floatField("dc_meter_power", data.dc_meter_power)
      // 时间戳：优先用设备上报时间，否则用当前时间（毫秒级转纳秒级）
      .timestamp(reportTimeNano);
    // 写入队列（自动批量刷新，默认1秒/1000条）
    writeApi.writePoint(point);
    await writeApi.flush(); // 强制刷新（确保数据写入）
    console.log(`[InfluxDB] 设备 ${data.device_id} 数据写入成功`);
  } catch (error) {
    console.error("[InfluxDB] 写入光伏数据失败：", error.message);
    throw new Error(`[InfluxDB] 数据写入失败：${error.message}`);
  }
}

/**
 * TCP光伏数据写入InfluxDB - 适配TCP解析后的JSON格式
 * 完全对齐原有 writePvData 写法、规范、引入，无任何差异
 * @param {Object} tcpData TCP解析后的光伏JSON数据 (兼容cmdId=1实时数据/cmdId=2运行数据)
 */
async function writePvRealDataByTcp(tcpData) {
  try {
    // 1. 复用原有数据校验函数 - 适配当前payload的必填字段校验
    const validationError = validateTcpData(tcpData);
    if (validationError) {
      throw new Error(validationError);
    }

    // ✅ ✅ ✅ 核心修复：时间戳处理 适配你的【秒级数字类型 receiveTime】
    // 你的payload中 receiveTime = currentTimeSeconds 是 秒级数字戳，不是字符串！！
    const reportTimeNano = tcpData.receiveTime
      ? BigInt(tcpData.receiveTime) * 1000000000n // 秒级 → 纳秒级 (InfluxDB标准)
      : BigInt(Date.now()) * 1000000n; // 兜底：毫秒转纳秒

    // 2. 构建 InfluxDB 数据点 - 字段【完全一一精准匹配】你的payload，一个不多一个不少
    const point = new Point(measurement)
      // ======================== 核心标签 (全部转字符串，符合InfluxDB Tag规范) ========================
      .tag("device_id", tcpData.dtuNumber) // 对应 payload.dtuNumber
      .tag("gateway_id", tcpData.deviceKey) // 对应 payload.deviceKey
      .tag("region_code", "光伏区域") // 固定值，可自定义修改
      .tag("device_status", tcpData.deviceStatus.toString()) // 对应 payload.deviceStatus (0/1 → 字符串)
      .tag("device_status_desc", tcpData.deviceStatusDesc) // 对应 payload.deviceStatusDesc (充电/待机)
      .tag("cmd_id", tcpData.cmdId.toString()) // 对应 payload.cmdId (1)
      .tag("cmd_name", tcpData.cmdName) // 对应 payload.cmdName (光伏【实时数据】指令)
      .tag("raw_hex", tcpData.rawHex) // 对应 payload.rawHex (原始16进制指令)
      .tag("co2_emission_unit", tcpData.co2EmissionUnit) // 对应 payload.co2EmissionUnit (kg)

      // ======================== 浮点数字段 - 与你的payload字段【1:1精准绑定】 ========================
      .floatField("success", tcpData.success ? 1 : 0) // 对应 payload.success (布尔转0/1)
      .floatField("slave_id", tcpData.slaveId || 0) // 对应 payload.slaveId
      .floatField("func_code", tcpData.funcCode || 0) // 对应 payload.funcCode
      .floatField("data_len", tcpData.dataLen || 0) // 对应 payload.dataLen
      .floatField("pv1_voltage", Number(tcpData.pv1Voltage) || 0) // 对应 payload.pv1Voltage
      .floatField("battery_voltage", Number(tcpData.batteryVoltage) || 0) // 对应 payload.batteryVoltage(字符串转数字)
      .floatField("charge_current", Number(tcpData.chargeCurrent) || 0) // 对应 payload.chargeCurrent
      .floatField("output_voltage", Number(tcpData.outputVoltage) || 0) // 对应 payload.outputVoltage
      .floatField("load_voltage", Number(tcpData.loadVoltage) || 0) // 对应 payload.loadVoltage
      .floatField("load_current", Number(tcpData.loadCurrent) || 0) // 对应 payload.loadCurrent
      .floatField("charge_power", Number(tcpData.chargePower) || 0) // 对应 payload.chargePower
      .floatField("load_power", Number(tcpData.loadPower) || 0) // 对应 payload.loadPower
      .floatField("battery_temp", Number(tcpData.batteryTemp) || 0) // 对应 payload.batteryTemp
      .floatField("inner_temp", Number(tcpData.innerTemp) || 0) // 对应 payload.innerTemp
      .floatField("battery_power", Number(tcpData.batteryPower) || 0) // 对应 payload.batteryPower
      .floatField("co2_emission_raw", Number(tcpData.co2EmissionRaw) || 0) // 对应 payload.co2EmissionRaw
      .floatField("co2_emission", Number(tcpData.co2Emission) || 0) // 对应 payload.co2Emission(字符串转数字)

      // 时间戳 - 纳秒级，写入InfluxDB
      .timestamp(reportTimeNano);

    // 3. 写入InfluxDB - 完全沿用你的原有逻辑，无任何改动
    writeApi.writePoint(point);
    await writeApi.flush(); // 强制刷新，确保数据立即入库
    console.log(
      `[InfluxDB] TCP设备 ${tcpData.dtuNumber}：(指令代码 ${tcpData.cmdId}) 实时数据写入成功`,
    );
  } catch (error) {
    console.error("[InfluxDB] TCP光伏数据写入失败：", error.message);
    throw new Error(`[InfluxDB] TCP数据写入失败：${error.message}`);
  }
}

/**
 * 【新增】写入光伏设备全量指标（适配 pv_device_metrics measurement）
 * @param {Object} data - 全量光伏设备指标数据
 * @returns {Promise<void>}
 */
async function writePvFullMetrics(data) {
  try {
    // ========== 1. 全量字段校验 ==========
    const requiredTags = [
      "device_id",
      "station_id",
      "device_type",
      "manufacturer",
    ]; // 必传Tag
    const missingTags = requiredTags.filter((tag) => !data[tag]);
    if (missingTags.length > 0) {
      throw new Error(`缺少必要标签字段：${missingTags.join(", ")}`);
    }

    // 数值字段校验（核心测量值）
    const numberFields = [
      "pv_input_voltage_1",
      "pv_input_voltage_2",
      "pv_input_voltage_3",
      "pv_input_voltage_4",
      "module_output_current_1",
      "module_output_current_2",
      "module_output_current_3",
      "module_output_current_4",
      "output_voltage",
      "output_total_current",
      "output_total_power",
      "output_total_voltage",
      "load_voltage",
      "load_current",
      "load_power",
      "battery_temperature",
      "internal_temperature",
      "co2_emission_reduction",
      "module_count",
      "battery_capacity",
      "daily_generation",
      "monthly_generation",
      "total_generation",
    ];
    for (const field of numberFields) {
      // 允许部分字段为空，但若传值则必须是数字
      if (
        data[field] !== undefined &&
        (typeof data[field] !== "number" || isNaN(data[field]))
      ) {
        throw new Error(`${field} 必须是有效的数字，当前值：${data[field]}`);
      }
    }

    // ========== 2. 时间戳处理 ==========
    const reportTimeNano = data.report_time
      ? BigInt(data.report_time) * 1000000000n // 秒级时间戳转纳秒
      : BigInt(Date.now()) * 10n; // 当前时间（毫秒转纳秒）

    // ========== 3. 构建全量数据点 ==========
    // 自定义 measurement 名称（替换为 pv_device_metrics，如需新建只需改这个字符串）
    const fullMeasurement = "pv_device_metrics";
    const point = new Point(fullMeasurement)
      // ---------- Tag 部分（筛选维度，必须字符串） ----------
      .tag("device_id", data.device_id)
      .tag("station_id", data.station_id)
      .tag("device_type", data.device_type)
      .tag("manufacturer", data.manufacturer)
      // ---------- Field 部分（测量值，数值/字符串） ----------
      // 运行状态
      .stringField("work_status", data.work_status || "online")
      // 光伏输入电压
      .floatField("pv_input_voltage_1", data.pv_input_voltage_1 || 0)
      .floatField("pv_input_voltage_2", data.pv_input_voltage_2 || 0)
      .floatField("pv_input_voltage_3", data.pv_input_voltage_3 || 0)
      .floatField("pv_input_voltage_4", data.pv_input_voltage_4 || 0)
      // 模组输出电流
      .floatField("module_output_current_1", data.module_output_current_1 || 0)
      .floatField("module_output_current_2", data.module_output_current_2 || 0)
      .floatField("module_output_current_3", data.module_output_current_3 || 0)
      .floatField("module_output_current_4", data.module_output_current_4 || 0)
      // 总输出
      .floatField("output_voltage", data.output_voltage || 0)
      .floatField("output_total_current", data.output_total_current || 0)
      .floatField("output_total_power", data.output_total_power || 0)
      .floatField("output_total_voltage", data.output_total_voltage || 0)
      // 负载
      .floatField("load_voltage", data.load_voltage || 0)
      .floatField("load_current", data.load_current || 0)
      .floatField("load_power", data.load_power || 0)
      // 温度
      .floatField("battery_temperature", data.battery_temperature || 0)
      .floatField("internal_temperature", data.internal_temperature || 0)
      // 环保指标
      .floatField("co2_emission_reduction", data.co2_emission_reduction || 0)
      // 故障
      .stringField("fault_code", data.fault_code || "")
      // 设备参数
      .intField("module_count", data.module_count || 0) // 整数类型
      .floatField("battery_capacity", data.battery_capacity || 0)
      .stringField("device_address", data.device_address || "未知地址")
      // 发电量
      .floatField("daily_generation", data.daily_generation || 0)
      .floatField("monthly_generation", data.monthly_generation || 0)
      .floatField("total_generation", data.total_generation || 0)
      // 时间戳
      .timestamp(reportTimeNano);

    // ========== 4. 写入 InfluxDB ==========
    writeApi.writePoint(point);
    await writeApi.flush(); // 强制刷新写入
    console.log(
      `[InfluxDB] 全量指标 - 设备 ${data.device_id} 数据写入成功（measurement：${fullMeasurement}）`,
    );
  } catch (error) {
    console.error("[InfluxDB] 写入光伏全量指标失败：", error.message);
    throw new Error(`[InfluxDB] 全量指标写入失败：${error.message}`);
  }
}

/**
 * 【新增】查询 pv_device_metrics 全量指标数据
 * @param {Object} params - 查询参数
 * @param {string} [params.device_id] - 设备ID（可选，不传则查所有设备）
 * @param {string} [params.station_id] - 站点ID（可选，不传则查所有站点）
 * @param {string} [params.start] - 开始时间（如 "-24h" "-7d" "2024-12-01T00:00:00Z"，默认 "-24h"）
 * @param {string} [params.end] - 结束时间（默认 "now()"）
 * @param {Array<string>} [params.fields] - 要查询的字段列表（可选，不传则查所有字段，如 ["output_total_power", "daily_generation"]）
 * @param {boolean} [params.latestOnly] - 是否只查每个设备的最新一条数据（默认 false）
 * @returns {Promise<Array>} 全量指标查询结果
 */
async function queryPvFullMetrics(params = {}) {
  const {
    device_id,
    station_id,
    start = "-24h",
    end = "now()",
    fields = [],
    latestOnly = false,
  } = params;

  // const { device_id, station_id, start = '-24h', end = 'now()' , latestOnly} = params;

  // 1. 构建过滤条件
  let filterConditions = [`r._measurement == "pv_device_metrics"`];
  if (device_id) filterConditions.push(`r.device_id == "${device_id}"`);
  if (station_id) filterConditions.push(`r.station_id == "${station_id}"`);
  const filterStr = filterConditions.join(" and ");

  // 2. 构建字段筛选（可选：只查指定字段）
  let fieldFilter = "";
  if (fields.length > 0) {
    const fieldStr = fields.map((f) => `"${f}"`).join(",");
    fieldFilter = `|> filter(fn: (r) => contains(value: r._field, set: [${fieldStr}]))`;
  }

  //   let fluxQuery = `
  //   from(bucket: "${bucket}")

  //     |> range(start: ${start}, stop: ${end})

  //     |> filter(fn: (r) => ${filterStr})

  //     ${fieldFilter}

  //     |> keep(columns: ["_time", "_field", "_value", "device_id", "station_id", "device_type", "manufacturer"])

  //     |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")

  //     |> sort(columns: ["_time"], desc: true)
  // `;
  let fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      // |> filter(fn: (r) => r._measurement == "pv_device_metrics" and r.device_id == "${device_id}")
      |> filter(fn: (r) => ${filterStr})
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value") 
  `;

  // 4. 若只查最新一条数据，添加 last()
  if (latestOnly) {
    fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      // |> filter(fn: (r) => r._measurement == "pv_device_metrics" and r.device_id == "${device_id}")
      |> filter(fn: (r) => ${filterStr})
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value") 
  `;
  }

  console.log(`[InfluxDB] 执行 Flux 查询：\n${fluxQuery}`);

  // 5. 执行查询并格式化结果
  return new Promise((resolve, reject) => {
    const result = [];
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        // 格式化返回结果（适配全量指标字段）
        const formattedItem = {
          // 基础维度
          time: new Date(item._time).toLocaleString(),
          device_id: item.device_id || "未知设备",
          station_id: item.station_id || "未知站点",
          device_type: item.device_type || "未知类型",
          manufacturer: item.manufacturer || "未知厂商",

          // 运行状态
          work_status: item.work_status || "未知状态",
          fault_code: item.fault_code || "无故障",

          // 光伏输入电压（保留2位小数）
          pv_input_voltage_1: item.pv_input_voltage_1
            ? parseFloat(item.pv_input_voltage_1).toFixed(2)
            : "0.00",
          pv_input_voltage_2: item.pv_input_voltage_2
            ? parseFloat(item.pv_input_voltage_2).toFixed(2)
            : "0.00",
          pv_input_voltage_3: item.pv_input_voltage_3
            ? parseFloat(item.pv_input_voltage_3).toFixed(2)
            : "0.00",
          pv_input_voltage_4: item.pv_input_voltage_4
            ? parseFloat(item.pv_input_voltage_4).toFixed(2)
            : "0.00",

          // 模组输出电流
          module_output_current_1: item.module_output_current_1
            ? parseFloat(item.module_output_current_1).toFixed(2)
            : "0.00",
          module_output_current_2: item.module_output_current_2
            ? parseFloat(item.module_output_current_2).toFixed(2)
            : "0.00",
          module_output_current_3: item.module_output_current_3
            ? parseFloat(item.module_output_current_3).toFixed(2)
            : "0.00",
          module_output_current_4: item.module_output_current_4
            ? parseFloat(item.module_output_current_4).toFixed(2)
            : "0.00",

          // 总输出
          output_voltage: item.output_voltage
            ? parseFloat(item.output_voltage).toFixed(2)
            : "0.00",
          output_total_current: item.output_total_current
            ? parseFloat(item.output_total_current).toFixed(2)
            : "0.00",
          output_total_power: item.output_total_power
            ? parseFloat(item.output_total_power).toFixed(2)
            : "0.00",
          output_total_voltage: item.output_total_voltage
            ? parseFloat(item.output_total_voltage).toFixed(2)
            : "0.00",

          // 负载
          load_voltage: item.load_voltage
            ? parseFloat(item.load_voltage).toFixed(2)
            : "0.00",
          load_current: item.load_current
            ? parseFloat(item.load_current).toFixed(2)
            : "0.00",
          load_power: item.load_power
            ? parseFloat(item.load_power).toFixed(2)
            : "0.00",

          // 温度
          battery_temperature: item.battery_temperature
            ? parseFloat(item.battery_temperature).toFixed(2)
            : "0.00",
          internal_temperature: item.internal_temperature
            ? parseFloat(item.internal_temperature).toFixed(2)
            : "0.00",

          // 环保指标
          co2_emission_reduction: item.co2_emission_reduction
            ? parseFloat(item.co2_emission_reduction).toFixed(2)
            : "0.00",

          // 设备参数
          module_count: item.module_count || 0,
          battery_capacity: item.battery_capacity
            ? parseFloat(item.battery_capacity).toFixed(2)
            : "0.00",
          device_address: item.device_address || "未知地址",

          // 发电量
          daily_generation: item.daily_generation
            ? parseFloat(item.daily_generation).toFixed(2)
            : "0.00",
          monthly_generation: item.monthly_generation
            ? parseFloat(item.monthly_generation).toFixed(2)
            : "0.00",
          total_generation: item.total_generation
            ? parseFloat(item.total_generation).toFixed(2)
            : "0.00",
        };
        result.push(formattedItem);
      },
      error: (err) => {
        console.error("[InfluxDB] 全量指标查询失败：", err);
        reject(new Error(`全量指标查询失败：${err.message}`));
      },
      complete: () => {
        // 若只查最新数据，去重（每个设备只保留一条）
        const finalResult = latestOnly
          ? result.reduce((acc, curr) => {
              if (!acc.some((item) => item.device_id === curr.device_id)) {
                acc.push(curr);
              }
              return acc;
            }, [])
          : result;
        resolve(finalResult);
      },
    });
  });
}

/**
 * 查询指定设备的历史数据（按时间范围）
 * @param {Object} params - 查询参数
 * @param {string} params.device_id - 设备ID
 * @param {string} params.start - 开始时间（如 "-24h" "-7d"）
 * @param {string} params.end - 结束时间（默认当前时间）
 * @returns {Promise<Array>} 查询结果
 */
async function queryDeviceHistory(params) {
  const { device_id, start = "-24h", end = "now()" } = params;
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r.device_id == "${device_id}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  console.log(`[InfluxDB] 执行 Flux 查询：\n${fluxQuery}`);

  return new Promise((resolve, reject) => {
    const result = [];
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        result.push({
          time: new Date(item._time).toLocaleString(), // 格式化时间
          device_id: item.device_id,
          gateway_id: item.gateway_id,
          region_code: item.region_code,
          device_status: item.device_status,
          pv_power: item.pv_power ? item.pv_power.toFixed(2) : 0, // 保留2位小数
          pv_voltage: item.pv_voltage ? item.pv_voltage.toFixed(2) : 0,
          output_voltage: item.output_voltage
            ? item.output_voltage.toFixed(2)
            : 0,
          output_current: item.output_current
            ? item.output_current.toFixed(2)
            : 0,
          dc_meter_power: item.dc_meter_power
            ? item.dc_meter_power.toFixed(2)
            : 0,
        });
      },
      error: (err) => reject(new Error(`查询失败：${err.message}`)),
      complete: () => resolve(result),
    });
  });
}

/**
 * 统计指定区域的设备数据（总功率、设备数、告警数）
 * @param {string} region_code - 区域编码（如 "华东-01"，默认所有区域）
 * @returns {Promise<Object>} 统计结果
 */
async function statsRegionPvData(region_code = "") {
  const regionFilter = region_code
    ? `and r.region_code == "${region_code}"`
    : "";
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h) // 近1小时最新数据
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => ${regionFilter})
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> last() // 取每个设备最新数据
      |> group()
      |> reduce(
        fn: (r, accumulator) => ({
          total_devices: accumulator.total_devices + 1,
          alarm_devices: r.device_status == "1" ? accumulator.alarm_devices + 1 : accumulator.alarm_devices,
          total_pv_power: accumulator.total_pv_power + (r.pv_power || 0)
        }),
        identity: { total_devices: 0, alarm_devices: 0, total_pv_power: 0.0 }
      )
  `;

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const stats = tableMeta.toObject(row);
        resolve({
          region_code: region_code || "所有区域",
          total_devices: stats.total_devices,
          alarm_devices: stats.alarm_devices,
          total_pv_power: stats.total_pv_power.toFixed(2) + "kW",
          update_time: new Date().toLocaleString(),
        });
      },
      error: (err) => reject(new Error(`统计失败：${err.message}`)),
      complete: () =>
        resolve({
          total_devices: 0,
          alarm_devices: 0,
          total_pv_power: "0.00kW",
        }),
    });
  });
}

/**
 * 查询所有设备的最新状态 (使用正确的 Flux 查询)
 * @returns {Promise<Array>} 设备最新状态列表
 */
async function queryAllDevicesLatestStatus() {
  const fluxQuery = `
        from(bucket: "${bucket}")
            |> range(start: -2d)
            |> filter(fn: (r) => r._measurement == "${measurement}")
            |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> group(columns: ["device_id"])
    `;

  return new Promise((resolve, reject) => {
    const result = [];
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        //tableMeta.toObject(row): 将原始的、结构化程度较低的 row 数据转换成一个易于操作的 JavaScript 对象 item。这个 item 对象就代表了一条设备的完整数据记录（例如，包含 device_id, pv_power, _time 等字段）。
        const item = tableMeta.toObject(row);
        // 在这里可以对数据进行格式化
        // console.log('完整的 item 对象：', JSON.stringify(item,null,2));

        /**
           * result.push(...) 是 “储水桶”，把每次接的水（格式化后的一行数据）倒进桶里；
             complete 回调是 “水放完了”，此时桶里已经装满了所有的水（完整数据列表），可以把桶交给前端。
           */
        result.push({
          device_id: item.device_id,
          gateway_id: item.gateway_id || "无数据",
          region_code: item.region_code || "无数据",
          device_status: item.device_status,
          status_text: item.device_status == "0" ? "正常" : "告警",
          latest_pv_power: item.pv_power
            ? parseFloat(item.pv_power).toFixed(2) + " kW"
            : "无数据",
          latest_pv_voltage: item.pv_voltage
            ? parseFloat(item.pv_voltage).toFixed(2) + " V"
            : "无数据",
          update_time: new Date(item._time).toLocaleString(),
        });
      },
      error: (err) => {
        console.error("InfluxDB query error:", err);
        reject(new Error(`查询失败：${err.message}`));
      },
      complete: () => resolve(result),
    });
  });
}

/**
 * 批量查询DTU最新实时状态（纯数据操作，无HTTP依赖）
 * @param {Object} params - 查询参数
 * @param {Array<string>} params.dtuNumberList - DTU序列号列表
 * @param {number} [params.limit=1] - 每个DTU返回最新条数
 * @param {string} [params.start="-1d"] - 时间范围开始
 * @param {string} [params.end="now()"] - 时间范围结束
 * @returns {Promise<Array>} DTU状态列表
 */
async function getBatchDtuLatestData(params = {}) {
  const { dtuNumberList, limit = 1, start = "-1d", end = "now()" } = params;

  // 纯数据校验，不返回HTTP状态码
  if (
    !dtuNumberList ||
    !Array.isArray(dtuNumberList) ||
    dtuNumberList.length === 0
  ) {
    console.warn("[InfluxDB] dtuNumberList必须是非空数组");
    return [];
  }

  const dtuStrArray = dtuNumberList.map((dtu) => `"${dtu}"`).join(",");

  //  const fluxQuery = `
  //   from(bucket: "${bucket}")
  //     |> range(start: ${start}, stop: ${end})
  //     |> filter(fn: (r) => (r._measurement == "pv_device_metrics" or r._measurement == "${measurement}") and r.device_id in [${dtuNumberStr}])
  //     |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  //     |> group(columns: ["device_id"])
  //     |> sort(columns: ["_time"], desc: true)
  //     |> limit(n: ${limit}, offset: 0)
  //     |> keep(columns: ["device_id", "_time", "pv_power", "device_status", "output_voltage", "output_total_power"])
  // `.trim();

  // const dtuList = [860678074035413, 860678074080112];
  // const dtuStrArray = dtuList.map(dtu => `"${dtu}"`).join(',');

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => contains(value:r.device_id, set: [${dtuStrArray}]))
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["device_id"]) // 按设备分组
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1, offset: 0) // 只取最新1条
      
  `;

  console.log(`[InfluxDB] 执行批量DTU查询：\n${fluxQuery}`);

  // 执行查询并格式化结果
  return new Promise((resolve) => {
    const dtuStatusMap = new Map();

    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        const dtuNumber = item.device_id;
        // 仅保留每个DTU最新一条数据
        if (dtuNumber && !dtuStatusMap.has(dtuNumber)) {
          dtuStatusMap.set(dtuNumber, {
            time: new Date(item._time).toLocaleString(), // 格式化时间
            dtuNumber: dtuNumber,
            gateway_id: item.gateway_id,
            region_code: item.region_code,
            device_status: item.device_status,
            pv_power: item.pv_power ? item.pv_power.toFixed(2) : 0, // 保留2位小数
            pv_voltage: item.pv_voltage ? item.pv_voltage.toFixed(2) : 0,
            output_voltage: item.output_voltage
              ? item.output_voltage.toFixed(2)
              : 0,
            output_current: item.output_current
              ? item.output_current.toFixed(2)
              : 0,
            dc_meter_power: item.dc_meter_power
              ? item.dc_meter_power.toFixed(2)
              : 0,
          });
        }
      },
      error: (err) => {
        console.error("[InfluxDB] 批量DTU查询失败：", err.message);
        // 错误时返回默认值数组（纯数据）
        const defaultResult = dtuNumberList.map((dtuNumber) => ({
          dtuNumber: dtuNumber,
          time: "",
          gateway_id: "",
          region_code: "",
          device_status: "未知",
          pv_power: "0.00",
          pv_voltage: "0.00",
          output_voltage: "0.00",
          output_current: "0.00",
          dc_meter_power: "0.00",
        }));
        resolve(defaultResult);
      },
      complete: () => {
        const finalResult = dtuNumberList.map((dtuNumber) => {
          const dtuStr = String(dtuNumber); //将数字转换成字符类型
          console.log(
            "[complete] 转换后的dtuStr:",
            dtuStr,
            "是否存在:",
            dtuStatusMap.has(dtuStr),
          ); // 打印匹配结果
          return (
            dtuStatusMap.get(dtuStr) || {
              dtuNumber: dtuNumber,
              time: "",
              gateway_id: "",
              region_code: "",
              device_status: "未知",
              pv_power: "0.00",
              pv_voltage: "0.00",
              output_voltage: "0.00",
              output_current: "0.00",
              dc_meter_power: "0.00",
            }
          );
        });
        resolve(finalResult);
      },
    });
  });
}

/**
 * 查询TCP服务存入的数据
 * @param {Object} params
 * @returns
 */
/**
 * 查询TCP服务存入的数据
 * @param {Object} params
 * @returns
 */
async function getTCPBatchDtuLatestRealData(params = {}) {
  const { dtuNumberList, limit = 1, start = "-1d", end = "now()" } = params;

  // 纯数据校验，不返回HTTP状态码
  if (
    !dtuNumberList ||
    !Array.isArray(dtuNumberList) ||
    dtuNumberList.length === 0
  ) {
    console.warn("[InfluxDB] dtuNumberList必须是非空数组");
    return [];
  }
  const dtuStrArray = dtuNumberList.map((dtu) => `"${dtu}"`).join(",");
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r.cmd_id == "1")
      |> filter(fn: (r) => contains(value:r.device_id, set: [${dtuStrArray}]))
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["device_id"]) // 按设备分组
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit}, offset: 0) // 只取最新指定条数
  `;
  console.log(`[InfluxDB] 执行批量DTU查询：\n${fluxQuery}`);
  // 执行查询并格式化结果
  return new Promise((resolve) => {
    const dtuStatusMap = new Map();

    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        const dtuNumber = item.device_id;
        // 仅保留每个DTU最新一条数据
        if (dtuNumber && !dtuStatusMap.has(dtuNumber)) {
          // ✅✅✅ 核心修改：字段完全匹配TCP写入的真实数据字段，一一对应，无偏差
          dtuStatusMap.set(dtuNumber, {
            time: new Date(item._time).toLocaleString(), // 格式化时间
            dtuNumber: dtuNumber,
            gateway_id: item.gateway_id || "",
            region_code: item.region_code || "光伏区域",
            device_status: item.device_status || "未知",
            device_status_desc: item.device_status_desc || "",
            cmd_id: item.cmd_id || "",
            cmd_name: item.cmd_name || "",
            raw_hex: item.raw_hex || "",
            co2_emission_unit: item.co2_emission_unit || "kg",
            // 核心光伏实时数据字段 - 全部保留2位小数，空值默认0.00
            pv1Voltage: item.pv1_voltage
              ? Number(item.pv1_voltage).toFixed(2)
              : "0.00",
            batteryVoltage: item.battery_voltage
              ? Number(item.battery_voltage).toFixed(2)
              : "0.00",
            chargeCurrent: item.charge_current
              ? Number(item.charge_current).toFixed(2)
              : "0.00",
            outputVoltage: item.output_voltage
              ? Number(item.output_voltage).toFixed(2)
              : "0.00",
            loadVoltage: item.load_voltage
              ? Number(item.load_voltage).toFixed(2)
              : "0.00",
            loadCurrent: item.load_current
              ? Number(item.load_current).toFixed(2)
              : "0.00",
            chargePower: item.charge_power
              ? Number(item.charge_power).toFixed(2)
              : "0.00",
            loadPower: item.load_power
              ? Number(item.load_power).toFixed(2)
              : "0.00",
            batteryTemp: item.battery_temp
              ? Number(item.battery_temp).toFixed(2)
              : "0.00",
            innerTemp: item.inner_temp
              ? Number(item.inner_temp).toFixed(2)
              : "0.00",
            batteryPower: item.battery_power
              ? Number(item.battery_power).toFixed(2)
              : "0.00",
            co2EmissionRaw: item.co2_emission_raw
              ? Number(item.co2_emission_raw).toFixed(2)
              : "0.00",
            co2Emission: item.co2_emission
              ? Number(item.co2_emission).toFixed(2)
              : "0.00",
            // influxDB原始字段兜底兼容
            slave_id: item.slave_id || 1,
            func_code: item.func_code || 3,
            data_len: item.data_len || 28,
          });
        }
      },
      error: (err) => {
        console.error("[InfluxDB] 批量DTU查询失败：", err.message);
        // 错误时返回默认值数组（纯数据），字段和正常返回一致
        const defaultResult = dtuNumberList.map((dtuNumber) => ({
          time: "",
          dtuNumber: dtuNumber,
          gateway_id: "",
          region_code: "光伏区域",
          device_status: "未知",
          device_status_desc: "",
          cmd_id: "",
          cmd_name: "",
          raw_hex: "",
          co2_emission_unit: "kg",
          pv1Voltage: "0.00",
          batteryVoltage: "0.00",
          chargeCurrent: "0.00",
          outputVoltage: "0.00",
          loadVoltage: "0.00",
          loadCurrent: "0.00",
          chargePower: "0.00",
          loadPower: "0.00",
          batteryTemp: "0.00",
          innerTemp: "0.00",
          batteryPower: "0.00",
          co2EmissionRaw: "0.00",
          co2Emission: "0.00",
          slave_id: 1,
          func_code: 3,
          data_len: 28,
        }));
        resolve(defaultResult);
      },
      complete: () => {
        const finalResult = dtuNumberList.map((dtuNumber) => {
          const dtuStr = String(dtuNumber); //将数字转换成字符类型
          console.log(
            "[complete] 转换后的dtuStr:",
            dtuStr,
            "是否存在:",
            dtuStatusMap.has(dtuStr),
          ); // 打印匹配结果
          return (
            dtuStatusMap.get(dtuStr) || {
              time: "",
              dtuNumber: dtuNumber,
              gateway_id: "",
              region_code: "光伏区域",
              device_status: "未知",
              device_status_desc: "",
              cmd_id: "",
              cmd_name: "",
              raw_hex: "",
              co2_emission_unit: "kg",
              pv1Voltage: "0.00",
              batteryVoltage: "0.00",
              chargeCurrent: "0.00",
              outputVoltage: "0.00",
              loadVoltage: "0.00",
              loadCurrent: "0.00",
              chargePower: "0.00",
              loadPower: "0.00",
              batteryTemp: "0.00",
              innerTemp: "0.00",
              batteryPower: "0.00",
              co2EmissionRaw: "0.00",
              co2Emission: "0.00",
              slave_id: 1,
              func_code: 3,
              data_len: 28,
            }
          );
        });
        resolve(finalResult);
      },
    });
  });
}

/**
 * 查询TCP服务存入的数据
 * @param {Object} params
 * @returns
 */
/**
 * 查询TCP服务存入的数据
 * @param {Object} params
 * @returns
 */
async function getTCPBatchDtuLatestRealDataOnDay(params = {}) {
  const { dtuNumberList, limit, startTime, endTime } = params;
  console.log("onday", startTime, endTime);
  // 纯数据校验，不返回HTTP状态码
  if (
    !dtuNumberList ||
    !Array.isArray(dtuNumberList) ||
    dtuNumberList.length === 0
  ) {
    console.warn("[InfluxDB] dtuNumberList必须是非空数组");
    return [];
  }
  const start = new Date(startTime).toISOString();
  const end = new Date(endTime).toISOString();
  const dtuStrArray = dtuNumberList.map((dtu) => `"${dtu}"`).join(",");
  const fluxQuery = `
    import "date"
    import "timezone"
    option location = timezone.location(name: "Asia/Shanghai")
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r.cmd_id == "1")
      |> filter(fn: (r) => contains(value:r.device_id, set: [${dtuStrArray}]))
      // |> filter(fn: (r) => (date.hour(t: r._time) + 8) % 24 < 15)
      |> filter(fn: (r) => date.hour(t: r._time) < 15)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["device_id", "_time"])
      |> map(fn: (r) => ({ r with _day:string(v: date.truncate(t: r._time, unit: 1d)) }))
      |> group(columns: ["device_id", "_day"])
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit}, offset: 0) // 只取最新指定条数
  `;
  
  console.log(`[InfluxDB] 执行批量DTU查询：\n${fluxQuery}`);
  // 执行查询并格式化结果
  return new Promise((resolve) => {
    const dtuStatusMap = new Map();
    const dtuRealDataResultArray = [];

    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        // const dtuNumber = item.device_id;

        // 仅保留每个DTU最新一条数据
        // if (dtuNumber && !dtuStatusMap.has(dtuNumber)) {
        //   // ✅✅✅ 核心修改：字段完全匹配TCP写入的真实数据字段，一一对应，无偏差
        //   dtuStatusMap.set(dtuNumber, {
        //     time: new Date(item._time).toLocaleString(), // 格式化时间
        //     dtuNumber: dtuNumber,
        //     gateway_id: item.gateway_id || "",
        //     region_code: item.region_code || "光伏区域",
        //     device_status: item.device_status || "未知",
        //     device_status_desc: item.device_status_desc || "",
        //     cmd_id: item.cmd_id || "",
        //     cmd_name: item.cmd_name || "",
        //     raw_hex: item.raw_hex || "",
        //     co2_emission_unit: item.co2_emission_unit || "kg",
        //     // 核心光伏实时数据字段 - 全部保留2位小数，空值默认0.00
        //     pv1Voltage: item.pv1_voltage
        //       ? Number(item.pv1_voltage).toFixed(2)
        //       : "0.00",
        //     batteryVoltage: item.battery_voltage
        //       ? Number(item.battery_voltage).toFixed(2)
        //       : "0.00",
        //     chargeCurrent: item.charge_current
        //       ? Number(item.charge_current).toFixed(2)
        //       : "0.00",
        //     outputVoltage: item.output_voltage
        //       ? Number(item.output_voltage).toFixed(2)
        //       : "0.00",
        //     loadVoltage: item.load_voltage
        //       ? Number(item.load_voltage).toFixed(2)
        //       : "0.00",
        //     loadCurrent: item.load_current
        //       ? Number(item.load_current).toFixed(2)
        //       : "0.00",
        //     chargePower: item.charge_power
        //       ? Number(item.charge_power).toFixed(2)
        //       : "0.00",
        //     loadPower: item.load_power
        //       ? Number(item.load_power).toFixed(2)
        //       : "0.00",
        //     batteryTemp: item.battery_temp
        //       ? Number(item.battery_temp).toFixed(2)
        //       : "0.00",
        //     innerTemp: item.inner_temp
        //       ? Number(item.inner_temp).toFixed(2)
        //       : "0.00",
        //     batteryPower: item.battery_power
        //       ? Number(item.battery_power).toFixed(2)
        //       : "0.00",
        //     co2EmissionRaw: item.co2_emission_raw
        //       ? Number(item.co2_emission_raw).toFixed(2)
        //       : "0.00",
        //     co2Emission: item.co2_emission
        //       ? Number(item.co2_emission).toFixed(2)
        //       : "0.00",
        //     // influxDB原始字段兜底兼容
        //     slave_id: item.slave_id || 1,
        //     func_code: item.func_code || 3,
        //     data_len: item.data_len || 28,
        //   });
        // }

        dtuRealDataResultArray.push({
          time: new Date(item._time).toLocaleString(),
          dateKey: item._day,
          dtuNumber: item.device_id,
          gateway_id: item.gateway_id || "",
          region_code: item.region_code || "光伏区域",
          device_status: item.device_status || "未知",
          device_status_desc: item.device_status_desc || "",
          cmd_id: item.cmd_id || "",
          cmd_name: item.cmd_name || "",
          raw_hex: item.raw_hex || "",
          co2_emission_unit: item.co2_emission_unit || "kg",
          // 核心光伏实时数据字段 - 全部保留2位小数，空值默认0.00
          pv1Voltage: item.pv1_voltage
            ? Number(item.pv1_voltage).toFixed(2)
            : "0.00",
          batteryVoltage: item.battery_voltage
            ? Number(item.battery_voltage).toFixed(2)
            : "0.00",
          chargeCurrent: item.charge_current
            ? Number(item.charge_current).toFixed(2)
            : "0.00",
          outputVoltage: item.output_voltage
            ? Number(item.output_voltage).toFixed(2)
            : "0.00",
          loadVoltage: item.load_voltage
            ? Number(item.load_voltage).toFixed(2)
            : "0.00",
          loadCurrent: item.load_current
            ? Number(item.load_current).toFixed(2)
            : "0.00",
          chargePower: item.charge_power
            ? Number(item.charge_power).toFixed(2)
            : "0.00",
          loadPower: item.load_power
            ? Number(item.load_power).toFixed(2)
            : "0.00",
          batteryTemp: item.battery_temp
            ? Number(item.battery_temp).toFixed(2)
            : "0.00",
          innerTemp: item.inner_temp
            ? Number(item.inner_temp).toFixed(2)
            : "0.00",
          batteryPower: item.battery_power
            ? Number(item.battery_power).toFixed(2)
            : "0.00",
          co2EmissionRaw: item.co2_emission_raw
            ? Number(item.co2_emission_raw).toFixed(2)
            : "0.00",
          co2Emission: item.co2_emission
            ? Number(item.co2_emission).toFixed(2)
            : "0.00",
          // influxDB原始字段兜底兼容
          slave_id: item.slave_id || 1,
          func_code: item.func_code || 3,
          data_len: item.data_len || 28,
        });
      },
      error: (err) => {
        console.error("[InfluxDB] 批量DTU查询失败：", err.message);
        // 错误时返回默认值数组（纯数据），字段和正常返回一致
        // const defaultResult = dtuNumberList.map((dtuNumber) => ({
        //   time: "",
        //   dtuNumber: dtuNumber,
        //   gateway_id: "",
        //   region_code: "光伏区域",
        //   device_status: "未知",
        //   device_status_desc: "",
        //   cmd_id: "",
        //   cmd_name: "",
        //   raw_hex: "",
        //   co2_emission_unit: "kg",
        //   pv1Voltage: "0.00",
        //   batteryVoltage: "0.00",
        //   chargeCurrent: "0.00",
        //   outputVoltage: "0.00",
        //   loadVoltage: "0.00",
        //   loadCurrent: "0.00",
        //   chargePower: "0.00",
        //   loadPower: "0.00",
        //   batteryTemp: "0.00",
        //   innerTemp: "0.00",
        //   batteryPower: "0.00",
        //   co2EmissionRaw: "0.00",
        //   co2Emission: "0.00",
        //   slave_id: 1,
        //   func_code: 3,
        //   data_len: 28,
        // }));
        // resolve(defaultResult);
        resolve([]);
      },
      complete: () => {
        // const finalResult = dtuNumberList.map((dtuNumber) => {
        //   const dtuStr = String(dtuNumber); //将数字转换成字符类型
        //   console.log(
        //     "[complete] 转换后的dtuStr:",
        //     dtuStr,
        //     "是否存在:",
        //     dtuStatusMap.has(dtuStr),
        //   ); // 打印匹配结果
        //   return (
        //     dtuStatusMap.get(dtuStr) || {
        //       time: "",
        //       dtuNumber: dtuNumber,
        //       gateway_id: "",
        //       region_code: "光伏区域",
        //       device_status: "未知",
        //       device_status_desc: "",
        //       cmd_id: "",
        //       cmd_name: "",
        //       raw_hex: "",
        //       co2_emission_unit: "kg",
        //       pv1Voltage: "0.00",
        //       batteryVoltage: "0.00",
        //       chargeCurrent: "0.00",
        //       outputVoltage: "0.00",
        //       loadVoltage: "0.00",
        //       loadCurrent: "0.00",
        //       chargePower: "0.00",
        //       loadPower: "0.00",
        //       batteryTemp: "0.00",
        //       innerTemp: "0.00",
        //       batteryPower: "0.00",
        //       co2EmissionRaw: "0.00",
        //       co2Emission: "0.00",
        //       slave_id: 1,
        //       func_code: 3,
        //       data_len: 28,
        //     }
        //   );
        // });
        // resolve(finalResult);
        console.log(`[complete] 总计获取到 ${dtuRealDataResultArray.length} 条数据`);
        resolve(dtuRealDataResultArray);
      },
    });
  });
}

/**
 * 查询单个DTU最新的TCP光伏数【实时数据】据
 * @param {String} dtuNumber 设备编号
 * @returns {Object}
 */
async function getTCPDtuLatestRealData(dtuNumber) {
  if (!dtuNumber) return {};
  const result = await getTCPBatchDtuLatestRealData({
    dtuNumberList: [dtuNumber],
    limit: 1,
  });
  return result[0] || {};
}

/**
 * TCP光伏【运行数据(cmdId=2)】写入InfluxDB - 字段1:1精准匹配运行数据JSON格式
 * @param {Object} tcpData TCP解析后的运行数据JSON
 */
async function writePvRunDataByTcp(tcpData) {
  try {
    // 1. 数据校验 - 运行数据必填项校验
    const validationError = validateRunData(tcpData);
    if (validationError) {
      throw new Error(validationError);
    }

    // 2. 时间戳处理：receiveTime是秒级数字戳 → 转纳秒级(InfluxDB标准)
    const reportTimeNano = tcpData.receiveTime
      ? BigInt(tcpData.receiveTime) * 1000000000n
      : BigInt(Date.now()) * 1000000n;

    // 3. 构建InfluxDB数据点 - 字段完全匹配运行数据，一一对应无偏差
    const point = new Point(measurement)
      // ======================== 核心标签（和实时数据一致，统一规范，全部字符串）=======================
      .tag("device_id", tcpData.dtuNumber)
      .tag("gateway_id", tcpData.deviceKey)
      .tag("region_code", "光伏区域")
      .tag("device_status", "运行") // 运行数据固定状态
      .tag("cmd_id", tcpData.cmdId.toString()) // 固定2
      .tag("cmd_name", tcpData.cmdName) // 光伏【运行数据】指令
      .tag("raw_hex", tcpData.rawHex)

      // ======================== 运行数据专属浮点数字段 - 精准匹配你的JSON ========================
      .floatField("success", tcpData.success ? 1 : 0)
      .floatField("slave_id", tcpData.slaveId || 1)
      .floatField("func_code", tcpData.funcCode || 3)
      .floatField("data_len", tcpData.dataLen || 42)
      .floatField("module_count", Number(tcpData.moduleCount) || 0) // 模组数量
      .floatField(
        "battery_capacity_raw",
        Number(tcpData.batteryCapacityRaw) || 0,
      ) // 电池容量原始值
      .floatField("battery_capacity", Number(tcpData.batteryCapacity) || 0) // 电池容量(AH)
      .floatField("device_addr", Number(tcpData.deviceAddr) || 0) // 设备地址
      .floatField("reserve0204_0205", Number(tcpData.reserve0204_0205) || 0) // 保留字段
      .floatField("day_generate_power", Number(tcpData.dayGeneratePower) || 0) // 日发电量
      .floatField("day_generate_time", Number(tcpData.dayGenerateTime) || 0) // 日发电时长
      .floatField(
        "month_generate_power",
        Number(tcpData.monthGeneratePower) || 0,
      ) // 月发电量
      .floatField("month_generate_time", Number(tcpData.monthGenerateTime) || 0) // 月发电时长
      .floatField(
        "total_generate_power_raw",
        Number(tcpData.totalGeneratePowerRaw) || 0,
      ) // 总发电量原始值
      .floatField(
        "total_generate_power_wh",
        Number(tcpData.totalGeneratePowerWh) || 0,
      ) // 总发电量(wh)
      .floatField(
        "total_generate_power_kwh",
        Number(tcpData.totalGeneratePowerKwh) || 0,
      ) // 总发电量(kwh)
      .floatField("load_day_use_power", Number(tcpData.loadDayUsePower) || 0) // 负载日用电量
      .floatField(
        "load_month_use_power",
        Number(tcpData.loadMonthUsePower) || 0,
      ) // 负载月用电量
      .floatField(
        "load_total_use_power",
        Number(tcpData.loadTotalUsePower) || 0,
      ) // 负载总用电量

      // ======================== 单位标签字段 ========================
      .tag("battery_capacity_unit", tcpData.batteryCapacityUnit || "AH")
      .tag("day_generate_power_unit", tcpData.dayGeneratePowerUnit || "wh")
      .tag("day_generate_time_unit", tcpData.dayGenerateTimeUnit || "秒")
      .tag("month_generate_power_unit", tcpData.monthGeneratePowerUnit || "wh")
      .tag("month_generate_time_unit", tcpData.monthGenerateTimeUnit || "秒")
      .tag("total_generate_power_unit", tcpData.totalGeneratePowerUnit || "kwh")
      .tag("load_day_use_power_unit", tcpData.loadDayUsePowerUnit || "wh")
      .tag("load_month_use_power_unit", tcpData.loadMonthUsePowerUnit || "wh")
      .tag("load_total_use_power_unit", tcpData.loadTotalUsePowerUnit || "wh")

      // 纳秒级时间戳
      .timestamp(reportTimeNano);

    // 写入+强制刷新，和实时数据写入逻辑一致
    writeApi.writePoint(point);
    await writeApi.flush();
    console.log(
      `[InfluxDB] TCP设备 ${tcpData.dtuNumber}(指令：${tcpData.cmdId}) 运行数据写入成功`,
    );
  } catch (error) {
    console.error("[InfluxDB] TCP光伏运行数据写入失败：", error.message);
    throw new Error(`[InfluxDB] TCP运行数据写入失败：${error.message}`);
  }
}

/**
 * 批量查询多个DTU最新的TCP光伏【运行数据】
 * @param {Object} params
 * @returns {Array}
 */
async function getTCPBatchDtuLatestRunData(params = {}) {
  const { dtuNumberList, limit = 1, start = "-1d", end = "now()" } = params;

  if (
    !dtuNumberList ||
    !Array.isArray(dtuNumberList) ||
    dtuNumberList.length === 0
  ) {
    console.warn("[InfluxDB] dtuNumberList必须是非空数组");
    return [];
  }
  const dtuStrArray = dtuNumberList.map((dtu) => `"${dtu}"`).join(",");
  // 查询语句增加 cmd_id='2' 过滤 → 只查运行数据，不与实时数据混淆
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => contains(value:r.device_id, set: [${dtuStrArray}]))
      |> filter(fn: (r) => r.cmd_id == "2")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["device_id"])
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit}, offset: 0)
  `;
  console.log(`[InfluxDB] 执行批量DTU运行数据查询：\n${fluxQuery}`);

  return new Promise((resolve) => {
    const dtuStatusMap = new Map();
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        const dtuNumber = item.device_id;
        if (dtuNumber && !dtuStatusMap.has(dtuNumber)) {
          // 返回字段完全匹配你的运行数据JSON格式，小驼峰，前端无缝对接
          dtuStatusMap.set(dtuNumber, {
            time: new Date(item._time).toLocaleString(),
            dtuNumber: dtuNumber,
            gateway_id: item.gateway_id || "",
            region_code: item.region_code || "光伏区域",
            device_status: "运行",
            cmd_id: "2",
            cmd_name: "光伏【运行数据】指令",
            rawHex: item.raw_hex || "",
            // 核心运行数据
            success: item.success == 1,
            slaveId: Number(item.slave_id) || 1,
            funcCode: Number(item.func_code) || 3,
            dataLen: Number(item.data_len) || 42,
            moduleCount: Number(item.module_count).toFixed(0),
            batteryCapacityRaw: Number(item.battery_capacity_raw).toFixed(2),
            batteryCapacity: Number(item.battery_capacity).toFixed(2),
            batteryCapacityUnit: "AH",
            deviceAddr: Number(item.device_addr).toFixed(0),
            reserve0204_0205: Number(item.reserve0204_0205).toFixed(0),
            dayGeneratePower: Number(item.day_generate_power).toFixed(2),
            dayGeneratePowerUnit: "wh",
            dayGenerateTime: Number(item.day_generate_time).toFixed(2),
            dayGenerateTimeUnit: "秒",
            monthGeneratePower: Number(item.month_generate_power).toFixed(2),
            monthGeneratePowerUnit: "wh",
            monthGenerateTime: Number(item.month_generate_time).toFixed(2),
            monthGenerateTimeUnit: "秒",
            totalGeneratePowerRaw: Number(
              item.total_generate_power_raw,
            ).toFixed(2),
            totalGeneratePowerWh: Number(item.total_generate_power_wh).toFixed(
              2,
            ),
            totalGeneratePowerKwh: Number(
              item.total_generate_power_kwh,
            ).toFixed(3),
            totalGeneratePowerUnit: "kwh",
            loadDayUsePower: Number(item.load_day_use_power).toFixed(2),
            loadDayUsePowerUnit: "wh",
            loadMonthUsePower: Number(item.load_month_use_power).toFixed(2),
            loadMonthUsePowerUnit: "wh",
            loadTotalUsePower: Number(item.load_total_use_power).toFixed(2),
            loadTotalUsePowerUnit: "wh",
          });
        }
      },
      error: (err) => {
        console.error("[InfluxDB] 批量DTU运行数据查询失败：", err.message);
        const defaultResult = dtuNumberList.map((dtuNumber) => ({
          time: "",
          dtuNumber: dtuNumber,
          gateway_id: "",
          region_code: "光伏区域",
          device_status: "未知",
          cmd_id: "2",
          cmd_name: "光伏【运行数据】指令",
          rawHex: "",
          moduleCount: "0",
          batteryCapacity: "0.00",
          totalGeneratePowerKwh: "0.000",
          dayGeneratePower: "0.00",
          monthGeneratePower: "0.00",
          loadTotalUsePower: "0.00",
        }));
        resolve(defaultResult);
      },
      complete: () => {
        const finalResult = dtuNumberList.map((dtuNumber) => {
          const dtuStr = String(dtuNumber);
          return (
            dtuStatusMap.get(dtuStr) || {
              time: "",
              dtuNumber: dtuNumber,
              gateway_id: "",
              region_code: "光伏区域",
              device_status: "无数据",
              cmd_id: "2",
              cmd_name: "光伏【运行数据】指令",
              rawHex: "",
              moduleCount: "0",
              batteryCapacity: "0.00",
              totalGeneratePowerKwh: "0.000",
              dayGeneratePower: "0.00",
              monthGeneratePower: "0.00",
              loadTotalUsePower: "0.00",
            }
          );
        });
        resolve(finalResult);
      },
    });
  });
}

/**
 * 查询单个DTU最新的TCP光伏【运行数据】
 * @param {String} dtuNumber 设备编号
 * @returns {Object}
 */
async function getTCPDtuLatestRunData(dtuNumber) {
  if (!dtuNumber || dtuNumber.trim() === "") return {};
  const result = await getTCPBatchDtuLatestRunData({
    dtuNumberList: [dtuNumber],
    limit: 1,
  });
  return result && result.length > 0 ? result[0] : {};
}

/**
 * 查询单个DTU过去一年的TCP光伏【运行数据】
 * @param {String} dtuNumber 设备编号
 * @returns {Array} 按时间倒序排列的年度运行数据列表
 */
async function getTCPDtuYearlyRunData(dtuNumber) {
  if (!dtuNumber || dtuNumber.trim() === "") return [];
  
  // 调用批量查询方法，时间范围设为过去一年
  const result = await getTCPBatchDtuYearlyRunData({
    dtuNumberList: [dtuNumber],
    start: "-1y", // 过去一年
    end: "now()"
  });
  
  return result && result.length > 0 ? result[0].dataList : [];
}

/**
 * 批量查询多个DTU过去一年的TCP光伏【运行数据】
 * @param {Object} params
 * @returns {Array}
 */
async function getTCPBatchDtuYearlyRunData(params = {}) {
  const { 
    dtuNumberList, 
    start = "-1y", 
    end = "now()" 
  } = params;

  if (
    !dtuNumberList ||
    !Array.isArray(dtuNumberList) ||
    dtuNumberList.length === 0
  ) {
    console.warn("[InfluxDB] dtuNumberList必须是非空数组");
    return [];
  }

  const dtuStrArray = dtuNumberList.map((dtu) => `"${dtu}"`).join(",");
  
  // 年度数据查询语句（保留所有符合条件的数据，不限制条数，按时间倒序）
  const fluxQuery = `
    import "date"
    import "timezone"
    // 设置时区为北京时间，保证时间计算准确
    option location = timezone.location(name: "Asia/Shanghai")
    
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => contains(value:r.device_id, set: [${dtuStrArray}]))
      |> filter(fn: (r) => r.cmd_id == "2")
      |> filter(fn: (r) => date.hour(t: r._time) < 15)
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["device_id"])
      |> map(fn: (r) => ({ r with _day:string(v: date.truncate(t: r._time, unit: 1d)) }))
      |> group(columns: ["device_id", "_day"])
      |> sort(columns: ["_time"], desc: true) // 按时间倒序排列
      |> limit(n: 1, offset: 0) // 只取最新指定条数
  `;
  
  console.log(`[InfluxDB] 执行批量DTU年度运行数据查询：\n${fluxQuery}`);

  return new Promise((resolve) => {
    // 存储每个DTU的年度数据列表
    const dtuYearlyDataMap = new Map();
    // 初始化每个DTU的空数据列表
    dtuNumberList.forEach(dtu => {
      dtuYearlyDataMap.set(String(dtu), []);
    });

    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        const dtuNumber = item.device_id;
        
        if (dtuNumber && dtuYearlyDataMap.has(dtuNumber)) {
          // 数据格式和现有接口保持一致，保证前端无缝对接
          const runDataItem = {
            time: new Date(item._time).toLocaleString(), // 本地化时间（北京时间）
            timeStamp: new Date(item._time).getTime(), // 时间戳（方便前端排序/筛选）
            dtuNumber: dtuNumber,
            gateway_id: item.gateway_id || "",
            region_code: item.region_code || "光伏区域",
            device_status: "运行",
            cmd_id: "2",
            cmd_name: "光伏【运行数据】指令",
            rawHex: item.raw_hex || "",
            // 核心运行数据（保留所有字段，格式和现有接口一致）
            success: item.success == 1,
            slaveId: Number(item.slave_id) || 1,
            funcCode: Number(item.func_code) || 3,
            dataLen: Number(item.data_len) || 42,
            moduleCount: Number(item.module_count).toFixed(0),
            batteryCapacityRaw: Number(item.battery_capacity_raw).toFixed(2),
            batteryCapacity: Number(item.battery_capacity).toFixed(2),
            batteryCapacityUnit: "AH",
            deviceAddr: Number(item.device_addr).toFixed(0),
            reserve0204_0205: Number(item.reserve0204_0205).toFixed(0),
            dayGeneratePower: Number(item.day_generate_power).toFixed(2),
            dayGeneratePowerUnit: "wh",
            dayGenerateTime: Number(item.day_generate_time).toFixed(2),
            dayGenerateTimeUnit: "秒",
            monthGeneratePower: Number(item.month_generate_power).toFixed(2),
            monthGeneratePowerUnit: "wh",
            monthGenerateTime: Number(item.month_generate_time).toFixed(2),
            monthGenerateTimeUnit: "秒",
            totalGeneratePowerRaw: Number(item.total_generate_power_raw).toFixed(2),
            totalGeneratePowerWh: Number(item.total_generate_power_wh).toFixed(2),
            totalGeneratePowerKwh: Number(item.total_generate_power_kwh).toFixed(3),
            totalGeneratePowerUnit: "kwh",
            loadDayUsePower: Number(item.load_day_use_power).toFixed(2),
            loadDayUsePowerUnit: "wh",
            loadMonthUsePower: Number(item.load_month_use_power).toFixed(2),
            loadMonthUsePowerUnit: "wh",
            loadTotalUsePower: Number(item.load_total_use_power).toFixed(2),
            loadTotalUsePowerUnit: "wh",
          };
          
          // 将数据添加到对应DTU的列表中
          dtuYearlyDataMap.get(dtuNumber).push(runDataItem);
        }
      },
      error: (err) => {
        console.error("[InfluxDB] 批量DTU年度运行数据查询失败：", err.message);
        // 异常时返回空数据结构
        const defaultResult = dtuNumberList.map((dtuNumber) => ({
          dtuNumber: dtuNumber,
          dataList: [],
          totalCount: 0,
          message: "查询失败：" + err.message
        }));
        resolve(defaultResult);
      },
      complete: () => {
        // 组装最终返回结果
        const finalResult = dtuNumberList.map((dtuNumber) => {
          const dtuStr = String(dtuNumber);
          const dataList = dtuYearlyDataMap.get(dtuStr) || [];
          
          return {
            dtuNumber: dtuNumber,
            dataList: dataList,
            totalCount: dataList.length, // 返回数据总条数
            message: dataList.length > 0 ? "查询成功" : "暂无年度运行数据"
          };
        });
        
        resolve(finalResult);
      },
    });
  });
}

/**
 * 查询单个DTU设备指定时间范围的当日全量实时数据（适配折线图渲染）
 * @param {Object} params - 前端传入的查询参数
 * @param {string} params.dtuNumber - DTU设备编号
 * @param {string} params.startTime - 开始时间（yyyy-MM-dd HH:mm:ss）
 * @param {string} params.endTime - 结束时间（yyyy-MM-dd HH:mm:ss）
 * @param {string} params.orderBy - 排序方式（如 'time asc' / 'time desc'）
 * @returns {Promise<Array>} 格式化后的全量数据列表
 */
async function queryDtuDayFullRealData(params) {
  const { dtuNumber, startTime, endTime, orderBy = "time asc" } = params;

  console.log("折线图参数：", dtuNumber, startTime, endTime, orderBy);

  // 1. 前置参数校验
  if (!dtuNumber || !dtuNumber.toString().trim()) {
    console.warn("[InfluxDB] queryDtuDayFullRealData: 缺少必填参数 dtuNumber");
    return [];
  }
  if (!startTime || !endTime) {
    console.warn("[InfluxDB] queryDtuDayFullRealData: 缺少开始/结束时间");
    return [];
  }

  try {
    // 步骤1：解析前端时间字符串为Date对象
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    // 步骤2：转为RFC3339格式（带时区，适配国内东八区，无需手动加Z）
    // 注意：toISOString() 会自动转换为UTC时间，若前端传的是北京时间，需先处理时区偏移
    const start = startDate.toISOString(); // 输出示例：2026-01-21T00:00:00.000Z
    const stop = endDate.toISOString(); // 输出示例：2026-01-21T23:59:59.000Z

    // 3. 判断排序方向（适配前端 'time asc' / 'time desc' 格式）
    const isDesc = orderBy.toLowerCase().includes("desc");

    // 4. 构建Flux查询语句（复用现有measurement，兼容TCP写入的字段）
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: ${start}, stop: ${stop})
        |> filter(fn: (r) => r._measurement == "${measurement}")
        |> filter(fn: (r) => r.device_id == "${dtuNumber.toString().trim()}")
        |> filter(fn: (r) => r.cmd_id == "1")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: ${isDesc})
        |> keep(columns: [
          "_time", "device_id", "pv1_voltage", "pv_power", "output_voltage", 
          "output_current", "load_power", "device_status", "device_status_desc","battery_voltage","charge_current","charge_power"
        ])
    `.trim();

    console.log(`[InfluxDB] 执行DTU当日全量数据查询：\n${fluxQuery}`);

    // 5. 执行查询并格式化结果（适配前端折线图）
    return new Promise((resolve, reject) => {
      const result = [];
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          const item = tableMeta.toObject(row);
          const dtuNumber = item.device_id;
          // 格式化数据：字段名对齐前端期望，值做兼容处理
          result.push({
            time: new Date(item._time).format("yyyy-MM-dd HH:mm:ss"), // 统一时间格式
            dtuNumber: dtuNumber,
            pv_voltage: item.pv1_voltage
              ? Number(item.pv1_voltage).toFixed(2)
              : 0, // 光伏输入电压（兼容TCP字段）
            pv_power: item.pv_power ? Number(item.pv_power).toFixed(2) : 0, // 光伏功率
            output_voltage: item.output_voltage
              ? Number(item.output_voltage).toFixed(2)
              : 0, // 输出电压
            output_current: item.output_current
              ? Number(item.output_current).toFixed(2)
              : 0, // 输出电流
            output_power: item.load_power
              ? Number(item.load_power).toFixed(2)
              : 0, // 输出功率（兼容load_power字段）
            device_status: item.device_status || "未知",
            device_status_desc: item.device_status_desc || "",
            battery_voltage: item.battery_voltage
              ? Number(item.battery_voltage).toFixed(2)
              : 0,
            charge_current: item.charge_current
              ? Number(item.charge_current).toFixed(2)
              : 0,
            charge_power: item.charge_power
              ? Number(item.charge_power).toFixed(2)
              : 0,
          });
        },
        error: (err) => {
          console.error(
            "[InfluxDB] queryDtuDayFullRealData 查询失败：",
            err.message,
          );
          reject(new Error(`查询DTU当日全量数据失败：${err.message}`));
        },
        complete: () => {
          // 确保数据按时间排序（兜底处理）
          const sortedResult = result.sort((a, b) => {
            const timeA = new Date(a.time).getTime();
            const timeB = new Date(b.time).getTime();
            return isDesc ? timeB - timeA : timeA - timeB;
          });
          resolve(sortedResult);
        },
      });
    });
  } catch (error) {
    console.error("[InfluxDB] queryDtuDayFullRealData 异常：", error.message);
    return [];
  }
}

// 修复：给Date原型添加format方法（解决时间格式化问题）
if (!Date.prototype.format) {
  Date.prototype.format = function (fmt) {
    const o = {
      "M+": this.getMonth() + 1, // 月份
      "d+": this.getDate(), // 日
      "H+": this.getHours(), // 小时
      "m+": this.getMinutes(), // 分
      "s+": this.getSeconds(), // 秒
      "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
      S: this.getMilliseconds(), // 毫秒
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        (this.getFullYear() + "").substr(4 - RegExp.$1.length),
      );
    }
    for (const k in o) {
      if (new RegExp(`(${k})`).test(fmt)) {
        fmt = fmt.replace(
          RegExp.$1,
          RegExp.$1.length === 1
            ? o[k]
            : ("00" + o[k]).substr(("" + o[k]).length),
        );
      }
    }
    return fmt;
  };
}

/**
 * 查询所有DTU设备指定日期的日发电量总和（InfluxDB端累加）
 * @param {Object} params - 查询参数
 * @param {string} params.date - 指定查询日期（格式：YYYY-MM-DD，必填）
 * @param {string} [params.timezone="Asia/Shanghai"] - 时区（默认东八区）
 * @returns {Promise<Object>} 包含总发电量的结果对象
 */
// async function getAllDtuSingleDayGeneratePower(params) {
//   const { startTime, endTime } = params;
//   // 1. 参数校验
//   if (!startTime || !endTime) {
//     console.warn(
//       "[InfluxDB] getAllDtuSingleDayGeneratePower: 缺少必填参数 startTime || endTime",
//     );
//     return [];
//   }

//   console.log("//", startTime, endTime);

//   // 2. 处理时间范围：将传入的日期转为InfluxDB兼容的时间范围（东八区自然日）
//   // 示例：date=2026-01-23 → 开始时间：2026-01-23T00:00:00+08:00，结束时间：2026-01-24T00:00:00+08:00
//   try {
//     const startDate = new Date(startTime);
//     const endDate = new Date(endTime);
//     // 转为ISO格式（InfluxDB Flux支持的时间格式）
//     const start = startDate.toISOString();
//     const end = endDate.toISOString();

//     // 3. 构建Flux查询语句（核心：sum累加day_generate_power）
// const fluxQuery = `
//   from(bucket: "${bucket}")
//     |> range(start: ${start}, stop: ${end})
//     |> filter(fn: (r) =>
//       r._measurement == "${measurement}" and
//       r.cmd_id == "2" and
//       r._field == "day_generate_power"
//     )
//     |> group(columns: ["device_id"])
//     |> last()
//     |> group()
//     |> sum(column: "_value")
//     |> rename(columns: {_value: "totalDailyGeneratePower"})
//     |> keep(columns: ["totalDailyGeneratePower"])
// `.trim();

//     const fluxQuery1 = `
//       from(bucket: "${bucket}")
//         |> range(start: ${start}, stop: ${end})
//         |> filter(fn: (r) => r._measurement == "${measurement}")
//         |> filter(fn: (r) => r.cmd_id == "2")
//         |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
//         |> keep(columns: [
//           "_time", "day_generate_power", "month_generate_power"])
//     `.trim();

//     const fluxQuery2 = `
//     from(bucket: "${bucket}")
//       |> range(start: ${start}, stop: ${end})
//       |> filter(fn: (r) =>
//         r._measurement == "${measurement}" and
//         r.cmd_id == "2" and
//         contains(value: r._field, set: ["day_generate_power", "day_generate_time", "month_generate_power", "month_generate_time", "total_generate_power_kwh"])
//       )
//       |> group(columns: ["device_id"])
//       |> last()
//       |> group(columns: ["_field"])
//       |> sum(column: "_value")
//       // 新增：添加固定rowKey列
//       |> map(fn: (r) => ({
//         _value: r._value,
//         _field: r._field,
//         pivot_key: "total"
//       }))
//       // 修复：使用pivot_key作为rowKey
//       |> pivot(rowKey:["pivot_key"], columnKey: ["_field"], valueColumn: "_value")
//       // 可选：移除临时列，让结果更整洁
//       |> drop(columns: ["pivot_key"])
//   `.trim();

//     console.log(`[InfluxDB] 执行所有DTU日发电量求和查询：\n${fluxQuery}`);
//     // 4. 执行查询并格式化结果
//     return new Promise((resolve, reject) => {
//       let totalPower = 0; // 默认每日总发电量为0

//       queryApi.queryRows(fluxQuery, {
//         next(row, tableMeta) {
//           const item = tableMeta.toObject(row);
//           // 提取求和结果，转为数字（兼容空值）
//           totalPower = item.totalDailyGeneratePower
//             ? Number(item.totalDailyGeneratePower)
//             : 0;
//         },
//         error: (err) => {
//           console.error("[InfluxDB] 所有DTU日发电量求和查询失败：", err);
//           reject(new Error(`日发电量总和查询失败：${err.message}`));
//         },
//         complete: () => {
//           // 返回格式化结果（单位：wh，可按需转换为kwh）
//           resolve({
//             date: startDate, // 查询日期
//             totalDailyGeneratePower: totalPower.toFixed(2), // 总日发电量（保留2位小数）
//             totalDailyGeneratePowerKwh: (totalPower / 1000).toFixed(3), // 转换为kwh（保留3位小数）
//             unit: "wh", // 基础单位
//             unitKwh: "kwh", // 常用单位
//             updateTime: new Date().toLocaleString(), // 查询完成时间
//           });
//         },
//       });
//     });
//   } catch (error) {
//     console.error(
//       "[InfluxDb] getAllDtuSingleDayGeneratePower 异常：",
//       error.message,
//     );
//     return [];
//   }
// }

// 假设已有bucket、measurement、start、end、queryApi等变量定义
// async function getAllDtuSingleDayGeneratePower(params) {
//   const { startTime, endTime } = params;
//   if (!startTime || !endTime) {
//     console.warn("缺少时间参数");
//     return { data: { totalDailyGeneratePower: 0, totalDailyGenerateTime: 0, month_generate_power: 0, month_generate_time: 0, total_generate_power_kwh: 0 } };
//   }

//   const startDate = new Date(startTime);
//   const endDate = new Date(endTime);
//   const start = startDate.toISOString();
//   const end = endDate.toISOString();

//   // 修复后的Flux查询语句
//   const fluxQuery = `
//     from(bucket: "${bucket}")
//       |> range(start: ${start}, stop: ${end})
//       |> filter(fn: (r) =>
//         r._measurement == "${measurement}" and
//         r.cmd_id == "2" and
//         contains(value: r._field, set: ["day_generate_power", "day_generate_time", "month_generate_power", "month_generate_time", "total_generate_power_kwh"])
//       )
//       |> group(columns: ["device_id"])
//       |> last()
//       |> group(columns: ["_field"])
//       |> sum(column: "_value")
//       |> map(fn: (r) => ({
//         _value: r._value,
//         _field: r._field,
//         pivot_key: "total"
//       }))
//       |> pivot(rowKey:["pivot_key"], columnKey: ["_field"], valueColumn: "_value")
//       // |> drop(columns: ["pivot_key"])
//   `.trim();

//   console.log("执行Flux查询：", fluxQuery);

//   return new Promise((resolve, reject) => {
//     let result = {
//       total_generate_power_kwh: 0,
//       totalDailyGeneratePower: 0,
//       totalDailyGenerateTime: 0,
//       month_generate_power: 0,
//       month_generate_time: 0,

//     };

//     queryApi.queryRows(fluxQuery, {
//       next(row, tableMeta) {
//         const item = tableMeta.toObject(row);
//         console.log('当前行数据：', item);
//         // 映射查询结果到result
//         result = {
//           totalDailyGeneratePower: Number(item.day_generate_power || 0),
//           totalDailyGenerateTime: Number(item.day_generate_time || 0),
//           month_generate_power: Number(item.month_generate_power || 0),
//           month_generate_time: Number(item.month_generate_time || 0),
//           total_generate_power_kwh: Number(item.total_generate_power_kwh || 0)
//         };
//       },
//       error: (err) => {
//         console.error("查询失败：", err);
//         reject(err);
//       },
//       complete: () => {
//         resolve({
//           data: {
//             ...result,
//             totalDailyGeneratePower: result.totalDailyGeneratePower.toFixed(2),
//             totalDailyGenerateTime: result.totalDailyGenerateTime.toFixed(2),
//             month_generate_power: result.month_generate_power.toFixed(2),
//             month_generate_time: result.month_generate_time.toFixed(2),
//             total_generate_power_kwh: result.total_generate_power_kwh.toFixed(3)
//           }
//         });
//       }
//     });
//   });
// }

async function getAllDtuSingleDayGeneratePower(params) {
  const { startTime, endTime } = params;
  if (!startTime || !endTime) {
    console.warn("缺少时间参数");
    return {
      data: {
        totalDailyGeneratePower: 0,
        totalDailyGenerateTime: 0,
        month_generate_power: 0,
        month_generate_time: 0,
        total_generate_power_kwh: 0,
      },
    };
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  // ========== 2. 并行查询所有需要的字段 ==========
  // 每个字段单独查询，Promise.all并行执行（效率高）
  const [
    totalDailyGeneratePower,
    totalDailyGenerateTime,
    month_generate_power,
    month_generate_time,
    total_generate_power_kwh,
  ] = await Promise.all([
    querySingleField(
      "day_generate_power",
      "totalDailyGeneratePower",
      start,
      end,
    ),
    querySingleField("day_generate_time", "totalDailyGenerateTime", start, end),
    querySingleField(
      "month_generate_power",
      "month_generate_power",
      start,
      end,
    ),
    querySingleField("month_generate_time", "month_generate_time", start, end),
    querySingleField(
      "total_generate_power_kwh",
      "total_generate_power_kwh",
      start,
      end,
    ),
  ]);

  // ========== 3. 合并结果并返回 ==========
  return {
    data: {
      totalDailyGeneratePower: totalDailyGeneratePower.toFixed(2),
      totalDailyGenerateTime: totalDailyGenerateTime.toFixed(2),
      month_generate_power: month_generate_power.toFixed(2),
      month_generate_time: month_generate_time.toFixed(2),
      total_generate_power_kwh: total_generate_power_kwh.toFixed(3),
    },
  };
}

// ========== 1. 定义单个字段的查询函数（通用逻辑，避免重复代码） ==========
async function querySingleField(fieldName, renameTo, start, end) {
  const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: ${start}, stop: ${end})
        |> filter(fn: (r) =>
          r._measurement == "${measurement}" and
          r.cmd_id == "2" and
          r._field == "${fieldName}"
        )
        |> group(columns: ["device_id"])
        |> last() // 取每个设备最新值
        |> group() // 取消分组，全局求和
        |> sum(column: "_value") // 累加所有设备的该字段值
        |> rename(columns: {_value: "${renameTo}"}) // 重命名为前端易识别的字段
        |> keep(columns: ["${renameTo}"]) // 只保留目标字段
    `.trim();

  console.log(`查询字段${fieldName}的Flux：`, fluxQuery);

  return new Promise((resolve) => {
    let fieldValue = 0;
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        fieldValue = Number(item[renameTo] || 0); // 转为数字，空值补0
      },
      error: (err) => {
        console.error(`查询字段${fieldName}失败：`, err);
        resolve(0); // 报错时返回0，不影响整体结果
      },
      complete: () => {
        resolve(fieldValue);
      },
    });
  });
}

// 导出服务方法
module.exports = {
  writePvData,
  writePvRealDataByTcp,
  writePvFullMetrics,
  queryDeviceHistory,
  queryPvFullMetrics,
  statsRegionPvData,
  queryAllDevicesLatestStatus,
  getBatchDtuLatestData,
  getTCPBatchDtuLatestRealData,
  getTCPBatchDtuLatestRealDataOnDay,
  getTCPDtuLatestRealData,
  writePvRunDataByTcp,
  getTCPBatchDtuLatestRunData,
  getTCPDtuLatestRunData,
  queryDtuDayFullRealData,
  getAllDtuSingleDayGeneratePower,
  getTCPDtuYearlyRunData,
};
