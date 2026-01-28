const { loggers } = require("winston");
const influxService = require("../services/influxService");

// 统一响应格式
const sendResponse = (res, code, message, data = null) => {
  res.status(code).json({
    code,
    message,
    data,
    timestamp: new Date().getTime(),
  });
};

/**
 * 1. 写入光伏数据（对接 MQTT 或前端手动上报）
 */
exports.writePvData = async (req, res) => {
  try {
    const data = req.body;
    // 校验必要字段
    // const requiredFields = ['device_id', 'gateway_id', 'device_status', 'pv_power', 'pv_voltage', 'output_voltage', 'output_current', 'dc_meter_power'];
    // const missingFields = requiredFields.filter(field => data[field] === undefined);

    // if (missingFields.length > 0) {
    //   return sendResponse(res, 400, `缺少必要字段：${missingFields.join(', ')}`);
    // }

    // await influxService.writePvData(data);
    // sendResponse(res, 200, '数据写入成功');

    await influxService.writePvData(data);
    sendResponse(res, 200, "数据写入成功");
  } catch (error) {
    console.error("API 写入数据失败: ", error.message);
    if (
      error.message.includes("缺少必要字段") ||
      error.message.includes("格式不正确")
    ) {
      return sendResponse(res, 400, error.message);
    }
    sendResponse(res, 500, error.message);
  }
};
/**
 * 【核心方法】：TCP服务专属 - 写入光伏实时/运行数据 (完美适配你的TCP解析JSON格式)
 * 适配字段：dtuNumber, deviceKey, deviceStatus, pv1Voltage, batteryVoltage 等
 * 调用方式1：TCP服务内部直接调用 (最优)：await influxService.writePvRealDataByTcp(parsedData)
 * 调用方式2：HTTP接口调用：POST /api/pv/data/write-tcp
 */
exports.writePvRealDataByTcp = async (req, res) => {
  try {
    const tcpPvData = req.body;
    // ✅ 校验TCP解析后的核心必传字段（缺一不可，保证入库数据有效）
    const requiredFields = ["dtuNumber", "deviceKey", "cmdId", "deviceStatus"];
    const missingFields = requiredFields.filter(
      (field) => tcpPvData[field] === undefined || tcpPvData[field] === null,
    );

    if (missingFields.length > 0) {
      return sendResponse(
        res,
        400,
        `TCP光伏实时数据缺少必要字段：${missingFields.join(", ")}`,
      );
    }

    // ✅ 调用服务层 - 传入TCP解析的原始数据，服务层做字段映射入库
    await influxService.writePvRealDataByTcp(tcpPvData);
    sendResponse(res, 200, "TCP光伏实时数据写入InfluxDB成功");
  } catch (error) {
    console.error("[TCP数据入库失败] ", error.message);
    if (
      error.message.includes("缺少必要字段") ||
      error.message.includes("格式不正确")
    ) {
      return sendResponse(res, 400, error.message);
    }
    sendResponse(res, 500, `TCP数据入库异常：${error.message}`);
  }
};

/**
 * 【核心方法】：TCP服务专属 - 写入光伏【运行数据】 (完美适配TCP解析的运行数据JSON格式)
 * 适配字段：dtuNumber, deviceKey, moduleCount, batteryCapacity, totalGeneratePowerKwh 等
 * 调用方式1：TCP服务内部直接调用 (最优)：await influxService.writePvRunDataByTcp(parsedData)
 * 调用方式2：HTTP接口调用：POST /api/pv/data/write-run-tcp
 */
exports.writePvRunDataByTcp = async (req, res) => {
  try {
    const tcpPvData = req.body;
    // ✅ 校验TCP运行数据的核心必传字段（缺一不可，保证入库数据有效，和运行数据结构匹配）
    const requiredFields = ["dtuNumber", "deviceKey", "cmdId", "deviceAddr"];
    const missingFields = requiredFields.filter(
      (field) => tcpPvData[field] === undefined || tcpPvData[field] === null,
    );

    if (missingFields.length > 0) {
      return sendResponse(
        res,
        400,
        `TCP光伏运行数据缺少必要字段：${missingFields.join(", ")}`,
      );
    }

    // ✅ 调用服务层运行数据写入方法 - 传入TCP解析的原始运行数据，服务层做字段映射入库
    await influxService.writePvRunDataByTcp(tcpPvData);
    sendResponse(res, 200, "TCP光伏运行数据写入InfluxDB成功");
  } catch (error) {
    console.error("[TCP运行数据入库失败] ", error.message);
    if (
      error.message.includes("缺少必要字段") ||
      error.message.includes("格式不正确")
    ) {
      return sendResponse(res, 400, error.message);
    }
    sendResponse(res, 500, `TCP运行数据入库异常：${error.message}`);
  }
};

