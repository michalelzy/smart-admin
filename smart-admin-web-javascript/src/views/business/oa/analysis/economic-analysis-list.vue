<template>
    <div class="dashboard-page">
        <!-- 顶部数据卡片区域 -->
        <div class="top-cards">
            <!-- GMV卡片 -->
            <a-card class="stat-card" hoverable>
                <div class="card-header">
                    <span class="card-title">测试数据</span>
                    <a-tag color="blue" size="small">
                        <VerticalAlignBottomOutlined />
                    </a-tag>
                </div>
                <div class="card-value">68.32</div>
                <div class="card-metrics">
                    <span class="metric-item">
                        <ArrowDownOutlined /> 环比 <span class="text-danger">60.59%</span>
                    </span>
                    <span class="metric-item">
                        <ArrowDownOutlined /> 与去年相比 <span class="text-danger">58.93%</span>
                    </span>
                </div>
            </a-card>

            <!-- 订单数量卡片 -->
            <a-card class="stat-card" hoverable>
                <div class="card-header">
                    <span class="card-title">测试数据</span>
                    <a-tag color="green" size="small">
                        <FileTextOutlined />
                    </a-tag>
                </div>
                <div class="card-value">259</div>
                <div class="card-metrics">
                    <span class="metric-item">
                        <ArrowUpOutlined /> 环比 <span class="text-success">60%</span>
                    </span>
                    <span class="metric-item">
                        <ArrowUpOutlined /> 与去年相比 <span class="text-success">66.63%</span>
                    </span>
                </div>
            </a-card>

            <!-- 客户价格卡片 -->
            <a-card class="stat-card" hoverable>
                <div class="card-header">
                    <span class="card-title">测试数据</span>
                    <a-tag color="orange" size="small">
                        <ShoppingCartOutlined />
                    </a-tag>
                </div>
                <div class="card-value">100%</div>
                <div class="card-metrics">
                    <span class="metric-item">
                        <ArrowDownOutlined /> 环比 <span class="text-danger">60%</span>
                    </span>
                    <span class="metric-item">
                        <ArrowUpOutlined /> 与去年相比 <span class="text-success">68.63%</span>
                    </span>
                </div>
            </a-card>

            <!-- 小程序PV卡片 -->
            <a-card class="stat-card" hoverable>
                <div class="card-header">
                    <span class="card-title">测试数据</span>
                    <a-tag color="green" size="small">
                        <ShoppingCartOutlined />
                    </a-tag>
                </div>
                <div class="card-value">1,464</div>
                <div class="card-metrics">
                    <span class="metric-item">
                        <ArrowUpOutlined /> 环比 <span class="text-success">31.75%</span>
                    </span>
                    <span class="metric-item">
                        <ArrowUpOutlined /> 与去年相比 <span class="text-success">68.63%</span>
                    </span>
                </div>
            </a-card>

            <!-- 小程序GMV卡片 -->
            <a-card class="stat-card" hoverable>
                <div class="card-header">
                    <span class="card-title">测试数据</span>
                    <a-tag color="purple" size="small">
                        <CreditCardOutlined />
                    </a-tag>
                </div>
                <div class="card-value">222.49</div>
                <div class="card-metrics">
                    <span class="metric-item">
                        <ArrowUpOutlined /> Ring ratio <span class="text-success">31.23%</span>
                    </span>
                    <span class="metric-item">
                        <ArrowDownOutlined /> 与去年相比 <span class="text-danger">58.93%</span>
                    </span>
                </div>
            </a-card>

            <!-- 小程序UV卡片 -->
            <a-card class="stat-card" hoverable>
                <div class="card-header">
                    <span class="card-title">测试数据</span>
                    <a-tag color="red" size="small">
                        <UserOutlined />
                    </a-tag>
                </div>
                <div class="card-value">100%</div>
                <div class="card-metrics">
                    <span class="metric-item">
                        <ArrowDownOutlined /> 环比 <span class="text-danger">5.63%</span>
                    </span>
                    <span class="metric-item">
                        <ArrowUpOutlined /> 与去年相比 <span class="text-success">5.62%</span>
                    </span>
                </div>
            </a-card>
        </div>

        <!-- 新增：光伏项目表格卡片（放在趋势图区域上方） -->
        <a-card class="table-card" style="margin-bottom: 16px;">
            <a-card-head title="四川德瑞恒网络科技有限公司甘孜移动光伏建设项目（叠光站情况）12.05" />
            <a-card-body>
                <a-row class="smart-table-btn-block">
                    <div class="smart-table-operate-block">
                        <!-- v-privilege 设置为 oa:device:add，也就是说，当前用户除非具备了 'oa:device:add' 这样的权限，才能够在前端看到这个组件，不然就看不到。起到了一个分组控制、权限控制的目的 -->
                        <!-- <a-button @click="add()" v-privilege="'oa:device:add'" type="primary">
                            <template #icon>
                                <PlusOutlined />
                            </template>
                            新增
                        </a-button> -->
                        <a-button @click="exportExcel()" v-privilege="'oa:analysis:exportExcel'" type="primary">
                            <template #icon>
                                <FileExcelOutlined />
                            </template>
                            导出数据（带水印）
                        </a-button>
                    </div>
                    <div class="smart-table-setting-block">
                        <!-- <TableOperator v-model="columns" :tableId="TABLE_ID_CONST.BUSINESS.OA.ENTERPRISE"
                            :refresh="ajaxQuery" /> -->
                    </div>
                </a-row>
                <!-- Ant Design Vue 表格 -->
                <a-table :columns="tableColumns" :data-source="tableData" bordered size="large" :pagination="false"
                    :scroll="{ x: 'max-content' }" :row-class-name="(record) => {
                        // 匹配参考图的行背景色
                        if (record.index % 2 === 0) return 'row-yellow';
                        else return 'row-purple';
                    }" :loading="tableLoading"
                    :customRow="rowClick"
                    
                    >
                    <!-- 自定义单元格样式（匹配参考图的颜色，已同步更新为英文判断） -->
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'difference'">
                            <span :style="{
                                color: record.difference.startsWith('-') ? '#fff' : '',
                                backgroundColor: record.difference.startsWith('-') ? '#4080ff' : '',
                                padding: '2px 4px',
                                borderRadius: '2px'
                            }">
                                {{ record.difference }}
                            </span>
                        </template>
                        <template v-else-if="column.key === 'conversionRate'">
                            <span :style="{ color: record.conversionRate.includes('41.60%') ? 'red' : '' }">
                                {{ record.conversionRate }}
                            </span>
                        </template>
                        <template
                            v-else-if="['totalLoadCurrent', 'configuredInstalledCapacity', 'theoreticalPowerGeneration'].includes(column.dataIndex)">
                            <span :style="{ color: record[column.dataIndex] ? 'red' : '' }">
                                {{ record[column.dataIndex] }}
                            </span>
                        </template>
                        <template v-else>
                            {{ record[column.dataIndex] }}
                        </template>
                    </template>
                    <template #title>每日发电效率表</template>
                    <template #footer>Footer</template>
                </a-table>

                <div class="smart-query-table-page">
                    <a-pagination showSizeChanger showQuickJumper show-less-items :pageSizeOptions="PAGE_SIZE_OPTIONS"
                        :defaultPageSize="queryForm.pageSize" v-model:current="queryForm.pageNum"
                        v-model:pageSize="queryForm.pageSize" :total="total" @change="ajaxQuery"
                        :show-total="(total) => `共${total}条`" />
                </div>

            </a-card-body>
        </a-card>

        <!-- 趋势图区域（适配新参考图） -->
        <a-card class="trend-card">
            <a-card-head title="apple每个场景中的新用户数量">
                <template #extra>
                    <span>2019-06-13 ~ 2019-06-19 | Last 7 days</span>
                </template>
            </a-card-head>
            <a-card-body>
                <!-- 左侧多场景统计（适配参考图的3个场景） -->
                <div class="stats-wrap" style="width: 300px; display: flex; justify-content: space-between;">
                    <!-- 场景1：小程序消息卡（蓝色） -->
                    <div class="scene-item">
                        <div class="scene-label">
                            <span
                                style="display: inline-block; width: 8px; height: 8px; background: #4080ff; margin-right: 4px;"></span>
                            数据
                        </div>
                        <div class="scene-value">435 <span class="unit">people</span></div>
                    </div>
                    <!-- 场景2：小程序消息卡（绿色） -->
                    <div class="scene-item">
                        <div class="scene-label">
                            <span
                                style="display: inline-block; width: 8px; height: 8px; background: #52c41a; margin-right: 4px;"></span>
                            数据
                        </div>
                        <div class="scene-value">433 <span class="unit">people</span></div>
                    </div>
                    <!-- 场景3：小程序主入口（橙色） -->
                    <div class="scene-item">
                        <div class="scene-label">
                            <span
                                style="display: inline-block; width: 8px; height: 8px; background: #ff7a45; margin-right: 4px;"></span>
                            数据
                        </div>
                        <div class="scene-value">411 <span class="unit">people</span></div>
                    </div>
                </div>

                <!-- 右侧多曲线折线图 -->
                <div class="chart-container" id="gmvChart" style="width: 100%; height: 300px;"></div>
            </a-card-body>
        </a-card>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import * as echarts from 'echarts';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { enterpriseApi } from '/@/api/business/oa/enterprise-api';
