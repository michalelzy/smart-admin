const { createClient } = require('redis');
const config = require('../config/config');

class RedisService {
  constructor() {
    // 1. 从配置文件读取 Redis URL
    this.redisUrl = config.redis.url;
    //
    this.isConnected = false;
    
    // 2. 创建 Redis 客户端实例
    this.client = createClient({ url: this.redisUrl });

    // 3. 注册事件监听器
    this.client.on('connect', () => {
      console.log('Redis Client connected successfully');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('Redis Client connection closed');
      this.isConnected = false;
    });
  }
   /**
   * 启动 Redis 连接
   */
  async connect() {
    if (!this.client.isOpen) {
      try {
        await this.client.connect();
        console.log('Redis connection initiated.');
      } catch (err) {
        console.error('Failed to initiate Redis connection:', err);
        throw err; // 将错误向上抛出，让调用者处理
      }
    }
  }

  /**
   * 关闭 Redis 连接
   */
  async disconnect() {
    if (this.client.isOpen) {
      await this.client.quit();
      console.log('Redis connection disconnected.');
    }
  }

  /**
   * 获取 Redis 客户端实例
   * @returns {RedisClientType}
   */
  getClient() {
    if (!this.client) {
      throw new Error('Redis client has not been initialized.');
    }
    return this.client;
  }

  /**
   * 将光伏设备数据写入 Redis
   * @param {string} deviceId - 设备 ID
   * @param {object} data - 包含设备数据的对象
   */
  async writeDeviceData(deviceId, data) {
    if (!this.isConnected) {
      // 如果连接未建立，则尝试连接
      await this.connect();
    }

    try {
      // 1. 使用 Hash 结构存储设备的最新数据
      const latestDataKey = `pv:data:${deviceId}`;
      await this.client.hSet(latestDataKey, 'latest', JSON.stringify(data));
      const timestamp = Number(data.report_time);
      
      // 2. 使用 Sorted Set 存储设备的历史数据，便于按时间范围查询
      const historyKey = `pv:history:${deviceId}`;
      // 使用毫秒级时间戳作为 score
      const timestampMs = timestamp * 1000;
      await this.client.zAdd(historyKey, { 
        score: timestampMs, 
        value: JSON.stringify(data) 
      });

      // (可选) 为历史数据设置过期时间，例如保留 30 天
      // await this.client.expire(historyKey, 30 * 24 * 60 * 60); // 单位：秒

      console.log(`🔄 [Redis] 写入数据成功！！ Wrote data for device: ${deviceId}`);

    } catch (error) {
      console.error(`❌ [Redis] Error writing data for device ${deviceId}:`, error);
      throw error; // 向上抛出错误，让调用者（如 app.js）决定如何处理
    }
  }

   /**
   * 获取指定设备的最新数据
   * @param {string} deviceId - 设备 ID
   * @returns {Promise<object|null>} - 解析后的设备数据对象，如果不存在则返回 null
   */
  async getLatestDeviceData(deviceId) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const latestDataKey = `pv:data:${deviceId}`;
      // 从 Hash 中获取 'latest' 字段的值
      const dataStr = await this.client.hGet(latestDataKey, 'latest');
      
      // 如果获取到数据，则解析为 JSON 对象，否则返回 null
      return dataStr ? JSON.parse(dataStr) : null;

    } catch (error) {
      console.error(`❌ [Redis] Error getting latest data for device ${deviceId}:`, error);
      throw error; // 向上抛出错误，让调用者处理
    }
  }

  /**
   * 获取指定设备在某个时间范围内的历史数据
   * @param {string} deviceId - 设备 ID
   * @param {number} [startTimestamp] - 开始时间戳（秒级），默认为 0
   * @param {number} [endTimestamp] - 结束时间戳（秒级），默认为当前时间
   * @param {number} [count] - 返回数据的最大条数，用于分页
   * @returns {Promise<Array<object>>} - 包含解析后的数据对象的数组
   */
  async getDeviceHistoryData(deviceId, startTimestamp = 0, endTimestamp = Date.now() / 1000, count = 100) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const historyKey = `pv:history:${deviceId}`;
      
      // 将秒级时间戳转换为毫秒级，以匹配我们存储时的格式
      const startScore = startTimestamp * 1000;
      const endScore = endTimestamp * 1000;

      // 使用 ZRANGEBYSCORE 命令获取指定分数范围内的成员
      // WITHSCORES: 同时返回成员和其分数
      // LIMIT 0, count: 限制返回结果的数量，用于分页
      const rawData = await this.client.zRangeByScore(
        historyKey,
        startScore,
        endScore,
        {
          BYSCORE: true,
          WITHSCORES: true,
          LIMIT: { offset: 0, count: count }
        }
      );

      // rawData 的格式是 [member1, score1, member2, score2, ...]
      // 我们需要将其转换为 [{ data: ..., timestamp: ... }, ...] 的格式
      const history = [];
      for (let i = 0; i < rawData.length; i += 2) {
        const dataStr = rawData[i];
        const score = parseInt(rawData[i + 1], 10); // score 是字符串，需要转为数字
        
        history.push({
          data: JSON.parse(dataStr),
          timestamp: score / 1000 // 将毫秒级时间戳转回秒级
        });
      }

      return history;

    } catch (error) {
      console.error(`❌ [Redis] Error getting history data for device ${deviceId}:`, error);
      throw error;
    }
  }
}

// 导出一个单例实例
const redisService = new RedisService();
module.exports = redisService;