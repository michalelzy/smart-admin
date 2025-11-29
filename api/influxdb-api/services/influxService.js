const { Point } = require('@influxdata/influxdb-client');
const { writeApi, queryApi, measurement, bucket, org } = require('../config/influxdb');

/**
 * 数据校验函数
 * @param {Object} data - 待校验的数据
 * @returns {string|null} - 错误信息或null
 */
function validateData(data) {
  // 检查必填字段
  const requiredFields = ['device_id', 'gateway_id', 'device_status', 'pv_power', 'pv_voltage', 'output_voltage', 'output_current', 'dc_meter_power'];
  const missingFields = requiredFields.filter(field => data[field] === undefined);
  
  if (missingFields.length > 0) {
    return `缺少必要字段：${missingFields.join(', ')}`;
  }
  
  // 检查数值类型
  const numberFields = ['pv_power', 'pv_voltage', 'output_voltage', 'output_current', 'dc_meter_power'];
  for (const field of numberFields) {
    if (typeof data[field] !== 'number' || isNaN(data[field])) {
      return `${field} 必须是有效的数字，当前值：${data[field]}`;
    }
  }
  
  // 检查时间戳格式
  if (data.report_time && (typeof data.report_time !== 'number' || data.report_time < 1000000000 || data.report_time > 9999999999)) {
    return `report_time 格式不正确，应为秒级时间戳`;
  }
  
  return null;
}


// 初始化写入API配置
// writeApi.enableGzip(); // 启用压缩
writeApi.useDefaultTags({ system: 'pv-power-management' }); // 全局默认标签

/**
 * 写入单条光伏数据
 * @param {Object} data - 光伏设备数据
 * @returns {Promise<void>}
 */
async function writePvData(data) {
  try {

    // 数据校验
    const validationError = validateData(data);
    if (validationError) {
      throw new Error(validationError);
    }

    // 时间戳处理
    const reportTimeNano = data.report_time 
      ? BigInt(data.report_time) * 1000000000n 
      : BigInt(Date.now()) * 10n; 

    // const reportTimeSeconds = data.report_time;
    // const reportTimeNano = BigInt(reportTimeSeconds)*BigInt(1000000000);
    // 构建 InfluxDB 数据点
    const point = new Point(measurement)
      .tag('device_id', data.device_id)
      .tag('gateway_id', data.gateway_id)
      .tag('region_code', data.region_code || '未知区域')
      .tag('device_status', data.device_status.toString()) // Tag 必须是字符串
      .floatField('pv_power', data.pv_power)
      .floatField('pv_voltage', data.pv_voltage)
      .floatField('output_voltage', data.output_voltage)
      .floatField('output_current', data.output_current)
      .floatField('dc_meter_power', data.dc_meter_power)
      // 时间戳：优先用设备上报时间，否则用当前时间（毫秒级转纳秒级）
      .timestamp(reportTimeNano);
    // 写入队列（自动批量刷新，默认1秒/1000条）
    writeApi.writePoint(point);
    await writeApi.flush(); // 强制刷新（确保数据写入）
    console.log(`[InfluxDB] 设备 ${data.device_id} 数据写入成功`);
  } catch (error) {
    console.error('[InfluxDB] 写入光伏数据失败：', error.message);
    throw new Error(`[InfluxDB] 数据写入失败：${error.message}`);
  }
}

/**
 * 查询指定设备的历史数据（按时间范围）
 * @param {Object} params - 查询参数
 * @param {string} params.device_id - 设备ID
 * @param {string} params.start - 开始时间（如 "-24h" "-7d"）
 * @param {string} params.end - 结束时间（默认当前时间）
 * @returns {Promise<Array>} 查询结果
 */
