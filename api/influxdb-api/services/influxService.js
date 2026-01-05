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
 * 【新增】写入光伏设备全量指标（适配 pv_device_metrics measurement）
 * @param {Object} data - 全量光伏设备指标数据
 * @returns {Promise<void>}
 */
async function writePvFullMetrics(data) {
  try {
    // ========== 1. 全量字段校验 ==========
    const requiredTags = ['device_id', 'station_id', 'device_type', 'manufacturer']; // 必传Tag
    const missingTags = requiredTags.filter(tag => !data[tag]);
    if (missingTags.length > 0) {
      throw new Error(`缺少必要标签字段：${missingTags.join(', ')}`);
    }

    // 数值字段校验（核心测量值）
    const numberFields = [
      'pv_input_voltage_1', 'pv_input_voltage_2', 'pv_input_voltage_3', 'pv_input_voltage_4',
      'module_output_current_1', 'module_output_current_2', 'module_output_current_3', 'module_output_current_4',
      'output_voltage', 'output_total_current', 'output_total_power', 'output_total_voltage',
      'load_voltage', 'load_current', 'load_power', 'battery_temperature',
      'internal_temperature', 'co2_emission_reduction', 'module_count', 'battery_capacity',
      'daily_generation', 'monthly_generation', 'total_generation'
    ];
    for (const field of numberFields) {
      // 允许部分字段为空，但若传值则必须是数字
      if (data[field] !== undefined && (typeof data[field] !== 'number' || isNaN(data[field]))) {
        throw new Error(`${field} 必须是有效的数字，当前值：${data[field]}`);
      }
    }

    // ========== 2. 时间戳处理 ==========
    const reportTimeNano = data.report_time 
      ? BigInt(data.report_time) * 1000000000n  // 秒级时间戳转纳秒
      : BigInt(Date.now()) * 10n; // 当前时间（毫秒转纳秒）

    // ========== 3. 构建全量数据点 ==========
    // 自定义 measurement 名称（替换为 pv_device_metrics，如需新建只需改这个字符串）
    const fullMeasurement = 'pv_device_metrics'; 
    const point = new Point(fullMeasurement)
      // ---------- Tag 部分（筛选维度，必须字符串） ----------
      .tag('device_id', data.device_id)
      .tag('station_id', data.station_id)
      .tag('device_type', data.device_type)
      .tag('manufacturer', data.manufacturer)
      // ---------- Field 部分（测量值，数值/字符串） ----------
      // 运行状态
      .stringField('work_status', data.work_status || 'online')
      // 光伏输入电压
      .floatField('pv_input_voltage_1', data.pv_input_voltage_1 || 0)
      .floatField('pv_input_voltage_2', data.pv_input_voltage_2 || 0)
      .floatField('pv_input_voltage_3', data.pv_input_voltage_3 || 0)
      .floatField('pv_input_voltage_4', data.pv_input_voltage_4 || 0)
      // 模组输出电流
      .floatField('module_output_current_1', data.module_output_current_1 || 0)
      .floatField('module_output_current_2', data.module_output_current_2 || 0)
      .floatField('module_output_current_3', data.module_output_current_3 || 0)
      .floatField('module_output_current_4', data.module_output_current_4 || 0)
      // 总输出
      .floatField('output_voltage', data.output_voltage || 0)
      .floatField('output_total_current', data.output_total_current || 0)
      .floatField('output_total_power', data.output_total_power || 0)
      .floatField('output_total_voltage', data.output_total_voltage || 0)
      // 负载
      .floatField('load_voltage', data.load_voltage || 0)
      .floatField('load_current', data.load_current || 0)
      .floatField('load_power', data.load_power || 0)
      // 温度
      .floatField('battery_temperature', data.battery_temperature || 0)
      .floatField('internal_temperature', data.internal_temperature || 0)
      // 环保指标
      .floatField('co2_emission_reduction', data.co2_emission_reduction || 0)
      // 故障
      .stringField('fault_code', data.fault_code || '')
      // 设备参数
      .intField('module_count', data.module_count || 0) // 整数类型
      .floatField('battery_capacity', data.battery_capacity || 0)
      .stringField('device_address', data.device_address || '未知地址')
      // 发电量
      .floatField('daily_generation', data.daily_generation || 0)
      .floatField('monthly_generation', data.monthly_generation || 0)
      .floatField('total_generation', data.total_generation || 0)
      // 时间戳
      .timestamp(reportTimeNano);

    // ========== 4. 写入 InfluxDB ==========
    writeApi.writePoint(point);
    await writeApi.flush(); // 强制刷新写入
    console.log(`[InfluxDB] 全量指标 - 设备 ${data.device_id} 数据写入成功（measurement：${fullMeasurement}）`);

  } catch (error) {
    console.error('[InfluxDB] 写入光伏全量指标失败：', error.message);
    throw new Error(`[InfluxDB] 全量指标写入失败：${error.message}`);
  }
}

