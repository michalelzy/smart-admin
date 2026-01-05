const redisService = require('../services/redisService');
const influxService = require('../services/influxService'); // 假设你也有 InfluxDB 的服务


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
 * @desc    获取设备的最新状态
 * @route   GET /api/devices/:deviceId/latest
 * @access  Public
 */
const getDeviceLatestData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // 尝试从 Redis 获取最新数据
    const data = await redisService.getLatestDeviceData(deviceId);

    if (!data) {
      return res.status(404).json({ message: 'Device not found or no data available' });
    }

    res.status(200).json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * @desc    获取设备的历史数据
 * @route   GET /api/devices/:deviceId/history
 * @access  Public
 */
const getDeviceHistory = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { start, end, count } = req.query; // 从 URL 查询参数获取时间范围和数量
    
    // 调用 Redis Service 获取历史数据
    // 注意：需要对查询参数进行类型转换和默认值处理
    const history = await redisService.getDeviceHistoryData(
      deviceId,
      start ? parseInt(start, 10) : undefined,
      end ? parseInt(end, 10) : undefined,
      count ? parseInt(count, 10) : 100
    );

    res.status(200).json(history);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ===========================获取批量DTU最新数据===========================
/**
 * 批量查询DTU最新实时状态（适配前端传参：dtuNumberList + limit）
 * @param {*} req 前端请求：{ dtuNumberList: ['860678074049117',...], limit: 1 }
 * @param {*} res 响应：返回数组格式的DTU状态数据
 */
const getBatchDtuLatestData = async (req, res) => {
  try {
    const data = req.body || {};
    console.log('data is', data);
    // 1. 接收并校验HTTP请求参数（Controller层核心职责）
    const { dtuNumberList, limit = 1, start, end } = req.body;
    console.log('dtuNumber is',dtuNumberList);
   
    
    // 2. 调用Service层获取纯数据（无HTTP依赖）
    const result = await influxService.getBatchDtuLatestData({
      dtuNumberList,
      limit,
      start: start,
      end: 'now()'
    });

    // 3. 构造标准化HTTP响应
    res.status(200).json({
      code: 200,
      msg: '批量查询DTU最新状态成功',
      data: result // Service返回的纯数组数据，保证前端可forEach
    });
    // sendResponse(res, 200, '查询成功', result);

  } catch (error) {
    console.error('[Controller] 批量查询DTU失败：', error.message);
    // 统一错误响应格式，兜底空数组
    sendResponse(res, 500, error.message);
  }
};

module.exports = {
  getDeviceLatestData,
  getDeviceHistory,
  getBatchDtuLatestData
};