/**
 * 1. 写入光伏全量数据（对接 MQTT 或前端手动上报）
 */
exports.writePvFullData = async (req, res) => {
  try {
    const data = req.body;
    // 校验必要字段
    // const requiredFields = ['device_id', 'gateway_id', 'device_status', 'pv_power', 'pv_voltage', 'output_voltage', 'output_current', 'dc_meter_power'];
    // const missingFields = requiredFields.filter(field => data[field] === undefined);

    // if (missingFields.length > 0) {
    //   return sendResponse(res, 400, `缺少必要字段：${missingFields.join(', ')}`);
    // }

    // await influxService.writePvData(data);
    // sendResponse(res, 200, '数据写入成功');

    await influxService.writePvFullMetrics(data);
    sendResponse(res, 200, "数据写入成功");
  } catch (error) {
    console.error("API 写入数据失败: ", error.message);
    if (
      error.message.includes("缺少必要字段") ||
      error.message.includes("格式不正确")
    ) {
      return sendResponse(res, 400, error.message);
    }
    sendResponse(res, 500, error.message);
  }
};

/**
 * 2. 查询指定设备历史数据
 */
exports.queryDeviceHistory = async (req, res) => {
  try {
    const { device_id, start, end } = req.query;
    if (!device_id) {
      return sendResponse(res, 400, "缺少参数：device_id");
    }

    const data = await influxService.queryDeviceHistory({
      device_id,
      start,
      end,
    });
    sendResponse(res, 200, "查询成功", data);
  } catch (error) {
    sendResponse(res, 500, error.message);
  }
};

/**
 * 3. 统计区域光伏数据
 */
exports.statsRegionPvData = async (req, res) => {
  try {
    const { region_code } = req.query;
    const stats = await influxService.statsRegionPvData(region_code);
    sendResponse(res, 200, "统计成功", stats);
  } catch (error) {
    sendResponse(res, 500, error.message);
  }
};

/**
 * 4. 查询所有设备最新状态
 */
// exports.queryAllDevicesLatestStatus = async (req, res) => {
//   try {
//     const data = await influxService.queryAllDevicesLatestStatus();
//     sendResponse(res, 200, '查询成功', data);
//   } catch (error) {
//     sendResponse(res, 500, error.message);
//   }
// };

/**
 * @desc    (从 InfluxDB) 查询所有设备的最新状态
 * @route   GET /api/pv/devices/latest
 * @access  Public
 */
exports.queryAllDevicesLatestStatus = async (req, res) => {
  try {
    // 调用 influxService 中正确的方法
    const result = await influxService.queryAllDevicesLatestStatus();

    res.status(200).json({
      code: 200,
      message: "从 InfluxDB 查询所有设备最新状态成功",
      data: result,
      timestamp: new Date().toLocaleString(),
    });
  } catch (error) {
    console.error("查询失败:", error);
    res.status(500).json({
      code: 500,
      message: error.message,
      data: null,
      timestamp: new Date().toLocaleString(),
    });
  }
};

/**
 * 5. 查询光伏全量指标数据（支持设备/站点/时间/字段筛选 + 分页）
 * @route POST /api/pv/query-full-metrics
 * @desc  查询 pv_device_metrics 全量指标，支持多条件筛选和分页
 */