import { deviceApi } from '/@/api/business/oa/device-api';
import { influxDbApi } from '/@/api/business/oa/influx-api';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { smartSentry } from '/@/lib/smart-sentry';
import { message } from 'ant-design-vue';
import * as XLSX  from 'xlsx';
// 引入Ant Design Vue图标
import {
    VerticalAlignBottomOutlined,
    FileTextOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    UserOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons-vue';
// 引入Ant Design Vue组件
import {
    Card,
    Descriptions,
    DescriptionsItem
} from 'ant-design-vue';

// ====================== 常量配置（工程化规范，集中管理） ======================
// 后端接口地址（可抽取到.env文件中，此处为演示）
const API_URL = '/api/photovoltaic/station/real-time';
// 光伏板单张功率（默认值，可根据业务调整，用于计算光伏板数量）
const SINGLE_SOLAR_PANEL_POWER = 620;
// 实时刷新间隔（可选，如需定时更新）
const REFRESH_INTERVAL = 30000;
let refreshTimer = null;

const queryFormState = {
    keywords: '',
    endTime: null,
    startTime: null,
    pageNum: 1,
    pageSize: PAGE_SIZE,
    searchCount: true,
};
const queryForm = reactive({ ...queryFormState });
const tableLoading = ref(false);
const total = ref(0);

// 日期选择
let searchDate = ref();

function dateChange(dates, dateStrings) {
    queryForm.startTime = dateStrings[0];
    queryForm.endTime = dateStrings[1];
}

function onSearch() {
    // queryForm 是一个表，集合了所有查询条件
    queryForm.pageNum = 1;
    fetchTableData();
}

function resetQuery() {
    searchDate.value = [];
    Object.assign(queryForm, queryFormState);
    fetchTableData();
}

// ---------------------- 导出 ---------------------------
async function exportExcel() {
    const headerMap = [
        ['序号', 'indexNumber'],
        ['区域', 'region'],
        ['站址类型', 'stationType'],
        ['站点名称', 'stationName'],
        ['dtu序列号', 'dtuNumber'],
        ['当前总负载电流（A）', 'totalLoadCurrent'],
        ['当前电压（A）', 'currentVoltage'],
        ['当前负载功率（W）', 'currentLoadPower'],
        ['配置装机容量（为当前负载的1.5倍系数）', 'configuredInstalledCapacity'],
        ['理论发电值（KW/H/天）', 'theoreticalPowerGeneration'],
        ['现阶段用电情况（近7日用电情况）平均每日（KW/H）', 'currentPowerConsumption'],
        ['安装光伏板数量（张）', 'panelCount'],
        ['装机容量（W）', 'installedCapacity'],
        ['控制器型号', 'deviceModel'],
        ['备注', 'remarks'],
        ['装机容量匹配电流', 'capacityMatchingCurrent'],
        ['现配控制器额定电流', 'controllerRatedCurrent'],
        ['差异（装机容量匹配电流现配控制器额定电流）负数为不匹配', 'difference'],
        ['转换率', 'conversionRate'],
        ['现场施工队负责人', 'constructionManager'],
    ]

    const exportData = tableData.value.map(row => {
        const exportRow = {};
        headerMap.forEach(([headerName, field]) => {
            exportRow[headerName] = row[field] ?? '';
        });
        return exportRow;
    });

    if (exportData.length === 0) {
        message.warning('当前没有数据可供导出');
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '经济分析');
    const excelFileName = `经济分析数据_${new Date().getTime()}.xlsx`;

    try {
        SmartLoading.show('正在导出数据，请稍候...');
        XLSX.writeFile(workbook, excelFileName);
        message.success('数据导出成功，请点击"保存"下载文件');
    } catch (error) {
        smartSentry.captureException(error);
        message.error('导出数据失败，请稍后重试');
    } finally {
        SmartLoading.hide();
    }
}
// ====================== 表格列配置（不变，保持原有结构） ======================
const tableColumns = [
    { title: '序号', dataIndex: 'indexNumber', key: 'indexNumber', width: 60 },
    { title: '区域', dataIndex: 'region', key: 'region', width: 80 },
    { title: '站址类型', dataIndex: 'stationType', key: 'stationType', width: 80 },
    { title: '站点名称', dataIndex: 'stationName', key: 'stationName', width: 200 },
    { title: 'dtu序列号', dataIndex: 'dtuNumber', key: 'dtuCode', width: 120 },
    { title: '当前总负载电流（A）', dataIndex: 'totalLoadCurrent', key: 'totalLoadCurrent', width: 120 },
    { title: '当前电压（A）', dataIndex: 'currentVoltage', key: 'currentVoltage', width: 100 },
    { title: '当前负载功率（W）', dataIndex: 'currentLoadPower', key: 'currentLoadPower', width: 120 },
    { title: '配置装机容量（为当前负载的1.5倍系数）', dataIndex: 'configuredInstalledCapacity', key: 'configuredInstalledCapacity', width: 200 },
    { title: '理论发电值（KW/H/天）', dataIndex: 'theoreticalPowerGeneration', key: 'theoreticalPowerGeneration', width: 150 },
    { title: '现阶段用电情况（近7日用电情况）平均每日（KW/H）', dataIndex: 'currentPowerConsumption', key: 'currentPowerConsumption', width: 200 },
    { title: '安装光伏板数量（张）', dataIndex: 'panelCount', key: 'solarPanelCount', width: 120 },
    { title: '装机容量（W）', dataIndex: 'installedCapacity', key: 'installedCapacity', width: 100 },
    { title: '控制器型号', dataIndex: 'deviceModel', key: 'controllerModel', width: 100 },
    { title: '备注', dataIndex: 'remarks', key: 'remarks', width: 80 },
    { title: '装机容量匹配电流', dataIndex: 'capacityMatchingCurrent', key: 'capacityMatchingCurrent', width: 120 },
    { title: '现配控制器额定电流', dataIndex: 'controllerRatedCurrent', key: 'controllerRatedCurrent', width: 120 },
    { title: '差异（装机容量匹配电流现配控制器额定电流）负数为不匹配', dataIndex: 'difference', key: 'difference', width: 180 },
    { title: '转换率', dataIndex: 'conversionRate', key: 'conversionRate', width: 100 },
    { title: '现场施工队负责人', dataIndex: 'constructionManager', key: 'constructionManager', width: 120 },
];

// ====================== 响应式表格数据（初始为空） ======================
const tableData = ref([]);

// ====================== 工具函数：计算衍生字段 ======================
/**
 * 计算表格所需的衍生字段
 * @param {Array} rawData - 后端返回的原始数据
 * @returns {Array} 处理后的表格数据
 */
const processTableData = (rawData) => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
        return [];
    }

    return rawData.map((item, index) => {
        // 后端返回的核心字段
        const { totalLoadCurrent, currentVoltage, installedCapacity, controllerModel, constructionManager,
            createUserName,
            createTime,
            createUserId,
            dc_meter_power,
            deletedFlag,
            deviceId,
            deviceModel,
            deviceName,
            device_status,
            disabledFlag,
            dtuNumber,
            dtuStatus,
            output_current,
            output_voltage,
            pv_power,
            pv_voltage,
            time,
            updateTime,
            serialNumber,
            stationId,
            stationName,
            status,
            versionNumber,
            type,

            // 其他字段...
            districtName,
            contact, //施工队负责人
            panelCount,



        } = item;
        // 1. 计算当前负载功率（W）= 电流 * 电压，保留2位小数
        const currentLoadPower = (Number(output_current) * Number(output_voltage)).toFixed(2);

        // 2. 计算配置装机容量（当前负载的1.5倍），保留2位小数
        const configuredInstalledCapacity = (Number(currentLoadPower) * 1.5).toFixed(2);

        // 3. 计算安装光伏板数量（装机容量 / 单张光伏板功率，向下取整）
        const solarPanelCount = Math.floor(Number(installedCapacity) / SINGLE_SOLAR_PANEL_POWER);

        // 4. 计算装机容量匹配电流（装机容量 / 电压，保留2位小数）
        const capacityMatchingCurrent = (Number(installedCapacity) / Number(currentVoltage)).toFixed(2);

        // 5. 提取现配控制器额定电流（从控制器型号中解析，示例：MCJ4880 → 80A）
        const controllerRatedCurrent = controllerModel ? controllerModel.replace(/[^0-9]/g, '') : '';

        // 6. 计算差异（装机容量匹配电流 - 现配控制器额定电流），保留2位小数
        let difference = '';
        if (capacityMatchingCurrent && controllerRatedCurrent) {
            difference = (Number(capacityMatchingCurrent) - Number(controllerRatedCurrent)).toFixed(2);
        }

        // 7. 模拟转换率（可根据实际业务逻辑计算，此处保留示例值）
        const conversionRate = index === 1 ? '41.60%' : `${(50 + Math.random() * 1).toFixed(2)}%`;

        // 8. 模拟其他固定字段（若后端不返回，可根据业务默认值或关联查询获取）
        const defaultFields = {
            indexNumber: (index + 1).toString(),
            dtuNumber: dtuNumber,
            output_current: output_current,
            output_voltage: output_voltage,
            region: districtName,
            stationType: type,
            stationName: stationName,
            dtuCode: `8606780740${75583 + index}`,
            theoreticalPowerGeneration: (10 + Math.random() * 10).toFixed(2),
            currentPowerConsumption: (5 + Math.random() * 5).toFixed(2),
            remarks: '',
            deviceModel: deviceModel,
            panelCount: panelCount || '未知',
        };

        // 返回整合后的数据
        return {
            key: (index + 1).toString(),
            index: index + 1,
            ...defaultFields,
            totalLoadCurrent,
            currentVoltage,
            currentLoadPower,
            configuredInstalledCapacity,
            theoreticalPowerGeneration: defaultFields.theoreticalPowerGeneration,
            currentPowerConsumption: defaultFields.currentPowerConsumption,
            solarPanelCount,
            installedCapacity,
            controllerModel,
            remarks: defaultFields.remarks,
            capacityMatchingCurrent,
            controllerRatedCurrent,
            difference,
            conversionRate,
            constructionManager,
        };
    });
};