async function queryDeviceHistory(params) {
  const { device_id, start = '-24h', end = 'now()' } = params;
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => r.device_id == "${device_id}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> sort(columns: ["_time"])
  `;

  return new Promise((resolve, reject) => {
    const result = [];
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        result.push({
          time: new Date(item._time).toLocaleString(), // 格式化时间
          device_id: item.device_id,
          gateway_id: item.gateway_id,
          region_code: item.region_code,
          device_status: item.device_status,
          pv_power: item.pv_power ? item.pv_power.toFixed(2) : 0, // 保留2位小数
          pv_voltage: item.pv_voltage ? item.pv_voltage.toFixed(2) : 0,
          output_voltage: item.output_voltage ? item.output_voltage.toFixed(2) : 0,
          output_current: item.output_current ? item.output_current.toFixed(2) : 0,
          dc_meter_power: item.dc_meter_power ? item.dc_meter_power.toFixed(2) : 0
        });
      },
      error: (err) => reject(new Error(`查询失败：${err.message}`)),
      complete: () => resolve(result)
    });
  });
}

/**
 * 统计指定区域的设备数据（总功率、设备数、告警数）
 * @param {string} region_code - 区域编码（如 "华东-01"，默认所有区域）
 * @returns {Promise<Object>} 统计结果
 */
async function statsRegionPvData(region_code = '') {
  const regionFilter = region_code ? `and r.region_code == "${region_code}"` : '';
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h) // 近1小时最新数据
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => ${regionFilter})
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> last() // 取每个设备最新数据
      |> group()
      |> reduce(
        fn: (r, accumulator) => ({
          total_devices: accumulator.total_devices + 1,
          alarm_devices: r.device_status == "1" ? accumulator.alarm_devices + 1 : accumulator.alarm_devices,
          total_pv_power: accumulator.total_pv_power + (r.pv_power || 0)
        }),
        identity: { total_devices: 0, alarm_devices: 0, total_pv_power: 0.0 }
      )
  `;

  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const stats = tableMeta.toObject(row);
        resolve({
          region_code: region_code || '所有区域',
          total_devices: stats.total_devices,
          alarm_devices: stats.alarm_devices,
          total_pv_power: stats.total_pv_power.toFixed(2) + 'kW',
          update_time: new Date().toLocaleString()
        });
      },
      error: (err) => reject(new Error(`统计失败：${err.message}`)),
      complete: () => resolve({ total_devices: 0, alarm_devices: 0, total_pv_power: '0.00kW' })
    });
  });
}

/**
   * 查询所有设备的最新状态 (使用正确的 Flux 查询)
   * @returns {Promise<Array>} 设备最新状态列表
   */
  async function queryAllDevicesLatestStatus() {
    const fluxQuery = `
        from(bucket: "${bucket}")
            |> range(start: -2d)
            |> filter(fn: (r) => r._measurement == "${measurement}")
            |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> group(columns: ["device_id"])
    `;

    return new Promise((resolve, reject) => {
      const result = [];
      queryApi.queryRows(fluxQuery, {
        next(row, tableMeta) {
          //tableMeta.toObject(row): 将原始的、结构化程度较低的 row 数据转换成一个易于操作的 JavaScript 对象 item。这个 item 对象就代表了一条设备的完整数据记录（例如，包含 device_id, pv_power, _time 等字段）。
          const item = tableMeta.toObject(row);
          // 在这里可以对数据进行格式化
          // console.log('完整的 item 对象：', JSON.stringify(item,null,2));
          
          /**
           * result.push(...) 是 “储水桶”，把每次接的水（格式化后的一行数据）倒进桶里；
             complete 回调是 “水放完了”，此时桶里已经装满了所有的水（完整数据列表），可以把桶交给前端。
           */
          result.push({
            device_id: item.device_id,
            gateway_id: item.gateway_id || '无数据',
            region_code: item.region_code || '无数据',
            device_status: item.device_status,
            status_text: item.device_status == '0' ? '正常' : '告警',
            latest_pv_power: item.pv_power ? parseFloat(item.pv_power).toFixed(2) + ' kW' : '无数据',
            latest_pv_voltage: item.pv_voltage ? parseFloat(item.pv_voltage).toFixed(2) + ' V' : '无数据',
            update_time: new Date(item._time).toLocaleString()
          });
        },
        error: (err) => {
          console.error('InfluxDB query error:', err);
          reject(new Error(`查询失败：${err.message}`));
        },
        complete: () => resolve(result)
      });
    });
  }

// 导出服务方法
module.exports = {
  writePvData,
  queryDeviceHistory,
  statsRegionPvData,
  queryAllDevicesLatestStatus
};