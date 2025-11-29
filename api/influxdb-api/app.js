require('dotenv').config();
const express = require('express');
const cors = require('cors');
const influxService = require('./services/influxService');
const pvRoutes = require('./routes/pvRoutes');
// 创建 redis 服务
const redisService = require('./services/redisService');
// 启动 mqtt 服务
const mqttService = require('./services/mqttService');
// 创建 logger 服务实例
const fileLoggerService = require('./services/loggerService');

const config = require('./config/config');

// 2. 启动 mqtt 服务
mqttService.registerMessageHandler(async (payload, topic) => {

  console.log('\n=====================================');
  console.log(`[APP] Received a message on topic: ${topic}`);
  console.log(`[APP] Message Payload:`);
  console.log('[APP] 尝试调用接口处理 MQTT 消息，向数据库写入数据');
  try {
    const {device_id} = payload;
    console.log('device_id 是：',device_id)
    // 增加一个校验，确保 device_id 存在
    if (!device_id) {
      console.warn('[APP] 消息中缺少 device_id，已跳过处理。');
      return;
    }
    // 使用 Promise.all 并发写入 Redis 和 InfluxDB
    // 这样可以提高处理效率，两个操作同时进行
    await Promise.all([
      redisService.writeDeviceData(device_id, payload), // 调用 RedisService 的方法
      influxService.writePvData(payload), // 调用 influxDB 数据库写入
    ]);
    // 写入本地文件
    // fileLoggerService.write(payload).then(() => {
    //   console.log('[FileLogger] 成功写入文件！！')
    // })
    // .catch((err) => {
    //   console.error(`[FileLogger] 独立写入文件失败：${err.message}`);
    // })
    // 写入本地文件（使用回调函数）
    fileLoggerService.write(payload, (err) => {
    if (err) {
      console.error(`[FileLogger] 独立写入文件失败：${err.message}`);
    } else {
      console.log('[FileLogger] 成功写入文件！！');
    }
  });

    console.log(`✅ Successfully processed data for device: ${device_id}`);
    
  } catch (error) {
    console.error(`MQTT 消息处理失败: ${error.message}`);
    console.log('消息数据是',payload);
  }
  // console.log(JSON.stringify(payload, null, 2)); // 格式化打印 JSON 对象
  
  console.log('=====================================\n');
});
mqttService.start();

// 3. 手动启动Redis连接
async function startRedis() {
  try {
    await redisService.connect();
    console.log('Redis connection started.'); // 这行日志会在 connect 事件触发前打印
  } catch (err) {
    console.error('Failed to initiate Redis connection:', err);
  }
}
startRedis();

// 初始化 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors()); // 允许跨域请求（前端调用必备）
app.use(express.json()); // 解析 JSON 格式请求体
app.use(express.urlencoded({ extended: true })); // 解析表单格式请求体

// 路由配置
app.use('/api/pv', pvRoutes); // 光伏相关 API 前缀

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'pv-api-server',
    timestamp: new Date().toLocaleString()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `接口不存在：${req.method} ${req.path}`,
    timestamp: new Date().toLocaleString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误：', err.stack);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toLocaleString()
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器启动成功！运行在 http://localhost:${PORT}`);
  console.log(`API 前缀：/api/pv`);
});