// ====================== 核心函数：获取后端实时数据 ======================
const fetchTableData = async () => {
    try {
        tableLoading.value = true;
        /** 步骤一：查询Mysql设备信息*/
        let responseModel = await deviceApi.pageQuery(queryForm);
        const deviceList = responseModel.data.list;
        console.log(deviceList, 'responseModel');
        // 查找Mysql站点信息

        // 若设备列表为空，直接返回，避免后续无效查询
        if (!Array.isArray(deviceList) || deviceList.length === 0) {
            tableData.value = [];
            total.value = 0;
            return;
        }
        // 1. 提取所有非空的stationName，避免空值查询
        const stationNames = deviceList
            .map(item => item.stationName?.trim()) // 去除首尾空格，避免无效查询
            .filter(name => name && name !== ''); // 过滤空值，只保留有效站点名称

        // 2. 站点名称去重，避免同一站点重复查询
        const uniqueStationNames = [...new Set(stationNames)];
        console.log(uniqueStationNames, '去重后的有效站点名称');

        // 3. 批量查询站点信息（若无需批量，可改为循环一对一查询，此处优先批量优化性能）
        // 定义站点信息Map，用于快速匹配
        const stationInfoMap = new Map();
        if (uniqueStationNames.length > 0) {
            // 循环查询每个站点信息（若后端支持批量传入stationName，可改为一次查询，性能更优）
            for (const stationName of uniqueStationNames) {
                // 重置查询条件，仅赋值当前站点名称，避免污染原有queryForm
                const stationQueryForm = {
                    ...queryForm,
                    keywords: stationName, // 动态赋值，不再硬编码
                    pageNum: 1,
                    pageSize: 1, // 每个站点只取一条核心静态信息
                };

                // 等待站点信息返回，确保获取到数据后再执行下一步
                let stationResponse = await enterpriseApi.pageQuery(stationQueryForm);
                const stationInfo = stationResponse.data.list?.[0] || {}; // 取第一条站点信息
                // 以stationName为key，存储站点信息，方便后续快速匹配
                stationInfoMap.set(stationName, stationInfo);
            }
        }
        console.log(stationInfoMap, '站点信息Map（key：stationName，value：站点静态信息）');

        /** 步骤三：查询Influxdb实时数据 */
        const dtuNumberList = deviceList.map(item => item.dtuNumber);
        const influxResult = await influxDbApi.getDtuRealTimeStatus(dtuNumberList);
        const influxStatusMap = new Map();
        (influxResult.data || []).forEach(item => {
            const key = String(item.dtuNumber);
            influxStatusMap.set(key, item);
        });

        /** 步骤四：三合一合并数据（设备信息 + 站点信息 + Influxdb实时数据） */
        const mergedTableData = deviceList.map(mysqlItem => {
            const dtuKey = String(mysqlItem.dtuNumber);
            const influxItem = influxStatusMap.get(dtuKey) || {};

            // 提取当前设备对应的stationName，用于匹配站点信息
            const currentStationName = mysqlItem.stationName?.trim() || '';
            // 获取当前设备对应的站点静态信息
            const stationItem = stationInfoMap.get(currentStationName) || {};

            return {
                ...mysqlItem, // 设备基础信息
                ...stationItem, // 合并站点静态信息（自动覆盖同名字段，若有冲突可手动指定）
                ...influxItem, // 合并Influxdb实时数据
                // 明确映射Influxdb字段，语义更清晰
                pv_power: influxItem.pv_power || '0.00',
                pv_voltage: influxItem.pv_voltage || '0.00',
                output_voltage: influxItem.output_voltage || '0.00',
                output_current: influxItem.output_current || '0.00',
                dc_meter_power: influxItem.dc_meter_power || '0.00',
                device_status: influxItem.device_status || '未知',
                time: influxItem.time || '无数据',
                // 映射表格所需核心字段，确保processTableData能正常读取
                totalLoadCurrent: mysqlItem.totalLoadCurrent || influxItem.output_current || '0.00',
                currentVoltage: mysqlItem.currentVoltage || influxItem.output_voltage || '0.00',
                installedCapacity: mysqlItem.installedCapacity || '0.00',
                controllerModel: mysqlItem.controllerModel || '未知',
                constructionManager: mysqlItem.constructionManager || '未知',

            };
        });
        console.log(mergedTableData, '三合一合并后的表格原始数据');

        /** 步骤五：处理衍生字段并赋值给表格 */
        const processedTableData = processTableData(mergedTableData);
        tableData.value = processedTableData;
        total.value = responseModel.data.total; // 赋值分页总数


        // queryForm.keywords = '稻普';
        // let responseModelStation = await enterpriseApi.pageQuery(queryForm);
        // console.log(responseModelStation, 'responseModelStation');
        // /** 步骤二：查询Influxdb */
        // const dtuNumberList = deviceList.map(item => item.dtuNumber); //提取dtu唯一标识数组
        // //调用influxdb接口：批量查询这些DTU的最新状态（按照dtuNumber分组）
        // const influxResult = await influxDbApi.getDtuRealTimeStatus(dtuNumberList);
        // //转换为 Map 结构，方便快速匹配（key: dtuSerialNumber, value: 实时状态）
        // const influxStatusMap = new Map();
        // (influxResult.data || []).forEach(item => {
        //     const key = String(item.dtuNumber);
        //     influxStatusMap.set(key, item);
        // });
        // /** 步驟三：合并Mysql + Influxdb */
        // const mergedTableData = deviceList.map(mysqlItem => {
        //     const dtuKey = String(mysqlItem.dtuNumber);
        //     const influxItem = influxStatusMap.get(dtuKey) || {}
        //     return {
        //         ...mysqlItem,
        //         pv_power: influxItem.pv_power || '0.00', // 发电量
        //         pv_voltage: influxItem.pv_voltage || '0.00', // 发电电压
        //         output_voltage: influxItem.output_voltage || '0.00', // 输出电压
        //         output_current: influxItem.output_current || '0.00', // 输出电流
        //         dc_meter_power: influxItem.dc_meter_power || '0.00', // 直流电表功率
        //         device_status: influxItem.device_status || '未知', // 设备状态
        //         time: influxItem.time || '无数据', // 最新数据时间
        //         // 其他InfluxDB字段按需添加...
        //     }
        // });
        // /** 步驟五：給表格修改原数据 */
        // console.log(mergedTableData, 'mergedTableData');
        // const processedTableData = processTableData(mergedTableData);
        // tableData.value = processedTableData;

        // 赋值给响应式数据，表格自动刷新
        // tableData.value = proce;
    } catch (error) {
        smartSentry.captureError(error);
        console.error('获取光伏实时数据失败：', error);
        tableData.value = []; // 报错时清空表格，避免脏数据
    } finally {
        tableLoading.value = false;
    }
};

