<!--
    德瑞恒
-->
<template>
  <!-- 根据当前用户的权限（如是否拥有 oa:enterprise:query 权限），决定所在元素（这里是 <a-form>）是否显示、禁用或隐藏。 -->
  <a-form class="smart-query-form" v-privilege="'oa:enterprise:query'">
    <a-row class="smart-query-form-row">
      <a-form-item label="关键字" class="smart-query-form-item">
        <a-input style="width: 300px" v-model:value="queryForm.keywords" placeholder="公司名称/负责人/联系电话/站点名称/创建人" />
      </a-form-item>

      <a-form-item label="创建时间" class="smart-query-form-item">
        <a-space direction="vertical" :size="12">
          <a-range-picker v-model:value="searchDate" :presets="defaultTimeRanges" @change="dateChange" />
        </a-space>
      </a-form-item>

      <a-form-item class="smart-query-form-item smart-margin-left10">
        <a-button-group>
          <a-button type="primary" @click="onSearch">
            <template #icon>
              <SearchOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="resetQuery">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </a-button-group>
      </a-form-item>
    </a-row>
  </a-form>

  <a-card size="small" :bordered="false" :hoverable="true">
    <a-row class="smart-table-btn-block">
      <div class="smart-table-operate-block">
        <!-- v-privilege 设置为 oa:enterprise:add，也就是说，当前用户除非具备了 'oa:enterprise:add' 这样的权限，才能够在前端看到这个组件，不然就看不到。起到了一个分组控制、权限控制的目的 -->
        <!-- <a-button @click="add()" v-privilege="'oa:enterprise:add'" type="primary">
          <template #icon>
            <PlusOutlined />
          </template>
          新增
        </a-button> -->
        <a-button @click="exportExcel()" v-privilege="'oa:enterprise:exportExcel'" type="primary">
          <template #icon>
            <FileExcelOutlined />
          </template>
          导出数据（带水印）
        </a-button>
      </div>
      <div class="smart-table-setting-block">
        <TableOperator v-model="columns" :tableId="TABLE_ID_CONST.BUSINESS.OA.ENTERPRISE" :refresh="ajaxQuery" />
      </div>
    </a-row>

    <a-table :scroll="{ x: 1300 }" size="small" :dataSource="tableData" :columns="columns" rowKey="deviceId"
      :pagination="false" :loading="tableLoading" bordered>
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.dataIndex === 'disabledFlag'">
          {{ text ? '禁用' : '启用' }}
        </template>
        <template v-if="column.dataIndex === 'enterpriseName'">
          <a-button type="link" @click="detail(record.enterpriseId)" :disabled="!$privilege('oa:enterprise:detail')">
            {{ record.enterpriseName }}
          </a-button>
        </template>
        <!-- 对"type" 这个变量，使用了 ENTERPRISE_TYPE_ENUM 枚举，则根据type的值显示不同的“文字” -->
        <template v-if="column.dataIndex === 'type'">
          <!-- <span>{{ $smartEnumPlugin.getDescByValue('DEVICE_TYPE_ENUM', text) }}</span> -->
          <!-- <a-tag :color="getTagColor(text)" :key="text"> -->
          <a-tag :color="$smartEnumPlugin.getColorByValue('DEVICE_TYPE_ENUM', text)" :key="text"
            style="display: block; text-align: center;">
            {{ $smartEnumPlugin.getDescByValue('DEVICE_TYPE_ENUM', text) }}
          </a-tag>
        </template>
        <template v-if="column.dataIndex === 'device_status'">
          <a-tag :color="$smartEnumPlugin.getColorByValue('DTU_STATUS_ENUM', text)" :key="text"
            style="display: block; text-align: center;">
            {{ $smartEnumPlugin.getDescByValue('DTU_STATUS_ENUM', text) }}
          </a-tag>
        </template>
       
        <template v-if="column.dataIndex === 'action'">
          <div class="smart-table-operate">
            <!-- <a-button @click="update(record.deviceId)" size="small" v-privilege="'oa:device:update'"
              type="link">编辑</a-button> -->
            <!-- <a-button @click="confirmDelete(record.deviceId)" size="small" danger v-privilege="'oa:device:delete'"
              type="link">删除</a-button> -->
          </div>
        </template>
      </template>
    </a-table>

    <div class="smart-query-table-page">
      <a-pagination showSizeChanger showQuickJumper show-less-items :pageSizeOptions="PAGE_SIZE_OPTIONS"
        :defaultPageSize="queryForm.pageSize" v-model:current="queryForm.pageNum" v-model:pageSize="queryForm.pageSize"
        :total="total" @change="ajaxQuery" :show-total="(total) => `共${total}条`" />
    </div>
    <!-- 将 operateRef 绑定到 EnterpriseOperate 组件 -->
    <!-- 所以可以通过 operateRef.value.showModal() 这个方法，调用 EnterpriseOperate内部的方法 -->
    <!-- 让 EnterpriseOperate可以作为Modal显隐 -->
    <EnterpriseOperate ref="operateRef" @refresh="ajaxQuery" />
  </a-card>
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { enterpriseApi } from '/@/api/business/oa/enterprise-api';
import { deviceApi } from '/@/api/business/oa/device-api';
import { influxDbApi } from '/@/api/business/oa/influx-api';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { useRouter } from 'vue-router';
import EnterpriseOperate from './components/enterprise-operate-modal.vue';
import { smartSentry } from '/@/lib/smart-sentry';
import { defaultTimeRanges } from '/@/lib/default-time-ranges';
import TableOperator from '/@/components/support/table-operator/index.vue';
import { TABLE_ID_CONST } from '/@/constants/support/table-id-const';
import { DEVICE_TYPE_ENUM } from '/@/constants/business/oa/enterprise-const';
import * as XLSX from 'xlsx';

