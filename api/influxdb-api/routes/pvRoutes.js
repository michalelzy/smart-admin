const express = require('express');
const router = express.Router();
const pvController = require('../controllers/pvController');
const deviceController = require('../controllers/deviceController');

/**
 * api接口的前缀是 /pv/api，拼上这里的url可以调用不同接口
 */

// 1. 写入光伏数据（POST）
router.post('/data/write', pvController.writePvData);

// 2. 查询设备历史数据（GET）
router.get('/data/history', pvController.queryDeviceHistory);

// 3. 统计区域数据（GET）
router.get('/stats/region', pvController.statsRegionPvData);

// 4. 查询所有设备最新状态（GET）。
router.get('/devices/latest', pvController.queryAllDevicesLatestStatus);

// 5. 写入光伏全量数据（POST）
router.post('/data/full-data-write',pvController.writePvFullData);

// 6. 查询全量数据
router.get('/data/full-data-history',pvController.queryPvFullMetrics);

// 7. 查询{指定设备}全量数据
router.get('/devices/full-data-history',pvController.queryDeviceLatestFullMetrics);

// 5. 获取指定设备（GET）的状态
// @route   GET /api/pv/devices/:deviceId/latest
// @desc    获取指定设备的最新数据
// @access  Public (你可以根据需要改为 Private)
// Method: GET
// URL: http://localhost:3000/api/pv/PV-007/latest
// Send
router.get('/:deviceId/latest', deviceController.getDeviceLatestData);

// 6. 获取指定设备的历史数据
// Method: GET
// URL: http://localhost:3000/api/pv/PV-007/history
// Send
// @route   GET /api/pv/:deviceId/history
// @desc    获取指定设备的历史数据
// @access  Public (你可以根据需要改为 Private)
router.get('/:deviceId/history', deviceController.getDeviceHistory);

module.exports = router;