// Echarts 全局变量
let gmvChartInstance = null;
// 模拟表格行与Echarts数据的映射关系
const rowEchartsDataMap = {
    '1': {
        legendData: ['小程序消息卡(蓝)', '小程序消息卡(绿)', '小程序主入口'],
        xAxisData: ['6-13', '6-14', '6-15', '6-16', '6-17', '6-18', '6-19'],
        seriesData: [
            {
                name: '小程序消息卡(蓝)',
                type: 'line',
                data: [405, 415, 440, 400, 380, 385, 370],
                lineStyle: { color: '#4080ff', width: 2 },
                itemStyle: { color: '#4080ff' }
            },
            {
                name: '小程序消息卡(绿)',
                type: 'line',
                data: [410, 395, 395, 375, 350, 380, 345],
                lineStyle: { color: '#52c41a', width: 2 },
                itemStyle: { color: '#52c41a' }
            },
            {
                name: '小程序主入口',
                type: 'line',
                data: [395, 425, 425, 385, 375, 400, 370],
                lineStyle: { color: '#ff7a45', width: 2 },
                itemStyle: { color: '#ff7a45' }
            }
        ]
    },
    // 行2（key: '2'）对应的图表数据（与行1不同，模拟差异化数据）
    '2': {
        legendData: ['小程序消息卡(蓝)', '小程序消息卡(绿)', '小程序主入口'],
        xAxisData: ['6-13', '6-14', '6-15', '6-16', '6-17', '6-18', '6-19'],
        seriesData: [
            {
                name: '小程序消息卡(蓝)',
                type: 'line',
                data: [350, 370, 390, 420, 440, 430, 410],
                lineStyle: { color: '#4080ff', width: 2 },
                itemStyle: { color: '#4080ff' }
            },
            {
                name: '小程序消息卡(绿)',
                type: 'line',
                data: [330, 350, 380, 400, 390, 370, 360],
                lineStyle: { color: '#52c41a', width: 2 },
                itemStyle: { color: '#52c41a' }
            },
            {
                name: '小程序主入口',
                type: 'line',
                data: [340, 360, 370, 390, 410, 400, 380],
                lineStyle: { color: '#ff7a45', width: 2 },
                itemStyle: { color: '#ff7a45' }
            }
        ]
    },
    // 行3（key: '3'）对应的图表数据（继续模拟差异化）
    '3': {
        legendData: ['小程序消息卡(蓝)', '小程序消息卡(绿)', '小程序主入口'],
        xAxisData: ['6-13', '6-14', '6-15', '6-16', '6-17', '6-18', '6-19'],
        seriesData: [
            {
                name: '小程序消息卡(蓝)',
                type: 'line',
                data: [450, 430, 420, 400, 390, 410, 420],
                lineStyle: { color: '#4080ff', width: 2 },
                itemStyle: { color: '#4080ff' }
            },
            {
                name: '小程序消息卡(绿)',
                type: 'line',
                data: [440, 420, 400, 380, 390, 400, 410],
                lineStyle: { color: '#52c41a', width: 2 },
                itemStyle: { color: '#52c41a' }
            },
            {
                name: '小程序主入口',
                type: 'line',
                data: [430, 410, 390, 400, 420, 430, 440],
                lineStyle: { color: '#ff7a45', width: 2 },
                itemStyle: { color: '#ff7a45' }
            }
        ]
    },
}