// --------------------------- 企业表格 列 ---------------------------

const columns = ref([
  // dataIndex里面的内容还必须与数据库中的字段像符，不然信息对应不上，会造成解析错误
  // 而数据库中的字段是按照 enterprise_name这样的，这里用的 enterpriseName 驼峰模式，
  // 也就是说在 Java 后端的 Mybatis 中还要处理一下才能匹配上。
  {
    title: '设备名称',
    dataIndex: 'deviceName',
    minWidth: 100,
    ellipsis: true,
  },
  {
    title: '站点名称',
    dataIndex: 'stationName',
    minWidth: 100,
    ellipsis: true,
  },
  {
    title: '站点ID',
    dataIndex: 'stationId',
    minWidth: 60,
    ellipsis: true,
  },
  {
    title: '总发电量',
    dataIndex: '',
    minWidth: 100,
    ellipsis: true,
  },
  {
    title: '今日电量',
    dataIndex: '',
    minWidth: 100,
    ellipsis: true,
  },
  
  // {
  //   title: '版本号',
  //   width: 100,
  //   dataIndex: 'versionNumber',
  // },
  // {
  //   title: '设备型号',
  //   width: 100,
  //   dataIndex: 'deviceModel',
  // },
  // {
  //   title: '区域',
  //   width: 100,
  //   dataIndex: 'town',
  // },
  // {
  //   title: '统一社会信用代码',
  //   dataIndex: 'unifiedSocialCreditCode',
  //   minWidth: 170,
  //   ellipsis: true,
  // },
  // {
  //   title: '电站类型',
  //   dataIndex: 'type',
  //   width: 100,
  // },
  {
    title: 'dtu序列号',
    width: 150,
    dataIndex: 'dtuNumber',
    ellipsis: true,
  },
  // {
  //   title: '设备序列号',
  //   width: 100,
  //   dataIndex: 'serialNumber',
  // },
  // {
  //   title: '设备状态',
  //   width: 120,
  //   dataIndex: 'device_status',
  //   ellipsis: true,
  // },
  // {
  //   title: '邮箱',
  //   minWidth: 100,
  //   dataIndex: 'email',
  //   ellipsis: true,
  // },
  // {
  //   title: 'dtu状态',
  //   dataIndex: 'device_status',
  //   width: 150,
  // },
  // {
  //   title: '禁用标志',
  //   width: 50,
  //   dataIndex: 'disabledFlag',
  // },
  // {
  //   title: '创建人',
  //   width: 60,
  //   dataIndex: 'createUserName',
  // },
  {
    title: '上报时间',
    dataIndex: 'time',
    width: 150,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 150,
  },
  // {
  //   title: '装机容量',
  //   dataIndex: 'installedCapacity',
  //   width: 150,
  // },
  {
    title: '操作',
    dataIndex: 'action',
    // fixed: 'right',
    width: 100,
  },
]);

// ---------------------  设备类型tag标签 -------------------------
const getTagColor = (typeValue) => {
  switch (typeValue) {
    case DEVICE_TYPE_ENUM.CONTROLLER:
      return 'success';
    case DEVICE_TYPE_ENUM.METER:
      return 'blue';
  }
};


// --------------------------- 查询 ---------------------------

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
const tableData = ref([]);
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
  ajaxQuery();
}

function resetQuery() {
  searchDate.value = [];
  Object.assign(queryForm, queryFormState);
  ajaxQuery();
}

