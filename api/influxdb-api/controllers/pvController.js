const influxService = require('../services/influxService');

// 统一响应格式
const sendResponse = (res, code, message, data = null) => {
  res.status(code).json({
    code,
    message,
    data,
    timestamp: new Date().toLocaleString()
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
    sendResponse(res, 200, '数据写入成功');
  } catch (error) {
    console.error('API 写入数据失败: ', error.message);
    if (error.message.includes('缺少必要字段') || error.message.includes('格式不正确')) {
      return sendResponse(res, 400, error.message);
    };
    sendResponse(res, 500, error.message);
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
    sendResponse(res, 200, '数据写入成功');
  } catch (error) {
    console.error('API 写入数据失败: ', error.message);
    if (error.message.includes('缺少必要字段') || error.message.includes('格式不正确')) {
      return sendResponse(res, 400, error.message);
    };
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
      return sendResponse(res, 400, '缺少参数：device_id');
    }

    const data = await influxService.queryDeviceHistory({ device_id, start, end });
    sendResponse(res, 200, '查询成功', data);
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
    sendResponse(res, 200, '统计成功', stats);
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
      message: '从 InfluxDB 查询所有设备最新状态成功',
      data: result,
      timestamp: new Date().toLocaleString()
    });

  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
      data: null,
      timestamp: new Date().toLocaleString()
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
      device_id,        // 设备ID（可选）
      station_id,       // 站点ID（可选）
      start = '-24h',   // 开始时间（默认近24小时）
      end = 'now()',    // 结束时间（默认当前时间）
      fields = [],      // 指定查询字段（可选，数组格式）
      latestOnly = false, // 是否只查最新数据（默认否）
      pageNum = 1,      // 页码（默认1）
      pageSize = 10     // 页大小（默认10）
    } = req.body;

    // 基础参数校验
    if (pageNum < 1) {
      return sendResponse(res, 400, '页码必须大于等于1');
    }
    if (pageSize < 1 || pageSize > 100) {
      return sendResponse(res, 400, '页大小必须在1~100之间');
    }

    // 调用服务层方法
    const fullData = await influxService.queryPvFullMetrics({
      device_id,
      station_id,
      start,
      end,
      fields,
      latestOnly
    });

    // 处理分页（内存分页，适配前端分页需求）
    const total = fullData.length;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = fullData.slice(startIndex, endIndex);

    // 返回标准化结果（复用你的 sendResponse 方法）
    sendResponse(res, 200, '全量指标查询成功', {
      list: pageData,    // 分页后的数据列表
      pagination: {      // 分页信息
        pageNum,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error) {
    console.error('全量指标查询失败:', error);
    // 区分参数错误和服务器错误
    if (error.message.includes('缺少必要字段') || error.message.includes('格式不正确')) {
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
    const { device_id, latestOnly: latestOnlyStr , start: startStr, end: endStr } = req.query;
    
    // 1. 必传参数校验
    if (!device_id) {
      return sendResponse(res, 400, '缺少参数：device_id');
    }

    // 2. 修复核心：将字符串类型的 latestOnly 转为布尔类型
    let latestOnly = false; // 默认 false
    if (latestOnlyStr) {
      // 兼容 "true"/"1"/"false"/"0" 等常见传值
      latestOnly = latestOnlyStr.toLowerCase() === 'true' || latestOnlyStr === '1';
    }

    // 3. 修复 start/end：传空时用 undefined，让服务层默认值生效
    const start = startStr || undefined; // 空字符串 → undefined
    const end = endStr || undefined;

    console.log('处理后的参数：', { device_id, latestOnly, start, end }); // 打印验证

    // 4. 调用服务层（此时 latestOnly 是布尔类型）
    const latestData = await influxService.queryPvFullMetrics({
      device_id,
      latestOnly, // 传布尔值：true/false
      start, 
      end,
    });

    // 返回结果（取第一条，无数据则返回空对象）
    sendResponse(res, 200, '设备最新全量指标查询成功', latestData[0] || {});

  } catch (error) {
    console.error('设备最新全量指标查询失败:', error);
    sendResponse(res, 500, `查询失败：${error.message}`);
  }
};