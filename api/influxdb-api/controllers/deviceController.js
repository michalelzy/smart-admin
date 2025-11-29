const redisService = require('../services/redisService');
const influxService = require('../services/influxService'); // 假设你也有 InfluxDB 的服务

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

module.exports = {
  getDeviceLatestData,
  getDeviceHistory
};