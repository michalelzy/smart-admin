<template>
  <div class="device-monitor-page">
    <!-- 左侧设备列表 -->
    <div class="sidebar">
      <!-- 站点选择 -->
      <div class="sidebar-header">
        <a-select style="width: 100%" v-model:value="currentStation" placeholder="选择站点">
          <a-select-option value="1">甘孜州新龙县大盖综合机房（新增）</a-select-option>
        </a-select>
      </div>

      <!-- 设备分类标签 -->
      <div class="device-tabs">
        <a-radio-group v-model:value="currentDeviceType" button-style="solid" size="small">
          <a-radio-button value="controller">叠光控制器 (2)</a-radio-button>
          <a-radio-button value="meter">电表 (2)</a-radio-button>
        </a-radio-group>
      </div>

      <!-- 设备列表（Card卡片形式） -->
      <div class="device-list">
        <a-input placeholder="请输入设备名称" class="device-search" />
        <!-- 叠光控制器卡片列表 -->
        <div v-if="currentDeviceType === 'controller'" class="device-card-list">
          <a-card v-for="(device, idx) in controllerList" :key="idx"
            :class="{ 'active-device-card': currentDevice.id === device.id }" hoverable @click="selectDevice(device)">
            <div class="device-card-content">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-status">
                <a-tag :color="device.online ? 'success' : 'error'" size="small">
                  {{ device.online ? '在线' : '离线' }}
                </a-tag>
                <span class="device-version">未知版本</span>
                <span class="device-sn">暂无串号</span>
              </div>
              <div class="device-model">型号: {{ device.model }}</div>
            </div>
          </a-card>
        </div>

        <!-- 电表卡片列表（预留） -->
        <div v-if="currentDeviceType === 'meter'" class="device-card-list">
          <a-card v-for="(device, idx) in meterList" :key="idx"
            :class="{ 'active-device-card': currentDevice.id === device.id }" hoverable @click="selectDevice(device)">
            <div class="device-card-content">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-status">
                <a-tag :color="device.online ? 'success' : 'error'" size="small">
                  {{ device.online ? '在线' : '离线' }}
                </a-tag>
                <span class="device-version">未知版本</span>
                <span class="device-sn">暂无串号</span>
              </div>
              <div class="device-model">型号: {{ device.model }}</div>
            </div>
          </a-card>
        </div>
      </div>
    </div>

    <!-- 右侧内容区（改用Description组件） -->
    <div class="content">
      <!-- 顶部设备信息 -->
      <div class="content-header">
        <div class="header-title">
          <h2>{{ currentDevice.name }}
            <a-tag :color="currentDevice.online ? 'success' : 'error'" size="small">
              {{ currentDevice.online ? '在线' : '离线' }}
            </a-tag>
          </h2>
          <p>连接时间: 2025-12-21 22:08:06</p>
        </div>

        <!-- 设备基础信息 Description 组件 -->
        <a-descriptions class="device-desc" bordered column="2" size="middle">
          <a-descriptions-item label="串号">
            {{ currentDevice.sn || '未知串号' }}
          </a-descriptions-item>
          <a-descriptions-item label="设备类型">
            <a-tag :color="$smartEnumPlugin.getColorByValue('DEVICE_TYPE_ENUM', currentDevice.type)"
              :key="currentDevice.type">
              <template #icon>
                <check-circle-outlined />
              </template>
              {{ $smartEnumPlugin.getDescByValue('DEVICE_TYPE_ENUM', currentDevice.type) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="型号">
            {{ currentDevice.model }}
          </a-descriptions-item>
          <a-descriptions-item label="版本号">
            {{ currentDevice.version || '未知版本' }}
          </a-descriptions-item>
          <a-descriptions-item label="所属电站">
            {{ currentStationName }}
          </a-descriptions-item>
          <a-descriptions-item label="DTU设备编号">
            {{ currentDevice.dtuCode || '194829410883632329' }}
          </a-descriptions-item>
          <a-descriptions-item label="设备地址">
            {{ currentDevice.address || '1' }}
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <!-- 历史数据区域 -->
      <a-card class="data-card" style="height: calc(100vh - 320px); display: flex; flex-direction: column;">
        <a-card-head title="历史数据">
          <template #extra>
            <a-range-picker style="width: 240px" v-model:value="topDateRange" format="YYYY-MM-DD HH:mm:ss" @change="topDateChange" />
            <a-button type="primary" size="small" style="margin-left: 8px" @click="handleTopQuery">查询</a-button>
          </template>
        </a-card-head>
        <a-card-body style="flex: 1; padding: 20px; display: flex; flex-direction: column;">
          <!-- 数据指标标签 + 新增精确时间选择器组合 -->
          <div class="data-tabs-time-wrap" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <!-- 数据指标标签 -->
            <div class="data-tabs">
              <a-radio-group v-model:value="activeMetric" button-style="solid" size="small">
                <a-radio-button value="voltage">光伏输入电压</a-radio-button>
                <a-radio-button value="current">模组输出电流</a-radio-button>
                <a-radio-button value="outputVoltage">输出电压</a-radio-button>
                <a-radio-button value="outputCurrent">输出总电流</a-radio-button>
                <a-radio-button value="outputPower">输出总功率</a-radio-button>
              </a-radio-group>
            </div>
            
            <!-- 新增：精确时间范围选择器（和示例代码对齐） -->
            <div class="time-select-group" style="display: flex; align-items: center; gap: 10px;">
              <a-space direction="vertical" :size="12">
                <a-range-picker 
                  v-model:value="searchDate" 
                  :presets="defaultTimeRanges" 
                  @change="dateChange" 
                  size="small"
                  style="width: 240px"
                  format="YYYY-MM-DD HH:mm:ss"
                />
              </a-space>
              <a-button-group>
                <a-button type="primary" size="small" @click="onSearch">
                  <template #icon>
                    <SearchOutlined />
                  </template>
                  查询
                </a-button>
                <a-button size="small" @click="resetQuery">
                  <template #icon>
                    <ReloadOutlined />
                  </template>
                  重置
                </a-button>
              </a-button-group>
            </div>
          </div>

          <!-- 折线图容器 -->
          <div class="chart-container" id="mainChart" style="width: 100%; flex: 1; min-height: 400px;"></div>
        </a-card-body>
      </a-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import * as echarts from 'echarts';
import { CheckCircleOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import { defaultTimeRanges } from '/@/lib/default-time-ranges'; // 复用项目已有时间预设

// 站点数据
const currentStation = ref('1');
const currentStationName = ref('甘孜州新龙县大盖综合机房（新增）');

// 设备类型
const currentDeviceType = ref('controller');

// 叠光控制器Mock数据（补充完整字段）
const controllerList = ref([
  {
    id: 1,
    name: '甘孜州新龙县大盖综合机房（新增）',
    model: 'MCJ4840',
    type: 1,
    online: true,
    sn: '未知串号',
    version: '未知版本',
    dtuCode: '194829410883632329',
    address: '1'
  },
  {
    id: 2,
    name: '甘孜州新龙县大盖综合机房',
    model: 'MCJ4860',
    type: 1,
    online: false,
    sn: 'SN20251221002',
    version: 'V1.0.2',
    dtuCode: '194829410883632330',
    address: '2'
  }
]);

// 电表Mock数据（补充完整字段）
const meterList = ref([
  {
    id: 3,
    name: '大盖机房电表1',
    model: 'DTSU666',
    type: 2,
    online: true,
    sn: 'SN20251221003',
    version: 'V2.1.0',
    dtuCode: '194829410883632331',
    address: '3'
  },
  {
    id: 4,
    name: '大盖机房电表2',
    model: 'DTSU777',
    type: 2,
    online: false,
    sn: '未知串号',
    version: 'V2.0.9',
    dtuCode: '194829410883632332',
    address: '4'
  }
]);

// 当前选中设备
const currentDevice = ref(controllerList.value[0]);

// 切换设备
const selectDevice = (device) => {
  currentDevice.value = device;
  renderChart();
};

// 监听设备类型切换，重置选中设备
watch(currentDeviceType, (newType) => {
  if (newType === 'controller') {
    currentDevice.value = controllerList.value[0];
  } else {
    currentDevice.value = meterList.value[0];
  }
  renderChart();
});

// 时间范围相关（和示例代码对齐）
const topDateRange = ref([new Date('2025-12-21 00:00:00'), new Date()]);
const searchDate = ref(); // 指标右侧时间选择器
// 查询表单（复用示例代码的时间参数结构）
const queryFormState = {
  startTime: null,
  endTime: null,
};
const queryForm = reactive({ ...queryFormState });

// 选中的指标
const activeMetric = ref('voltage');

// ECharts实例
let chartInstance = null;

// mock图表数据（完善所有指标）
const mockChartData = {
  voltage: {
    xAxis: ['2025-12-21 00:10:09', '2025-12-21 04:30:52', '2025-12-21 08:11:59', '2025-12-21 10:21:30', '2025-12-21 13:21:22', '2025-12-21 14:42:04', '2025-12-21 16:51:14', '2025-12-21 20:41:38'],
    series: [
      { name: '光伏输入电压1', data: [0, 0, 70, 85, 88, 85, 82, 0] },
      { name: '光伏输入电压2', data: [0, 0, 68, 82, 86, 83, 80, 0] },
      { name: '光伏输入电压3', data: [0, 0, 69, 84, 87, 84, 81, 0] },
      { name: '光伏输入电压4', data: [0, 0, 71, 86, 89, 86, 83, 0] }
    ]
  },
  current: {
    xAxis: ['2025-12-21 00:10:09', '2025-12-21 04:30:52', '2025-12-21 08:11:59', '2025-12-21 10:21:30', '2025-12-21 13:21:22', '2025-12-21 14:42:04', '2025-12-21 16:51:14', '2025-12-21 20:41:38'],
    series: [
      { name: '模组1电流', data: [0, 0, 5, 8, 9, 8, 7, 0] },
      { name: '模组2电流', data: [0, 0, 4, 7, 8, 7, 6, 0] }
    ]
  },
  outputVoltage: {
    xAxis: ['2025-12-21 00:10:09', '2025-12-21 04:30:52', '2025-12-21 08:11:59', '2025-12-21 10:21:30', '2025-12-21 13:21:22', '2025-12-21 14:42:04', '2025-12-21 16:51:14', '2025-12-21 20:41:38'],
    series: [
      { name: '输出电压', data: [48, 48, 48.5, 49, 49.2, 49, 48.8, 48] }
    ]
  },
  outputCurrent: {
    xAxis: ['2025-12-21 00:10:09', '2025-12-21 04:30:52', '2025-12-21 08:11:59', '2025-12-21 10:21:30', '2025-12-21 13:21:22', '2025-12-21 14:42:04', '2025-12-21 16:51:14', '2025-12-21 20:41:38'],
    series: [
      { name: '输出总电流', data: [0, 0, 9, 15, 17, 15, 13, 0] }
    ]
  },
  outputPower: {
    xAxis: ['2025-12-21 00:10:09', '2025-12-21 04:30:52', '2025-12-21 08:11:59', '2025-12-21 10:21:30', '2025-12-21 13:21:22', '2025-12-21 14:42:04', '2025-12-21 16:51:14', '2025-12-21 20:41:38'],
    series: [
      { name: '输出总功率', data: [0, 0, 436.5, 735, 836.4, 735, 634.4, 0] }
    ]
  }
};

// 初始化图表
const initChart = () => {
  chartInstance = echarts.init(document.getElementById('mainChart'));
  renderChart();
  window.addEventListener('resize', () => chartInstance.resize());
};

// 渲染图表
const renderChart = () => {
  const data = mockChartData[activeMetric.value] || mockChartData.voltage;
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { top: 10, left: 'center' },
    xAxis: {
      type: 'category',
      data: data.xAxis,
      axisLabel: { rotate: 30, fontSize: 12 }
    },
    yAxis: { type: 'value' },
    series: data.series.map(item => ({
      ...item,
      type: 'line',
      smooth: true,
      lineStyle: { width: 2 },
      symbol: 'circle',
      symbolSize: 6
    }))
  };
  chartInstance.setOption(option);
};

// 监听指标切换
watch(activeMetric, renderChart);

// 时间选择器相关方法（和示例代码对齐）
// 顶部时间选择器变更
const topDateChange = (dates, dateStrings) => {
  if (dateStrings && dateStrings.length === 2) {
    queryForm.startTime = dateStrings[0];
    queryForm.endTime = dateStrings[1];
    topDateRange.value = dates;
  }
};

// 指标右侧时间选择器变更
const dateChange = (dates, dateStrings) => {
  if (dateStrings && dateStrings.length === 2) {
    queryForm.startTime = dateStrings[0];
    queryForm.endTime = dateStrings[1];
    searchDate.value = dates;
  }
};

// 指标右侧查询按钮
const onSearch = () => {
  // 此处可添加时间合法性校验
  if (!queryForm.startTime || !queryForm.endTime) {
    alert('请选择完整的时间范围');
    return;
  }
  // 同步到顶部时间选择器
  topDateRange.value = searchDate.value;
  // 执行图表渲染（真实项目中替换为接口请求）
  renderChart();
};

// 指标右侧重置按钮
const resetQuery = () => {
  searchDate.value = [];
  topDateRange.value = [new Date('2025-12-21 00:00:00'), new Date()];
  Object.assign(queryForm, queryFormState);
  renderChart();
};

// 顶部查询按钮
const handleTopQuery = () => {
  // 同步到指标右侧时间选择器
  searchDate.value = topDateRange.value;
  // 执行图表渲染（真实项目中替换为接口请求）
  renderChart();
};

onMounted(() => {
  initChart();
  // 初始化时间参数
  queryForm.startTime = '2025-12-21 00:00:00';
  queryForm.endTime = new Date().toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-').replace(/\s+/g, ' ');
});
</script>

<style lang="less" scoped>
.device-monitor-page {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;

  .sidebar {
    width: 220px;
    background: #fff;
    border-right: 1px solid #e8e8e8;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .sidebar-header {
      padding-bottom: 8px;
      border-bottom: 1px solid #e8e8e8;
    }

    .device-tabs {
      margin-bottom: 8px;
    }

    .device-search {
      margin-bottom: 12px;
      width: 100%;
    }

    // 设备卡片列表容器
    .device-card-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;

      // 设备卡片样式
      .ant-card {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
          transform: translateY(-1px);
        }
      }

      // 选中的设备卡片
      .active-device-card {
        border: 2px solid #1890ff !important;
        box-shadow: 0 4px 16px rgba(24, 144, 255, 0.15) !important;

        .device-card-content {
          .device-name {
            color: #1890ff;
            font-weight: 600;
          }
        }
      }

      // 卡片内部内容
      .device-card-content {
        .device-name {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .device-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          font-size: 12px;

          .device-version,
          .device-sn {
            color: #999;
          }
        }

        .device-model {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }

  .content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;

    .content-header {
      background: #fff;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;

      .header-title {
        margin-bottom: 16px;

        h2 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        p {
          color: #999;
          margin: 4px 0 0 0;
          font-size: 12px;
        }
      }

      // Description组件样式优化
      .device-desc {
        :deep(.ant-descriptions-item-label) {
          font-weight: 500;
          color: #333;
          background: #f8f9fa;
        }

        :deep(.ant-descriptions-item-content) {
          color: #666;
        }

        :deep(.ant-descriptions-row) {
          &:nth-child(even) {
            .ant-descriptions-item-label {
              background: #f0f2f5;
            }
          }
        }
      }
    }

    .data-card {
      background: #fff;
      border-radius: 8px;

      .data-tabs {
        margin-bottom: 16px;
      }

      // 时间选择器组样式优化
      .time-select-group {
        :deep(.ant-select-selector) {
          border-radius: 4px;
        }
        :deep(.ant-btn) {
          border-radius: 4px;
        }
        :deep(.ant-space) {
          width: 100%;
        }
      }

      .chart-container {
        margin-top: 8px;
      }
    }
  }
}
</style>