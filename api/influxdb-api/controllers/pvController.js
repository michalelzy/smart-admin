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