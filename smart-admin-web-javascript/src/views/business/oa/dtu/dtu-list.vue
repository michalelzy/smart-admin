<!--
  * 系统更新日志
  *
  * @Author:    卓大
  * @Date:      2022-09-26 14:53:50
  * @Copyright  1024创新实验室
-->
<template>
  <!---------- 查询表单form begin ----------->
  <a-form class="smart-query-form" v-privilege="'oa:dtu:query'">
    <a-row class="smart-query-form-row">
      <a-form-item label="网络状态" class="smart-query-form-item">
        <SmartEnumSelect width="200px" v-model:value="queryForm.deviceStatus" enumName="DTU_STATUS_STR_ENUM" placeholder="网络状态" />
      </a-form-item>
      <a-form-item label="关键字" class="smart-query-form-item">
        <a-input style="width: 200px" v-model:value="queryForm.keyword" placeholder="关键字" />
      </a-form-item>
      <!-- <a-form-item label="发布日期" class="smart-query-form-item">
        <a-range-picker v-model:value="queryForm.publicDate" :presets="defaultTimeRanges" style="width: 240px"
          @change="onChangePublicDate" />
      </a-form-item> -->
      <a-form-item label="创建时间" class="smart-query-form-item">
        <a-date-picker valueFormat="YYYY-MM-DD" v-model:value="queryForm.createTime" style="width: 150px" />
      </a-form-item>
      <a-form-item class="smart-query-form-item">
        <a-button-group>
          <a-button type="primary" @click="filterLocalData">
            <template #icon>
              <SearchOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="resetQuery" class="smart-margin-left10">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </a-button-group>
      </a-form-item>
    </a-row>
  </a-form>
  <!---------- 查询表单form end ----------->

  <a-card size="small" :bordered="false" :hoverable="true">
    <!---------- 表格操作行 begin ----------->
    <a-row class="smart-table-btn-block">
      <div class="smart-table-operate-block">
        <!-- <a-button @click="showForm" type="primary" v-privilege="'support:changeLog:add'">
          <template #icon>
            <PlusOutlined />
          </template>
          新建
        </a-button> -->
        <!-- <a-button @click="confirmBatchDelete" danger :disabled="selectedRowKeyList.length === 0"
          v-privilege="'support:changeLog:batchDelete'">
          <template #icon>
            <DeleteOutlined />
          </template>
          批量删除
        </a-button> -->
      </div>
      <div class="smart-table-setting-block">
        <TableOperator v-model="columns" :tableId="null" :refresh="queryData" />
      </div>
    </a-row>
    <!---------- 表格操作行 end ----------->

    <!---------- 表格 begin ----------->
    <a-table size="small" :dataSource="tableData" :columns="columns" rowKey="changeLogId" bordered :pagination="false" v-privilege="'oa:dtu:query'" :loading="tableLoading"
      :row-selection="{ selectedRowKeys: selectedRowKeyList, onChange: onSelectChange }">
      <template #bodyCell="{ text, record, column }">
        <template v-if="column.dataIndex === 'stationName'">
          <a-button @click="showModal(record)" type="link">{{ text }}</a-button>
        </template>
        <template v-if="column.dataIndex === 'type'">
          <a-tag :color="$smartEnumPlugin.getColorByValue('DEVICE_TYPE_ENUM', text)" :key="text">
            <template #icon>
              <check-circle-outlined />
            </template>
            {{ $smartEnumPlugin.getDescByValue('DEVICE_TYPE_ENUM', text) }}
          </a-tag>
        </template>

        <template v-if="column.dataIndex === 'device_status'">
          <a-tag :color="$smartEnumPlugin.getColorByValue('DTU_STATUS_ENUM', text)" :key="text" style="display: block; text-align: center;">
            <template #icon>
              <!-- <check-circle-outlined /> -->
            </template>
            {{ $smartEnumPlugin.getDescByValue('DTU_STATUS_ENUM', text) }}
          </a-tag>
        </template>
        <template v-if="column.dataIndex === 'action'">
          <div class="smart-table-operate">
            <!-- <a-button @click="showForm(record)" type="link" v-privilege="'support:changeLog:update'">编辑</a-button>
            <a-button @click="onDelete(record)" danger type="link"
              v-privilege="'support:changeLog:delete'">删除</a-button> -->
          </div>
        </template>
      </template>
    </a-table>
    <!---------- 表格 end ----------->

    <div class="smart-query-table-page">
      <a-pagination showSizeChanger showQuickJumper show-less-items :pageSizeOptions="PAGE_SIZE_OPTIONS"
        :defaultPageSize="queryForm.pageSize" v-model:current="queryForm.pageNum" v-model:pageSize="queryForm.pageSize"
        :total="total" @change="queryData" :show-total="(total) => `共${total}条`" />
    </div>

    <ChangeLogForm ref="formRef" @reloadList="queryData" />

    <ChangeLogModal ref="modalRef" />
  </a-card>
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { changeLogApi } from '/@/api/support/change-log-api';
import { deviceApi } from '/@/api/business/oa/device-api';
import { influxDbApi } from '/@/api/business/oa/influx-api';
import { PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { smartSentry } from '/@/lib/smart-sentry';
import TableOperator from '/@/components/support/table-operator/index.vue';
import DictSelect from '/@/components/support/dict-select/index.vue';
import SmartEnumSelect from '/@/components/framework/smart-enum-select/index.vue';
import { defaultTimeRanges } from '/@/lib/default-time-ranges';
import ChangeLogModal from './dtu-modal.vue';
import ChangeLogForm from './dtu-form.vue';
import { filter } from 'lodash';
// ---------------------------- 表格列 ----------------------------

const columns = ref([
  {
    title: '电站名称',
    dataIndex: 'stationName',
    ellipsis: true,
  },

  {
    title: '设备名称',
    dataIndex: 'deviceName',
    ellipsis: true,
  },

  {
    title: '设备编号',
    dataIndex: 'dtuNumber',
    ellipsis: true,
  },
  {
    title: '设备类型',
    dataIndex: 'type',
    ellipsis: true,
  },
  {
    title: '网络状态',
    dataIndex: 'device_status',
    ellipsis: true,
    width:90
  },
  // {
  //   title: '跳转链接',
  //   dataIndex: 'link',
  //   ellipsis: true,
  // },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    ellipsis: true,
  },
  {
    title: '更新时间',
    dataIndex: 'time',
    ellipsis: true,
  },
  {
    title: '操作',
    dataIndex: 'action',
    fixed: 'right',
    width: 90,
  },
]);

