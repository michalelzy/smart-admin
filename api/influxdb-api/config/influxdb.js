require('dotenv').config();
const { InfluxDB } = require('@influxdata/influxdb-client');

// 验证必要配置
const requiredEnv = [
  'INFLUX_URL', 'INFLUX_TOKEN', 'INFLUX_ORG', 'INFLUX_BUCKET', 'INFLUX_MEASUREMENT'
];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  throw new Error(`缺少 InfluxDB 配置：${missingEnv.join(', ')}`);
}

// 创建 InfluxDB 客户端实例（全局唯一）
const influxDB = new InfluxDB({
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN
});

// 导出核心对象（写入API、查询API、配置）
module.exports = {
  influxDB,
  writeApi: influxDB.getWriteApi(
    process.env.INFLUX_ORG,
    process.env.INFLUX_BUCKET
  ),
  queryApi: influxDB.getQueryApi(process.env.INFLUX_ORG),
  bucket: process.env.INFLUX_BUCKET,
  measurement: process.env.INFLUX_MEASUREMENT,
  org: process.env.INFLUX_ORG
};