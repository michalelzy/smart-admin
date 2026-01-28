const { InfluxDB } = require('@influxdata/influxdb-client');

const influxConfig = {
  url: 'http://118.195.242.95:8086',
  token: 'Bta9VIoJNvcXCS2WjX5C4JHUy7tMtogpFlTCOk4aIKYnhTZ5R0t6C9b08c6l75Yp0xtBlZIRSI3S1gw0lKmOlQ==',
  org: 'pv-org',
  bucket: 'pv-power-data'
};

const influxDB = new InfluxDB(influxConfig);
// 尝试获取查询客户端，无报错则连接成功
const queryApi = influxDB.getQueryApi(influxConfig.org);
console.log('InfluxDB连接成功！');