// ---------------------------- 查询数据表单和方法 ----------------------------

const queryFormState = {
  type: undefined, //更新类型:[1:特大版本功能更新;2:功能更新;3:bug修复]
  keyword: undefined, //关键字
  publicDate: [], //发布日期
  publicDateBegin: undefined, //发布日期 开始
  publicDateEnd: undefined, //发布日期 结束
  createTime: undefined, //创建时间
  link: undefined, //跳转链接
  pageNum: 1,
  pageSize: 10,
  deviceStatus:undefined,
};
// 查询表单form
const queryForm = reactive({ ...queryFormState });
// 表格加载loading
const tableLoading = ref(false);
// 表格数据
const tableData = ref([]);
// 总数
const total = ref(0);

// 重置查询条件
function resetQuery() {
  let pageSize = queryForm.pageSize;
  Object.assign(queryForm, queryFormState);
  queryForm.pageSize = pageSize;
  queryData();
}

// 搜索
function onSearch() {
  queryForm.pageNum = 1;
  queryData();
}

// 查询数据
async function queryData() {
  tableLoading.value = true;
  try {
    /** 步骤1：查询MySQL中所有DTU设备的基础信息（分页查询） */
    // let queryResult = await changeLogApi.queryPage(queryForm);
    let queryResult = await deviceApi.queryDTU(queryForm);
    const dtuList = queryResult.data.list;
    console.log('dtu响应是：', queryResult);
    // tableData.value = queryResult.data.list;
    total.value = queryResult.data.total;

    /** 步骤2：提取所有DTU唯一标识，批量查询influxDB实时状态 */
    const dtuNumberList = dtuList.map(item => item.dtuNumber); //提取dtu唯一标识数组
    console.log('dtuNumberList', dtuNumberList);
    //调用influxdb接口：批量查询这些DTU的最新状态（按照dtuNumber分组）
    const influxResult = await influxDbApi.getDtuRealTimeStatus(dtuNumberList);
    console.log('influx的响应是： ', influxResult);
    //转换为 Map 结构，方便快速匹配（key: dtuSerialNumber, value: 实时状态）
    const influxStatusMap = new Map();
    (influxResult.data || []).forEach(item => {
      const key = String(item.dtuNumber);
      influxStatusMap.set(key, item);
    });
    console.log('Map is', influxStatusMap);

    /**步骤4：合并Mysql静态数据 + influxdb实时数据，保证一一对应 */
    const mergedTableData = dtuList.map(mysqlItem => {
      //统一MySQL中的dtuNumber字符串，和Map的key类型一致
      const dtuKey = String(mysqlItem.dtuNumber);
      //匹配InfluxDB数据，无数据则返回空对象（兜底）
      const influxItem = influxStatusMap.get(dtuKey) || {};
      //合并：MySQL静态数据为基础，覆盖/新增InfluxDB实时字段
      return {
        ...mysqlItem,
        // InfluxDB实时字段（加兜底，避免表格显示undefined）
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

    /** 步骤5：过滤合并数据（没有过滤条件则不用过滤） */
    /** 步驟5：給修改表格数据源 */
    console.log('mergedTableData',mergedTableData);
    tableData.value = mergedTableData;
    allDtuData.value = mergedTableData;
    
  } catch (e) {
    smartSentry.captureError(e);
  } finally {
    tableLoading.value = false;
  }
}

const allDtuData = ref([]);

function filterLocalData() {
  let filteredData = [...allDtuData.value];
  //过滤条件1：网络状态
  if (queryForm.deviceStatus !== undefined && queryForm.deviceStatus !== null) {
    const targetStatus = queryForm.deviceStatus;
    filteredData = filteredData.filter(item => item.device_status === targetStatus);
    tableData.value = filteredData;
    console.log('targetStatu is ', targetStatus,typeof targetStatus);
  }
  // 过滤条件2：关键字（新增核心逻辑）
  if (queryForm.keyword && queryForm.keyword.trim() !== '') {
    const keyword = queryForm.keyword.trim().toLowerCase(); // 转小写，忽略大小写
    filteredData = filteredData.filter(item => {
      // 匹配电站名称、设备名称、设备编号（包含关键字即符合条件）
      return (item.stationName || '').toLowerCase().includes(keyword) ||
             (item.deviceName || '').toLowerCase().includes(keyword) ||
             (item.dtuNumber || '').toLowerCase().includes(keyword);
    });
    tableData.value = filteredData;
  }
}

// ==============================================================

function onChangePublicDate(dates, dateStrings) {
  queryForm.publicDateBegin = dateStrings[0];
  queryForm.publicDateEnd = dateStrings[1];
}

onMounted(queryData);

// ---------------------------- 查看 ----------------------------
const modalRef = ref();

function showModal(data) {
  modalRef.value.show(data);
}

// ---------------------------- 添加/修改 ----------------------------
const formRef = ref();

function showForm(data) {
  formRef.value.show(data);
}

// ---------------------------- 单个删除 ----------------------------
//确认删除
function onDelete(data) {
  Modal.confirm({
    title: '提示',
    content: '确定要删除选吗?',
    okText: '删除',
    okType: 'danger',
    onOk() {
      requestDelete(data);
    },
    cancelText: '取消',
    onCancel() { },
  });
}

//请求删除
async function requestDelete(data) {
  SmartLoading.show();
  try {
    await changeLogApi.delete(data.changeLogId);
    message.success('删除成功');
    queryData();
  } catch (e) {
    smartSentry.captureError(e);
  } finally {
    SmartLoading.hide();
  }
}

// ---------------------------- 批量删除 ----------------------------

// 选择表格行
const selectedRowKeyList = ref([]);

function onSelectChange(selectedRowKeys) {
  selectedRowKeyList.value = selectedRowKeys;
}

// 批量删除
function confirmBatchDelete() {
  Modal.confirm({
    title: '提示',
    content: '确定要批量删除这些数据吗?',
    okText: '删除',
    okType: 'danger',
    onOk() {
      requestBatchDelete();
    },
    cancelText: '取消',
    onCancel() { },
  });
}

//请求批量删除
async function requestBatchDelete() {
  try {
    SmartLoading.show();
    await changeLogApi.batchDelete(selectedRowKeyList.value);
    message.success('删除成功');
    queryData();
  } catch (e) {
    smartSentry.captureError(e);
  } finally {
    SmartLoading.hide();
  }
}
</script>