//  定义默认图表配置（公共样式，无需随行切换变化）
const defaultEchartsOption = {
    tooltip: {
        trigger: 'axis',
        formatter: '{b}<br>{a}: {c} people'
    },
    legend: {
        bottom: 10,
        left: 'center'
    },
    xAxis: {
        type: 'category',
        axisLabel: { fontSize: 12 }
    },
    yAxis: {
        type: 'value',
        min: 300, // 调整最小值，适配更多数据场景
        max: 500, // 调整最大值，适配更多数据场景
        axisLabel: { fontSize: 12 }
    },
    series: []
};
// ====================== 生命周期钩子：初始化和销毁 ======================
onMounted(() => {
    // 首次加载数据
    fetchTableData();

    // 可选：定时刷新数据（实时更新）
    // refreshTimer = setInterval(() => {
    //     fetchTableData();
    // }, REFRESH_INTERVAL);

    // 初始化ECharts
    const initGmvChart = () => {
        //绑定DOM
        const chartDom = document.getElementById('gmvChart');
        if (!chartDom) return;
        gmvChartInstance = echarts.init(chartDom);
        //初始渲染：使用行 1 的默认数据
        const defaultData = rowEchartsDataMap['1'];
        const initOption = {
            ...defaultEchartsOption,
            legend: { ...defaultEchartsOption.legend, data: defaultData.legendData },
            xAxis: { ...defaultEchartsOption.xAxis, data: defaultData.xAxisData },
            series: defaultData.seriesData.map(item => ({
                ...item,
                smooth: false,
                symbol: 'circle',
                symbolSize: 6,
            }))
        }
        //渲染初始图表
        gmvChartInstance.setOption(initOption);
        //自适应窗口
        window.addEventListener('resize', () => {
            gmvChartInstance && gmvChartInstance.resize();
        });
        
        // const chartInstance = echarts.init(document.getElementById('gmvChart'));
        // const option = {
        //     tooltip: {
        //         trigger: 'axis',
        //         formatter: '{b}<br>{a}: {c} people'
        //     },
        //     legend: {
        //         bottom: 10,
        //         left: 'center',
        //         data: ['小程序消息卡(蓝)', '小程序消息卡(绿)', '小程序主入口']
        //     },
        //     xAxis: {
        //         type: 'category',
        //         data: ['6-13', '6-14', '6-15', '6-15', '6-16', '6-17', '6-18'],
        //         axisLabel: { fontSize: 12 }
        //     },
        //     yAxis: {
        //         type: 'value',
        //         min: 340,
        //         max: 460,
        //         axisLabel: { fontSize: 12 }
        //     },
        //     series: [
        //         {
        //             name: '小程序消息卡(蓝)',
        //             type: 'line',
        //             data: [405, 415, 440, 400, 380, 385, 370],
        //             smooth: false,
        //             lineStyle: { color: '#4080ff', width: 2 },
        //             symbol: 'circle',
        //             symbolSize: 6,
        //             itemStyle: { color: '#4080ff' }
        //         },
        //         {
        //             name: '小程序消息卡(绿)',
        //             type: 'line',
        //             data: [410, 395, 395, 375, 350, 380, 345],
        //             smooth: false,
        //             lineStyle: { color: '#52c41a', width: 2 },
        //             symbol: 'circle',
        //             symbolSize: 6,
        //             itemStyle: { color: '#52c41a' }
        //         },
        //         {
        //             name: '小程序主入口',
        //             type: 'line',
        //             data: [395, 425, 425, 385, 375, 400, 370],
        //             smooth: false,
        //             lineStyle: { color: '#ff7a45', width: 2 },
        //             symbol: 'circle',
        //             symbolSize: 6,
        //             itemStyle: { color: '#ff7a45' }
        //         }
        //     ]
        // };
        // chartInstance.setOption(option);
        // window.addEventListener('resize', () => chartInstance.resize());
    };

    initGmvChart();
});