exports.queryPvFullMetrics = async (req, res) => {
  try {
    // 从请求体获取参数（POST 方式，适配复杂筛选条件）
    const {
      device_id, // 设备ID（可选）
      station_id, // 站点ID（可选）
      start = "-24h", // 开始时间（默认近24小时）
      end = "now()", // 结束时间（默认当前时间）
      fields = [], // 指定查询字段（可选，数组格式）
      latestOnly = false, // 是否只查最新数据（默认否）
      pageNum = 1, // 页码（默认1）
      pageSize = 10, // 页大小（默认10）
    } = req.body;

    // 基础参数校验
    if (pageNum < 1) {
      return sendResponse(res, 400, "页码必须大于等于1");
    }
    if (pageSize < 1 || pageSize > 100) {
      return sendResponse(res, 400, "页大小必须在1~100之间");
    }

    // 调用服务层方法
    const fullData = await influxService.queryPvFullMetrics({
      device_id,
      station_id,
      start,
      end,
      fields,
      latestOnly,
    });

    // 处理分页（内存分页，适配前端分页需求）
    const total = fullData.length;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = fullData.slice(startIndex, endIndex);

    // 返回标准化结果（复用你的 sendResponse 方法）
    sendResponse(res, 200, "全量指标查询成功", {
      list: pageData, // 分页后的数据列表
      pagination: {
        // 分页信息
        pageNum,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("全量指标查询失败:", error);
    // 区分参数错误和服务器错误
    if (
      error.message.includes("缺少必要字段") ||
      error.message.includes("格式不正确")
    ) {
      return sendResponse(res, 400, error.message);
    }
    sendResponse(res, 500, `查询失败：${error.message}`);
  }
};

/**
 * 6. 快捷查询：指定设备的最新全量指标
 * @route GET /api/pv/query-device-latest-full
 * @desc  简化版接口，只查单个设备最新一条全量指标
 */
exports.queryDeviceLatestFullMetrics = async (req, res) => {
  try {
    // 从 query 获取参数（GET 方式，适配简单查询）
    const {
      device_id,
      latestOnly: latestOnlyStr,
      start: startStr,
      end: endStr,
    } = req.query;

    // 1. 必传参数校验
    if (!device_id) {
      return sendResponse(res, 400, "缺少参数：device_id");
    }

    // 2. 修复核心：将字符串类型的 latestOnly 转为布尔类型
    let latestOnly = false; // 默认 false
    if (latestOnlyStr) {
      // 兼容 "true"/"1"/"false"/"0" 等常见传值
      latestOnly =
        latestOnlyStr.toLowerCase() === "true" || latestOnlyStr === "1";
    }

    // 3. 修复 start/end：传空时用 undefined，让服务层默认值生效
    const start = startStr || undefined; // 空字符串 → undefined
    const end = endStr || undefined;

    console.log("处理后的参数：", { device_id, latestOnly, start, end }); // 打印验证

    // 4. 调用服务层（此时 latestOnly 是布尔类型）
    const latestData = await influxService.queryPvFullMetrics({
      device_id,
      latestOnly, // 传布尔值：true/false
      start,
      end,
    });

    // 返回结果（取第一条，无数据则返回空对象）
    sendResponse(res, 200, "设备最新全量指标查询成功", latestData[0] || {});
  } catch (error) {
    console.error("设备最新全量指标查询失败:", error);
    sendResponse(res, 500, `查询失败：${error.message}`);
  }
};

/**
 * 查询单个DTU的最新TCP光伏【实时数据】
 * @route GET /api/pv/tcp/latest
 * @desc  根据dtuNumber查询单设备最新一条TCP存入的光伏数据，精准匹配入库字段
 * @access  Public
 */
exports.getTCPDtuLatestRealData = async (req, res) => {
  try {
    // 从GET请求的query中获取dtuNumber (推荐GET，查询类接口规范)
    const { dtuNumber } = req.query;

    // 1. 必填参数校验
    if (!dtuNumber) {
      return sendResponse(res, 400, "请求参数错误：缺少必填字段 dtuNumber");
    }

    // 2. 调用你封装好的influxService方法
    const latestData = await influxService.getTCPDtuLatestRealData(dtuNumber);

    // 3. 统一返回格式，无数据返回空对象，前端不会报错
    sendResponse(res, 200, "单个DTU最新TCP光伏数据查询成功", latestData);
  } catch (error) {
    console.error("[查询单个DTU最新数据失败]：", error.message);
    sendResponse(res, 500, `查询失败：${error.message}`, {});
  }
};

/**
 * 查询单个DTU最新的TCP光伏【运行数据】
 * @route GET /api/pv/tcp/run/latest
 * @desc  根据dtuNumber查询单设备最新一条运行数据(cmdId=2)，字段精准匹配TCP解析格式
 * @access  Public
 */
exports.getTCPDtuLatestRunData = async (req, res) => {
  try {
    const { dtuNumber } = req.query;
    if (!dtuNumber) {
      return sendResponse(res, 400, "请求参数错误：缺少必填字段 dtuNumber");
    }
    const latestRunData = await influxService.getTCPDtuLatestRunData(dtuNumber);
    sendResponse(res, 200, "单个DTU最新TCP光伏运行数据查询成功", latestRunData);
  } catch (error) {
    console.error("[查询单个DTU运行数据失败]：", error.message);
    sendResponse(res, 500, `查询失败：${error.message}`, {});
  }
};

/**
 * 查询单个DTU过去一年的TCP光伏【运行数据】
 * @route GET /api/pv/tcp/run/yearly
 * @desc  根据dtuNumber查询单设备过去一年的运行数据(cmdId=2)，返回按时间倒序的列表
 * @access  Public
 */
// 后端 pvController.js 对应调整（关键行）
exports.getTCPDtuYearlyRunData = async (req, res) => {
  try {
    // 改为接收字符串类型的dtuNumber
    const { dtuNumber } = req.body; 
    console.log("查询年度运行数据的参数是：", dtuNumber);

    // 字符串参数校验
    if (!dtuNumber || String(dtuNumber).trim() === "") {
      return sendResponse(res, 400, "请求参数错误：缺少有效设备编号 dtuNumber");
    }
    const validDtuNumber = String(dtuNumber).trim();

    // 调用服务层（传入单个字符串）
    const yearlyRunData = await influxService.getTCPDtuYearlyRunData(validDtuNumber);

    // 返回结果
    sendResponse(res, 200, "查询成功", {
      dtuNumber: validDtuNumber, // 字符串格式
      totalCount: yearlyRunData.length,
      dataList: yearlyRunData,
    });
  } catch (error) {
    // 异常处理...
  }
};

/**
 * 批量查询多个DTU最新的TCP光伏【实时数据】
 * @route POST /api/pv/tcp/run/batch
 * @desc  批量查询多个设备的最新运行数据，传参格式：{dtuNumberList: ["860678073962930",...]}
 * @access  Public
 */
exports.getTCPBatchDtuLatestRealData = async (req, res) => {
  try {
    const { dtuNumberList, limit = 1 } = req.body;
    if (
      !dtuNumberList ||
      !Array.isArray(dtuNumberList) ||
      dtuNumberList.length === 0
    ) {
      return sendResponse(
        res,
        400,
        "请求参数错误：dtuNumberList必须是非空数组",
      );
    }
    const batchRunData = await influxService.getTCPBatchDtuLatestRealData({
      dtuNumberList,
      limit,
    });
    sendResponse(res, 200, "批量DTU最新TCP光伏实时数据查询成功", batchRunData);
  } catch (error) {
    console.error("[批量查询DTU实时数据失败]：", error.message);
    sendResponse(res, 500, `查询失败：${error.message}`, []);
  }
};

/**
 * 按照【日期】批量查询多个DTU最新的TCP光伏【实时数据】
 * @route POST /api/pv/tcp/real-data/day/batch
 * @desc  批量查询多个设备的最新运行数据，传参格式：{dtuNumberList: ["860678073962930",...]}
 * @access  Public
 */
exports.getTCPBatchDtuLatestRealDataOnDay = async (req, res) => {
  try {
    const { dtuNumberList, limit, startTime, endTime } = req.body;
    console.log("参数是：", dtuNumberList, limit, startTime, endTime, req.body);
    if (
      !dtuNumberList ||
      !Array.isArray(dtuNumberList) ||
      dtuNumberList.length === 0
    ) {
      return sendResponse(
        res,
        400,
        "请求参数错误：dtuNumberList必须是非空数组",
      );
    }
    const batchRunData = await influxService.getTCPBatchDtuLatestRealDataOnDay({
      dtuNumberList,
      limit,
      startTime,
      endTime,
    });
    sendResponse(res, 200, "批量DTU最新TCP光伏实时数据查询成功", batchRunData);
  } catch (error) {
    console.error("[批量查询DTU实时数据失败]：", error.message);
    sendResponse(res, 500, `查询失败：${error.message}`, []);
  }
};

/**
 * 批量查询多个DTU最新的TCP光伏【运行数据】
 * @route POST /api/pv/tcp/run/batch
 * @desc  批量查询多个设备的最新运行数据，传参格式：{dtuNumberList: ["860678073962930",...]}
 * @access  Public
 */
exports.getTCPBatchDtuLatestRunData = async (req, res) => {
  try {
    const { dtuNumberList, limit = 1 } = req.body;
    if (
      !dtuNumberList ||
      !Array.isArray(dtuNumberList) ||
      dtuNumberList.length === 0
    ) {
      return sendResponse(
        res,
        400,
        "请求参数错误：dtuNumberList必须是非空数组",
      );
    }
    const batchRunData = await influxService.getTCPBatchDtuLatestRunData({
      dtuNumberList,
      limit,
    });
    sendResponse(res, 200, "批量DTU最新TCP光伏运行数据查询成功", batchRunData);
  } catch (error) {
    console.error("[批量查询DTU运行数据失败]：", error.message);
    sendResponse(res, 500, `查询失败：${error.message}`, []);
  }
};

/**
 * 查询单个DTU设备指定时间范围的全量实时数据（适配折线图渲染）
 * @route POST /api/pv/tcp/real-data/single-day
 * @desc  根据dtuNumber+开始/结束时间查询全量实时数据，按时间排序，支持分页
 * @access  Public
 */
exports.getDtuDayFullData = async (req, res) => {
  try {
    const {
      dtuNumber,
      startTime, // 必填：开始时间（yyyy-MM-dd HH:mm:ss）
      endTime, // 必填：结束时间（yyyy-MM-dd HH:mm:ss）
      orderBy = "time asc",
      pageNum = 1,
      pageSize = 1000,
    } = req.body;

    // 2. 核心参数校验（严格匹配前端传参）
    if (!dtuNumber || !dtuNumber.toString().trim()) {
      return sendResponse(res, 400, "请求参数错误：缺少必填字段 dtuNumber");
    }
    if (
      !startTime ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(startTime)
    ) {
      return sendResponse(
        res,
        400,
        "请求参数错误：startTime格式必须为 yyyy-MM-dd HH:mm:ss",
      );
    }
    if (!endTime || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(endTime)) {
      return sendResponse(
        res,
        400,
        "请求参数错误：endTime格式必须为 yyyy-MM-dd HH:mm:ss",
      );
    }
    if (pageNum < 1) {
      return sendResponse(res, 400, "页码必须大于等于1");
    }
    if (pageSize < 1 || pageSize > 2000) {
      return sendResponse(res, 400, "页大小必须在1~2000之间");
    }

    // 3. 调用服务层方法查询数据（透传所有前端参数）
    const dayFullData = await influxService.queryDtuDayFullRealData({
      dtuNumber: dtuNumber.toString().trim(),
      startTime,
      endTime,
      orderBy,
    });

    console.log("全量查询结果是：", dayFullData);

    // 4. 处理分页（适配前端分页需求，折线图可传pageSize=2000一次性获取）
    const total = dayFullData.length;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = dayFullData.slice(startIndex, endIndex);

    // 5. 返回标准化响应（完全兼容前端接收格式）
    sendResponse(res, 200, "DTU设备指定时间范围全量实时数据查询成功", {
      list: pageData, // 分页后的数据列表（折线图直接用）
      pagination: {
        // 分页信息（前端按需使用）
        pageNum,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      queryParams: {
        // 返回查询参数，方便前端核对
        dtuNumber,
        startTime,
        endTime,
        orderBy,
      },
    });
  } catch (error) {
    console.log("[查询当日折现图数据失败]: ", error.message);
    sendResponse(res, 500, `查询失败: ${error.message}`, {
      list: [],
      pagination: { total: 0, pageNum: 1, pageSize: 1000 },
    });
  }
};

/**
 * 查询所有DTU设备指定日期的日发电量总和（InfluxDB端累加）
 * @route GET /api/pv/total-daily-generate-power
 * @desc  汇总所有DTU设备指定日期的日发电量（day_generate_power），返回wh/kwh两种单位
 * @access  Public
 */
exports.getAllDtuSingleDayGeneratePower = async (req, res) => {
  try {
    // 1. 从GET查询参数中获取日期（必填）
    const { startTime, endTime } = req.body;
    // 2. 严格参数校验
    // 校验日期是否存在
    if (
      !startTime ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(startTime)
    ) {
      return sendResponse(
        res,
        400,
        "请求参数错误：startTime格式必须为 yyyy-MM-dd HH:mm:ss",
      );
    }
    if (!endTime || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(endTime)) {
      return sendResponse(
        res,
        400,
        "请求参数错误：endTime格式必须为 yyyy-MM-dd HH:mm:ss",
      );
    }

    // 3. 调用服务层方法查询总发电量
    const totalPowerData = await influxService.getAllDtuSingleDayGeneratePower({
      startTime,
      endTime,
    });
    console.log("日发电总量查询结果是：", totalPowerData);
    // 4. 返回标准化响应（兼容现有接口规范）
    sendResponse(res, 200, "所有DTU设备日发电量总和查询成功", {
      ...totalPowerData,
      // 补充前端易读的字段说明
      desc: `所有DTU设备${startTime}-${endTime}日发电量总和`,
      unitDesc: {
        wh: "瓦时（基础单位）",
        kwh: "千瓦时（1kwh=1度电）",
      },
    });
  } catch (error) {
    console.error("[查询所有DTU日发电量总和失败]：", error.message);
    // 区分服务层参数错误和系统错误
    if (
      error.message.includes("查询参数缺失") ||
      error.message.includes("无效日期")
    ) {
      return sendResponse(res, 400, error.message);
    }
    sendResponse(
      res,
      500,
      `所有DTU设备日发电量总和查询失败：${error.message}`,
      {
        totalDailyGeneratePower: "0.00",
        totalDailyGeneratePowerKwh: "0.000",
        date: req.query.date || "日期格式发生未知错误",
      },
    );
  }
};