async function ajaxQuery() {
  try {
    tableLoading.value = true;
    /** 步骤一：查询Mysql */
    let responseModel = await deviceApi.pageQuery(queryForm);
    console.log('设备报表列表查询结果',responseModel);
    const list = responseModel.data.list;
    total.value = responseModel.data.total;
    // tableData.value = list;

    /** 步骤二：查询Influxdb */
    const dtuNumberList = list.map(item => item.dtuNumber); //提取dtu唯一标识数组
    //调用influxdb接口：批量查询这些DTU的最新状态（按照dtuNumber分组）
    const influxResult = await influxDbApi.getDtuRealTimeStatus(dtuNumberList);
    //转换为 Map 结构，方便快速匹配（key: dtuSerialNumber, value: 实时状态）
    const influxStatusMap = new Map();
    (influxResult.data || []).forEach(item => {
      const key = String(item.dtuNumber);
      influxStatusMap.set(key, item);
    });

    /** 步驟三：合并Mysql + Influxdb */
    const mergedTableData = list.map( mysqlItem => {
      const dtuKey = String(mysqlItem.dtuNumber);
      const influxItem = influxStatusMap.get(dtuKey) || {}
      return {
        ...mysqlItem,
        pv_power: influxItem.pv_power || '0.00', // 发电量
        pv_voltage: influxItem.pv_voltage || '0.00', // 发电电压
        output_voltage: influxItem.output_voltage || '0.00', // 输出电压
        output_current: influxItem.output_current || '0.00', // 输出电流
        dc_meter_power: influxItem.dc_meter_power || '0.00', // 直流电表功率
        device_status: influxItem.device_status || '未知', // 设备状态
        time: influxItem.time || '无数据', // 最新数据时间
        // 其他InfluxDB字段按需添加...
      }
    });
    
    /** 步驟五：給表格修改原数据 */
    console.log('表格数据是',mergedTableData);
    tableData.value = mergedTableData;
  } catch (e) {
    smartSentry.captureError(e);
  } finally {
    tableLoading.value = false;
  }
}

// --------------------------- 导出 ---------------------------
async function exportExcel() {
  // await enterpriseApi.exportExcel(queryForm);
  // 1. 定义「Excel表头」与「tableData数据字段」的映射关系
  // 格式：[Excel表头名称, 对应tableData的字段名, （可选）默认值]
  const headerMap = [
    ['设备名称', 'deviceName', ''],
    ['站点名称', 'stationName', ''],
    ['站点ID', 'stationId', ''],
    ['总发电量', 'pv_power', '0.00'], // 对应合并后的数据字段；若返回的数据中有 pv_power 字段，则取其值，否则默认显示 0.00
    ['今日电量', '', '0.00'], // 该字段无对应数据，默认显示0.00（可根据需求修改）
    ['dtu序列号', 'dtuNumber', ''],
    ['上报时间', 'time', '无数据'],
    ['创建时间', 'createTime', ''],
  ];

  // 2. 构造Excel导出数据（适配表头映射，处理空值）
  const exportData = tableData.value.map(item => {
    const row = {};
    headerMap.forEach(([headerName, field, defaultValue]) => {
      // 若有对应字段，取字段值；无字段/字段值为空时，取默认值
      row[headerName] = item[field] ?? defaultValue;
    });
    return row;
  });

  // 3. 若表格无数据，给出提示并返回
  if (exportData.length === 0) {
    message.warning('暂无数据可导出');
    return;
  }

  // 4. 创建工作簿（Workbook）和工作表（Worksheet）
  // 将导出数据转为工作表（自动识别表头）
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '设备数据'); // 工作表名称：设备数据
  const excelFileName = `设备数据_${new Date().getTime()}.xlsx`; // 文件名带时间戳，避免重复
  
  // 5. 触发Excel文件下载
  try {
    SmartLoading.show('正在导出Excel文件，请稍候...');
    XLSX.writeFile(workbook, excelFileName);
    // 导出成功提示
    message.success('Excel文件已成功创建，请点击“保存”！');
  } catch (error) {
    smartSentry.captureError(error);
    message.error('导出Excel文件失败，请稍后重试！');
  } finally {
    SmartLoading.hide();
  }
}

// --------------------------- 删除 ---------------------------

function confirmDelete(deviceId) {
  Modal.confirm({
    title: '确定要删除吗？',
    content: '删除后，该信息将不可恢复',
    okText: '删除',
    okType: 'danger',
    onOk() {
      del(deviceId);
    },
    cancelText: '取消',
    onCancel() { },
  });
}

async function del(deviceId) {
  try {
    SmartLoading.show();
    await deviceApi.delete(deviceId);
    message.success('删除成功');
    ajaxQuery();
  } catch (e) {
    smartSentry.captureError(e);
  } finally {
    SmartLoading.hide();
  }
}

// --------------------------- 增加、修改、详情 ---------------------------

let router = useRouter();
const operateRef = ref();
function add() {
  operateRef.value.showModal();
}

function update(deviceId) {
  operateRef.value.showModal(deviceId);
}

function detail(enterpriseId) {
  router.push({ path: '/oa/enterprise/enterprise-detail', query: { enterpriseId: enterpriseId } });
}

onMounted(ajaxQuery);
</script>