/**
 * 根据表格选中行更新ECharts图表
 * @param {Object} selectedRow 表格选中行数据
 */
const updateEchartsByRow = (selectedRow) => {
    // 1. 校验必要参数
    if (!gmvChartInstance || !selectedRow || !selectedRow.key) {
        message.warning('暂无有效数据更新图表');
        return;
    }
    
    // 2. 获取当前选中行对应的图表数据（若无对应数据，使用默认行1数据）
    const rowKey = selectedRow.key;
    console.log('选中行Key：', rowKey);
    const targetEchartsData = rowEchartsDataMap[rowKey] || rowEchartsDataMap['1'];
    
    // 3. 组装新的ECharts配置项
    const newOption = {
        legend: {
            ...defaultEchartsOption.legend,
            data: targetEchartsData.legendData
        },
        xAxis: {
            ...defaultEchartsOption.xAxis,
            data: targetEchartsData.xAxisData
        },
        yAxis: defaultEchartsOption.yAxis,
        series: targetEchartsData.seriesData.map(item => ({
            ...item,
            smooth: false,
            symbol: 'circle',
            symbolSize: 6
        }))
    };
    
    // 4. 关键：调用setOption更新图表（无需重新创建实例，直接更新配置）
    gmvChartInstance.setOption(newOption, true); // true表示不合并配置，直接替换
    message.success(`已切换为【${selectedRow.stationName + selectedRow.dtuNumber || '第' + rowKey + '行'}】对应的图表数据`);
};

