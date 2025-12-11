<!--
  * 帮助文档 列表
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-07-21 21:55:12
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
-->
<template>
  <a-form class="smart-query-form" v-privilege="'support:helpDoc:query'">
    <a-row class="smart-query-form-row">
      <a-form-item label="关键字" class="smart-query-form-item">
        <a-input style="width: 300px" v-model:value="queryForm.keywords" placeholder="标题、作者" />
      </a-form-item>

      <a-form-item label="创建时间" class="smart-query-form-item">
        <a-range-picker :presets="defaultTimeRanges" v-model:value="createDate" @change="createDateChange"
          style="width: 220px" />
      </a-form-item>

      <a-form-item class="smart-query-form-item smart-margin-left10">
        <a-button-group>
          <a-button type="primary" @click="onSearch">
            <template #icon>
              <SearchOutlined />
            </template>
            查询
          </a-button>
          <a-button @click="onReload">
            <template #icon>
              <ReloadOutlined />
            </template>
            重置
          </a-button>
        </a-button-group>
      </a-form-item>
    </a-row>
  </a-form>
  <a-card size="small" :bordered="false">
    <a-row class="smart-table-btn-block">
      <div class="smart-table-operate-block">
        <a-button type="primary" @click="addOrUpdate()" v-privilege="'support:helpDoc:add'">
          <template #icon>
            <PlusOutlined />
          </template>
          新建
        </a-button>
      </div>
      <div class="smart-table-setting-block">
        <TableOperator v-model="tableColumns" :tableId="TABLE_ID_CONST.SUPPORT.HELP_DOC" :refresh="queryHelpDocList" />
      </div>
    </a-row>

    <!-- ***************** -->



    <!-- 设备卡片列表 -->
    <div class="device-grid">
      <a-card v-for="device in tableData" :key="device.helpDocId" class="device-card" :hoverable="true">
        <!-- 卡片标题 + 状态 -->
        <div class="card-header">
          <h3>{{ device.stationName }}</h3>
          <span class="status-tag" :class="device.status === 'online' ? 'online' : 'offline'">
            {{ device.status === 'online' ? '在线' : '离线' }}
          </span>
        </div>

        <!-- 设备图标 + 信息 -->
        <div class="card-content">
          <img :src="device.icon" class="device-icon" alt="设备图标" />
          <div class="device-info">
            <p>设备种类: <span>{{ device.type }}</span></p>
            <p>设备地址: <span>{{ device.address }}</span></p>
            <p>版本号: <span>{{ device.version || '暂无版本号' }}</span></p>
          </div>
        </div>

        <!-- 详情按钮 -->
        <a-button type="primary" class="detail-btn" @click="viewDetail(device)">详情</a-button>
      </a-card>

      <!-- 无数据提示 -->
      <div v-if="deviceList.length === 0" class="no-data">暂无设备数据</div>
    </div>









    <!-- ***************** -->
    <!-- <a-table rowKey="helpDocId" :columns="tableColumns" :scroll="{ x: 1000 }" :dataSource="tableData"
      :pagination="false" :loading="tableLoading" size="small" bordered>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'title'">
          <router-link tag="a" target="_blank"
            :to="{ path: '/help-doc/detail', query: { helpDocId: record.helpDocId } }">{{
              record.title
            }}</router-link>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <div class="smart-table-operate">
            <a-button type="link" @click="addOrUpdate(record.helpDocId)"
              v-privilege="'support:helpDoc:update'">编辑</a-button>
            <a-button type="link" danger @click="onDelete(record.helpDocId)"
              v-privilege="'support:helpDoc:delete'">删除</a-button>
          </div>
        </template>
      </template>
    </a-table> -->

    <div class="smart-query-table-page">
      <a-pagination showSizeChanger showQuickJumper show-less-items :pageSizeOptions="PAGE_SIZE_OPTIONS"
        :defaultPageSize="queryForm.pageSize" v-model:current="queryForm.pageNum" v-model:pageSize="queryForm.pageSize"
        :total="total" @change="queryHelpDocList" :show-total="(total) => `共${total}条`" />
    </div>


  </a-card>

  <HelpDocFormDrawer ref="helpDocFormDrawerRef" @reloadList="queryHelpDocList" />
</template>

<script setup>
import { message, Modal } from 'ant-design-vue';
import { onMounted, reactive, ref, watch } from 'vue';
import DeviceMonitorFormDrawer from './device-monitor-form-drawer.vue';
import { helpDocApi } from '/@/api/support/help-doc-api';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
import { smartSentry } from '/@/lib/smart-sentry';
import TableOperator from '/@/components/support/table-operator/index.vue';
import { defaultTimeRanges } from '/@/lib/default-time-ranges';
import { TABLE_ID_CONST } from '/@/constants/support/table-id-const';
import { deviceApi } from '/@/api/business/oa/device-api';



// ***************
// 搜索表单数据
const searchForm = ref({
  deviceName: '',
  dtuDevice: '',
  deviceType: '',
  deviceStatus: ''
});

// 设备列表（模拟数据，实际从接口获取）
const deviceList = ref([
  {
    id: 1,
    name: '泸定超级基站综合机房',
    status: 'online',
    icon: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fcbu01.alicdn.com%2Fimg%2Fibank%2FO1CN016JXjpG1i2dpKWghSU_%21%212208361344355-0-cib.jpg&refer=http%3A%2F%2Fcbu01.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1767336764&t=b2493be8adec3d10733d16ebc98160c5', // 实际替换为设备图标URL
    type: '控制器',
    address: '1',
    version: '1.33'
  },
  {
    id: 2,
    name: '泸定超级基站综合机房',
    status: 'online',
    icon: 'https://q4.itc.cn/images01/20250708/34304cf782ce40d5b8283c685563c2e0.jpeg', // 实际替换为设备图标URL
    type: '电表',
    address: '2',
    version: ''
  }
]);



