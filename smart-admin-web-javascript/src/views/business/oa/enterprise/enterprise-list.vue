<!--
  * 公司列表
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-08-15 20:15:49
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
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
        <a-button @click="add()" v-privilege="'oa:enterprise:add'" type="primary">
          <template #icon>
            <PlusOutlined />
          </template>
          新建电站
        </a-button>
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

    <a-table
      :scroll="{ x: 1300 }"
      size="small"
      :dataSource="tableData"
      :columns="columns"
      rowKey="enterpriseId"
      :pagination="false"
      :loading="tableLoading"
      bordered
    >
      <template #bodyCell="{ column, record, text }">
        <template v-if="column.dataIndex === 'disabledFlag'">
          {{ text ? '禁用' : '启用' }}
        </template>
        <template v-if="column.dataIndex === 'enterpriseName'">
          <a-button type="link" @click="detail(record.enterpriseId)" :disabled="!$privilege('oa:enterprise:detail')">
            {{ record.enterpriseName }}
          </a-button>
        </template>
        <template v-if="column.dataIndex === 'type'">
          <span>{{ $smartEnumPlugin.getDescByValue('ENTERPRISE_TYPE_ENUM', text) }}</span>
        </template>
        <template v-if="column.dataIndex === 'action'">
          <div class="smart-table-operate">
            <a-button @click="update(record.enterpriseId)" size="small" v-privilege="'oa:enterprise:update'" type="link">编辑</a-button>
            <a-button @click="confirmDelete(record.enterpriseId)" size="small" danger v-privilege="'oa:enterprise:delete'" type="link">删除</a-button>
          </div>
        </template>
      </template>
    </a-table>

    <div class="smart-query-table-page">
      <a-pagination
        showSizeChanger
        showQuickJumper
        show-less-items
        :pageSizeOptions="PAGE_SIZE_OPTIONS"
        :defaultPageSize="queryForm.pageSize"
        v-model:current="queryForm.pageNum"
        v-model:pageSize="queryForm.pageSize"
        :total="total"
        @change="ajaxQuery"
        :show-total="(total) => `共${total}条`"
      />
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
  import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '/@/constants/common-const';
  import { useRouter } from 'vue-router';
  import EnterpriseOperate from './components/enterprise-operate-modal.vue';
  import { smartSentry } from '/@/lib/smart-sentry';
  import { defaultTimeRanges } from '/@/lib/default-time-ranges';
  import TableOperator from '/@/components/support/table-operator/index.vue';
  import { TABLE_ID_CONST } from '/@/constants/support/table-id-const';

  // --------------------------- 企业表格 列 ---------------------------

  const columns = ref([
    // dataIndex里面的内容还必须与数据库中的字段像符，不然信息对应不上，会造成解析错误
    // 而数据库中的字段是按照 enterprise_name这样的，这里用的 enterpriseName 驼峰模式，
    // 也就是说在 Java 后端的 Mybatis 中还要处理一下才能匹配上。
    {
      title: '公司名称',
      dataIndex: 'enterpriseName',
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
      title: '省份',
      width: 100,
      dataIndex: 'cityName',
    },
    {
      title: '区域',
      width: 100,
      dataIndex: 'districtName',
    },
    {
      title: '详细位置',
      width: 100,
      dataIndex: 'address',
    },
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
    {
      title: '电站类型',
      dataIndex: 'type',
      width: 100,
    },
    {
      title: '负责人',
      width: 100,
      dataIndex: 'contact',
      ellipsis: true,
    },
    {
      title: '联系人电话',
      width: 120,
      dataIndex: 'contactPhone',
      ellipsis: true,
    },
    // {
    //   title: '邮箱',
    //   minWidth: 100,
    //   dataIndex: 'email',
    //   ellipsis: true,
    // },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      width: 150,
    },
    {
      title: '状态',
      width: 50,
      dataIndex: 'disabledFlag',
    },
    {
      title: '创建人',
      width: 60,
      dataIndex: 'createUserName',
    },
    // {
    //   title: '创建时间',
    //   dataIndex: 'createTime',
    //   width: 150,
    // },
    {
      title: '装机容量',
      dataIndex: 'installedCapacity',
      width: 150,
    },
    {
      title: '操作',
      dataIndex: 'action',
      // fixed: 'right',
      width: 100,
    },
  ]);

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
      let responseModel = await enterpriseApi.pageQuery(queryForm);
      const list = responseModel.data.list;
      console.log(list);
      total.value = responseModel.data.total;
      tableData.value = list;
    } catch (e) {
      smartSentry.captureError(e);
    } finally {
      tableLoading.value = false;
    }
  }

  // --------------------------- 导出 ---------------------------
  async function exportExcel() {
    await enterpriseApi.exportExcel(queryForm);
  }

  // --------------------------- 删除 ---------------------------

  function confirmDelete(enterpriseId) {
    Modal.confirm({
      title: '确定要删除吗？',
      content: '删除后，该信息将不可恢复',
      okText: '删除',
      okType: 'danger',
      onOk() {
        del(enterpriseId);
      },
      cancelText: '取消',
      onCancel() {},
    });
  }

  async function del(enterpriseId) {
    try {
      SmartLoading.show();
      await enterpriseApi.delete(enterpriseId);
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

  function update(enterpriseId) {
    operateRef.value.showModal(enterpriseId);
  }

  function detail(enterpriseId) {
    router.push({ path: '/oa/enterprise/enterprise-detail', query: { enterpriseId: enterpriseId } });
  }

  onMounted(ajaxQuery);
</script>