const rowClick = (record) => {
    return {
        onClick: () => {
            console.log('行数据被点击：', record);
            updateEchartsByRow(record);
        }
    }
}



// 组件销毁时清除定时器，防止内存泄漏
onUnmounted(() => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    if (gmvChartInstance) {
        gmvChartInstance.dispose();
        gmvChartInstance = null;
    }
});
</script>

<style lang="less" scoped>
/* 新增/修改趋势图区域样式 */
.trend-card {
    .card-body {
        flex-direction: column; // 改为纵向布局（匹配参考图的“标题-统计-图表”结构）
        gap: 16px;

        .stats-wrap {
            .scene-item {
                text-align: center;

                .scene-label {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 4px;
                }

                .scene-value {
                    font-size: 18px;
                    font-weight: 600;

                    .unit {
                        font-size: 12px;
                        margin-left: 4px;
                        color: #999;
                    }
                }
            }
        }
    }
}

.dashboard-page {
    width: 100%;
    min-height: 100vh;
    padding: 16px;
    background: #f5f5f5;

    // 顶部数据卡片容器
    .top-cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 16px;

        @media (max-width: 1200px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }

        // 统计卡片样式
        .stat-card {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            transition: all 0.2s;

            &:hover {
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
            }

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;

                .card-title {
                    font-size: 14px;
                    color: #999;
                }
            }

            .card-value {
                font-size: 24px;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .card-metrics {
                font-size: 12px;
                color: #666;

                .metric-item {
                    display: inline-block;
                    margin-right: 12px;

                    &:last-child {
                        margin-right: 0;
                    }
                }
            }
        }
    }

    // 趋势图卡片
    .trend-card {
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        .card-body {
            display: flex;
            gap: 24px;
            align-items: flex-start;

            .chart-container {
                flex: 1;
            }
        }
    }

    // 表格卡片样式补充
    .table-card {
        border-radius: 8px;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        :deep(.row-purple) {
            background-color: #f9e0ff !important;
        }

        :deep(.row-yellow) {
            background-color: #fff9e0 !important;
        }
    }

    // 通用样式
    .text-success {
        color: #52c41a;
    }

    .text-danger {
        color: #ff4d4f;
    }
}
</style>