// 清空事件
const onReset = () => {
  searchForm.value = {
    deviceName: '',
    dtuDevice: '',
    deviceType: '',
    deviceStatus: ''
  };
  // 实际项目中这里恢复原始设备列表
};

// 查看详情
const viewDetail = (device) => {
  console.log('查看设备详情:', device);
  // 实际项目中跳转到详情页或打开弹窗
};

// ***************

const props = defineProps({
  // 目录id
  helpDocCatalogId: Number,
});

const queryFormState = {
  helpDocCatalogId: props.helpDocCatalogId, //目录
  keywords: '', //标题、作者
  createTimeBegin: null, //创建-开始时间
  createTimeEnd: null, //创建-截止时间
  pageNum: 1,
  pageSize: PAGE_SIZE,
};
const queryForm = reactive({ ...queryFormState });

const tableColumns = ref([
  {
    title: `标题`,
    dataIndex: 'title',
    ellipsis: true,
  },
  {
    title: '目录',
    dataIndex: 'helpDocCatalogName',
    width: 120,
    ellipsis: true,
  },
  {
    title: `作者`,
    dataIndex: 'author',
    width: 110,
    ellipsis: true,
  },
  {
    title: '排序',
    dataIndex: 'sort',
    width: 90,
  },
  {
    title: '页面浏览量',
    dataIndex: 'pageViewCount',
    width: 90,
  },
  {
    title: '用户浏览量',
    dataIndex: 'userViewCount',
    width: 90,
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 150,
  },
  {
    title: '操作',
    dataIndex: 'action',
    fixed: 'right',
    width: 90,
  },
]);

// ------------------ 查询相关 ------------------

const tableData = ref([]);
const total = ref(0);
const tableLoading = ref(false);

onMounted(() => {
  queryHelpDocList();
});

// 查询列表
async function queryHelpDocList() {
  try {
    tableLoading.value = true;
    // const result = await helpDocApi.query(queryForm);
    let result = await deviceApi.pageQuery(queryForm);
    console.log('result is', result);
    tableData.value = result.data.list;
    total.value = result.data.total;
  } catch (err) {
    smartSentry.captureError(err);
  } finally {
    tableLoading.value = false;
  }
}

// 点击查询
function onSearch() {
  queryForm.pageNum = 1;
  queryHelpDocList();
}

// 点击重置
function onReload() {
  Object.assign(queryForm, queryFormState);
  publishDate.value = [];
  createDate.value = [];
  queryHelpDocList();
}

// 发布日期选择
const publishDate = ref([]);
function publishDateChange(dates, dateStrings) {
  queryForm.publishTimeBegin = dateStrings[0];
  queryForm.publishTimeEnd = dateStrings[1];
}
// 创建日期选择
const createDate = ref([]);
function createDateChange(dates, dateStrings) {
  queryForm.createTimeBegin = dateStrings[0];
  queryForm.createTimeEnd = dateStrings[1];
}

// ------------------ 新建、编辑 ------------------

// 新建、编辑
const helpDocFormDrawerRef = ref();
function addOrUpdate(helpDocId) {
  helpDocFormDrawerRef.value.showModal(helpDocId);
}

// ------------------ 删除 ------------------

// 删除
function onDelete(helpDocId) {
  Modal.confirm({
    title: '提示',
    content: '确认删除此数据吗?',
    onOk() {
      deleteHelpDoc(helpDocId);
    },
  });
}

// 删除API
async function deleteHelpDoc(helpDocId) {
  try {
    tableLoading.value = true;
    await helpDocApi.delete(helpDocId);
    message.success('删除成功');
    queryHelpDocList();
  } catch (err) {
    smartSentry.captureError(err);
  } finally {
    tableLoading.value = false;
  }
}

watch(
  () => props.helpDocCatalogId,
  () => {
    queryForm.helpDocCatalogId = props.helpDocCatalogId;
    onSearch();
  },
  { immediate: true }
);
</script>

<style lang="less" scoped>


// 宫格布局容器
.device-grid {
  display: grid;
  // 自动填充列，最小宽度280px，最大1fr
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  // 列间距和行间距
  gap: 20px;

  .device-card {
    height: 100%;
    padding: 16px;
    display: flex;
    flex-direction: column;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 16px;
      }

      .status-tag {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        &.online {
          background: #f0f9eb;
          color: #52c41a;
        }
        &.offline {
          background: #fff1f0;
          color: #ff4d4f;
        }
      }
    }

    .card-content {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex: 1;

      .device-icon {
        width: 80px;
        height: 100px;
        object-fit: contain;
        flex-shrink: 0;
      }

      .device-info {
        flex: 1;
        p {
          margin: 6px 0;
          font-size: 14px;
          span {
            font-weight: 500;
            margin-left: 4px;
          }
        }
      }
    }

    .detail-btn {
      width: 100%;
      margin-top: auto;
    }
  }

  .no-data {
    grid-column: 1 / -1; // 跨所有列
    text-align: center;
    margin: 40px auto;
    color: #999;
  }
}

</style>