/**
 * 【新增】查询 pv_device_metrics 全量指标数据
 * @param {Object} params - 查询参数
 * @param {string} [params.device_id] - 设备ID（可选，不传则查所有设备）
 * @param {string} [params.station_id] - 站点ID（可选，不传则查所有站点）
 * @param {string} [params.start] - 开始时间（如 "-24h" "-7d" "2024-12-01T00:00:00Z"，默认 "-24h"）
 * @param {string} [params.end] - 结束时间（默认 "now()"）
 * @param {Array<string>} [params.fields] - 要查询的字段列表（可选，不传则查所有字段，如 ["output_total_power", "daily_generation"]）
 * @param {boolean} [params.latestOnly] - 是否只查每个设备的最新一条数据（默认 false）
 * @returns {Promise<Array>} 全量指标查询结果
 */
async function queryPvFullMetrics(params = {}) {
  const {
    device_id,
    station_id,
    start = '-24h',
    end = 'now()',
    fields = [],
    latestOnly = false
  } = params;

  // const { device_id, station_id, start = '-24h', end = 'now()' , latestOnly} = params;

  // 1. 构建过滤条件
  let filterConditions = [`r._measurement == "pv_device_metrics"`];
  if (device_id) filterConditions.push(`r.device_id == "${device_id}"`);
  if (station_id) filterConditions.push(`r.station_id == "${station_id}"`);
  const filterStr = filterConditions.join(' and ');

  // 2. 构建字段筛选（可选：只查指定字段）
  let fieldFilter = '';
  if (fields.length > 0) {
    const fieldStr = fields.map(f => `"${f}"`).join(',');
    fieldFilter = `|> filter(fn: (r) => contains(value: r._field, set: [${fieldStr}]))`;
  }

//   let fluxQuery = `
//   from(bucket: "${bucket}")
   
//     |> range(start: ${start}, stop: ${end})
  
//     |> filter(fn: (r) => ${filterStr})
   
//     ${fieldFilter}
  
//     |> keep(columns: ["_time", "_field", "_value", "device_id", "station_id", "device_type", "manufacturer"])
   
//     |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
 
//     |> sort(columns: ["_time"], desc: true)
// `;
  let fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      // |> filter(fn: (r) => r._measurement == "pv_device_metrics" and r.device_id == "${device_id}")
      |> filter(fn: (r) => ${filterStr})
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value") 
  `;

  // 4. 若只查最新一条数据，添加 last() 
  if (latestOnly) {
    fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      // |> filter(fn: (r) => r._measurement == "pv_device_metrics" and r.device_id == "${device_id}")
      |> filter(fn: (r) => ${filterStr})
      |> last()
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value") 
  `;
  }

  console.log(`[InfluxDB] 执行 Flux 查询：\n${fluxQuery}`);

  // 5. 执行查询并格式化结果
  return new Promise((resolve, reject) => {
    const result = [];
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        // 格式化返回结果（适配全量指标字段）
        const formattedItem = {
          // 基础维度
          time: new Date(item._time).toLocaleString(),
          device_id: item.device_id || '未知设备',
          station_id: item.station_id || '未知站点',
          device_type: item.device_type || '未知类型',
          manufacturer: item.manufacturer || '未知厂商',
          
          // 运行状态
          work_status: item.work_status || '未知状态',
          fault_code: item.fault_code || '无故障',
          
          // 光伏输入电压（保留2位小数）
          pv_input_voltage_1: item.pv_input_voltage_1 ? parseFloat(item.pv_input_voltage_1).toFixed(2) : '0.00',
          pv_input_voltage_2: item.pv_input_voltage_2 ? parseFloat(item.pv_input_voltage_2).toFixed(2) : '0.00',
          pv_input_voltage_3: item.pv_input_voltage_3 ? parseFloat(item.pv_input_voltage_3).toFixed(2) : '0.00',
          pv_input_voltage_4: item.pv_input_voltage_4 ? parseFloat(item.pv_input_voltage_4).toFixed(2) : '0.00',
          
          // 模组输出电流
          module_output_current_1: item.module_output_current_1 ? parseFloat(item.module_output_current_1).toFixed(2) : '0.00',
          module_output_current_2: item.module_output_current_2 ? parseFloat(item.module_output_current_2).toFixed(2) : '0.00',
          module_output_current_3: item.module_output_current_3 ? parseFloat(item.module_output_current_3).toFixed(2) : '0.00',
          module_output_current_4: item.module_output_current_4 ? parseFloat(item.module_output_current_4).toFixed(2) : '0.00',
          
          // 总输出
          output_voltage: item.output_voltage ? parseFloat(item.output_voltage).toFixed(2) : '0.00',
          output_total_current: item.output_total_current ? parseFloat(item.output_total_current).toFixed(2) : '0.00',
          output_total_power: item.output_total_power ? parseFloat(item.output_total_power).toFixed(2) : '0.00',
          output_total_voltage: item.output_total_voltage ? parseFloat(item.output_total_voltage).toFixed(2) : '0.00',
          
          // 负载
          load_voltage: item.load_voltage ? parseFloat(item.load_voltage).toFixed(2) : '0.00',
          load_current: item.load_current ? parseFloat(item.load_current).toFixed(2) : '0.00',
          load_power: item.load_power ? parseFloat(item.load_power).toFixed(2) : '0.00',
          
          // 温度
          battery_temperature: item.battery_temperature ? parseFloat(item.battery_temperature).toFixed(2) : '0.00',
          internal_temperature: item.internal_temperature ? parseFloat(item.internal_temperature).toFixed(2) : '0.00',
          
          // 环保指标
          co2_emission_reduction: item.co2_emission_reduction ? parseFloat(item.co2_emission_reduction).toFixed(2) : '0.00',
          
          // 设备参数
          module_count: item.module_count || 0,
          battery_capacity: item.battery_capacity ? parseFloat(item.battery_capacity).toFixed(2) : '0.00',
          device_address: item.device_address || '未知地址',
          
          // 发电量
          daily_generation: item.daily_generation ? parseFloat(item.daily_generation).toFixed(2) : '0.00',
          monthly_generation: item.monthly_generation ? parseFloat(item.monthly_generation).toFixed(2) : '0.00',
          total_generation: item.total_generation ? parseFloat(item.total_generation).toFixed(2) : '0.00'
        };
        result.push(formattedItem);
      },
      error: (err) => {
        console.error('[InfluxDB] 全量指标查询失败：', err);
        reject(new Error(`全量指标查询失败：${err.message}`));
      },
      complete: () => {
        // 若只查最新数据，去重（每个设备只保留一条）
        const finalResult = latestOnly 
          ? result.reduce((acc, curr) => {
              if (!acc.some(item => item.device_id === curr.device_id)) {
                acc.push(curr);
              }
              return acc;
            }, [])
          : result;
        resolve(finalResult);
      }
    });
  });
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

  console.log(`[InfluxDB] 执行 Flux 查询：\n${fluxQuery}`);

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

  /**
 * 批量查询DTU最新实时状态（纯数据操作，无HTTP依赖）
 * @param {Object} params - 查询参数
 * @param {Array<string>} params.dtuNumberList - DTU序列号列表
 * @param {number} [params.limit=1] - 每个DTU返回最新条数
 * @param {string} [params.start="-1d"] - 时间范围开始
 * @param {string} [params.end="now()"] - 时间范围结束
 * @returns {Promise<Array>} DTU状态列表
 */
