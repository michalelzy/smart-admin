// config.js
module.exports = {
    // MQTT 配置
    mqtt: {
        brokerUrl: 'mqtt://localhost:1883',
        topics: [
            'pv/devices/data',
            'pv/devices-001/data',
            'pv/devices-002/data',
            'pv/devices-003/data',
        ],
        clientId: 'tanxi001',
    },

    // InfluxDB 配置
    influxdb: {
        url: 'http://localhost:8086',
        token: 'YOUR_INFLUXDB_TOKEN',
        org: 'YOUR_ORG',
        bucket: 'pv_power_data',
        measurement: 'pv_device_status',
    },

    // Redis 配置
    redis: {
        url: 'redis://localhost:6379',
        queueKey: 'pv:data:queue',
    },

    // 定时任务配置 (多久执行一次批量写入)
    // 格式: '秒 分 时 日 月 周'
    batchWriteCron: '*/1 * * * *', // 每1分钟
};