async function getBatchDtuLatestData(params = {}) {
  const { dtuNumberList, limit = 1, start = '-1d', end = 'now()' } = params;
  
  // 纯数据校验，不返回HTTP状态码
  if (!dtuNumberList || !Array.isArray(dtuNumberList) || dtuNumberList.length === 0) {
    console.warn('[InfluxDB] dtuNumberList必须是非空数组');
    return [];
  }

  const dtuStrArray = dtuNumberList.map(dtu => `"${dtu}"`).join(',');

  //  const fluxQuery = `
  //   from(bucket: "${bucket}")
  //     |> range(start: ${start}, stop: ${end})
  //     |> filter(fn: (r) => (r._measurement == "pv_device_metrics" or r._measurement == "${measurement}") and r.device_id in [${dtuNumberStr}])
  //     |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  //     |> group(columns: ["device_id"])
  //     |> sort(columns: ["_time"], desc: true)
  //     |> limit(n: ${limit}, offset: 0)
  //     |> keep(columns: ["device_id", "_time", "pv_power", "device_status", "output_voltage", "output_total_power"])
  // `.trim();

  // const dtuList = [860678074035413, 860678074080112];
  // const dtuStrArray = dtuList.map(dtu => `"${dtu}"`).join(',');

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "${measurement}")
      |> filter(fn: (r) => contains(value:r.device_id, set: [${dtuStrArray}]))
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> group(columns: ["device_id"]) // 按设备分组
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: 1, offset: 0) // 只取最新1条
      
  `;

  console.log(`[InfluxDB] 执行批量DTU查询：\n${fluxQuery}`);

  // 执行查询并格式化结果
  return new Promise((resolve) => {
    const dtuStatusMap = new Map();
    
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const item = tableMeta.toObject(row);
        const dtuNumber = item.device_id;
        // 仅保留每个DTU最新一条数据
        if (dtuNumber && !dtuStatusMap.has(dtuNumber)) {
          dtuStatusMap.set(dtuNumber, {
            time: new Date(item._time).toLocaleString(), // 格式化时间
          dtuNumber: dtuNumber,
          gateway_id: item.gateway_id,
          region_code: item.region_code,
          device_status: item.device_status,
          pv_power: item.pv_power ? item.pv_power.toFixed(2) : 0, // 保留2位小数
          pv_voltage: item.pv_voltage ? item.pv_voltage.toFixed(2) : 0,
          output_voltage: item.output_voltage ? item.output_voltage.toFixed(2) : 0,
          output_current: item.output_current ? item.output_current.toFixed(2) : 0,
          dc_meter_power: item.dc_meter_power ? item.dc_meter_power.toFixed(2) : 0
          });
        }

        console.log('[**]',dtuStatusMap)
      },
      error: (err) => {
        console.error('[InfluxDB] 批量DTU查询失败：', err.message);
        // 错误时返回默认值数组（纯数据）
       const defaultResult = dtuNumberList.map(dtuNumber => ({
          dtuNumber: dtuNumber,
          time: '',
          gateway_id: '',
          region_code: '',
          device_status: '未知',
          pv_power: '0.00',
          pv_voltage: '0.00',
          output_voltage: '0.00',
          output_current: '0.00',
          dc_meter_power: '0.00'
        }));
        resolve(defaultResult);
      },
      complete: () => {
        const finalResult = dtuNumberList.map(dtuNumber => {
          const dtuStr = String(dtuNumber);//将数字转换成字符类型
          console.log('[complete] 转换后的dtuStr:', dtuStr, '是否存在:', dtuStatusMap.has(dtuStr)); // 打印匹配结果
          return dtuStatusMap.get(dtuStr) || {
            dtuNumber: dtuNumber,
            time: '',
            gateway_id: '',
            region_code: '',
            device_status: '未知',
            pv_power: '0.00',
            pv_voltage: '0.00',
            output_voltage: '0.00',
            output_current: '0.00',
            dc_meter_power: '0.00'
          };
        });
        resolve(finalResult);
      }
    });
  });
}

// 导出服务方法
module.exports = {
  writePvData,
  writePvFullMetrics,
  queryDeviceHistory,
  queryPvFullMetrics,
  statsRegionPvData,
  queryAllDevicesLatestStatus,
  getBatchDtuLatestData
};