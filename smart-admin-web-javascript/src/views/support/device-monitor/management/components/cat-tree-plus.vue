<!--
  * 目录树
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-07-21 21:55:12
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
-->
<template>
  <a-card class="tree-container" size="small">
    <a-row>
      <a-input v-model:value.trim="keywords" placeholder="请输入目录名称" />
    </a-row>
    <a-row class="sort-flag-row" v-if="props.showMenu">
      <span>
        排序
        <template v-if="showSortFlag"> （越小越靠前） </template>
        ：<a-switch v-model:checked="showSortFlag" />
      </span>
      <a-button type="primary" @click="addTop" size="small"
        v-privilege="'support:helpDocCatalog:addCategory'">新建</a-button>
    </a-row>
    <a-tree v-if="!_.isEmpty(helpDocCatalogTreeData)" v-model:selectedKeys="selectedKeys"
      v-model:checkedKeys="checkedKeys" class="tree" :treeData="helpDocCatalogTreeData"
      :fieldNames="{ title: 'name', icon: 'icon', key: 'helpDocCatalogId', value: 'helpDocCatalogId' }"
      style="width: 100%; overflow-x: auto" :style="[!height ? '' : { height: `${height}px`, overflowY: 'auto' }]"
      :showLine="props.checkable" :checkable="props.checkable" :checkStrictly="props.checkStrictly"
      :selectable="!props.checkable" :defaultExpandAll="true" @select="treeSelectChange">
      //TODO:
     
      <template #title="item">
        <a-popover placement="right" v-if="props.showMenu">
          <template #content>
            <div style="display: flex; flex-direction: column">
              <a-button type="text" @click="addHelpDocCatalog(item.dataRef)"
                v-privilege="'support:helpDocCatalog:addCategory'">添加下级</a-button>
              <a-button type="text" @click="updateHelpDocCatalog(item.dataRef)"
                v-privilege="'support:helpDocCatalog:edit'">修改</a-button>
              <a-button type="text" v-if="item.helpDocCatalogId !== topHelpDocCatalogId"
                @click="deleteHelpDocCatalog(item.helpDocCatalogId)"
                v-privilege="'support:helpDocCatalog:delete'">删除</a-button>
            </div>
          </template>
          <!-- 修改：显示名称 + 最终叶子节点数量 -->    
          <span>
            {{ item.name }}
            <template v-if="item.stationCount !== undefined && item.stationCount > 0">
              <span class="count-badge">({{ item.stationCount }})</span>
            </template>
            <template v-if="showSortFlag">
              <span class="sort-span">({{ item.sort }})</span>
            </template>
          </span>
        </a-popover>
        <!--  -->
        <div v-else>
          {{ item.name }}
          <template v-if="item.stationCount !== undefined && item.stationCount > 0">
            <span class="count-badge">({{ item.stationCount }})</span>
          </template>
          <!--显示排序字段-->
          <template v-if="showSortFlag">
            <span class="sort-span">({{ item.sort }})</span>
          </template>
        </div>
      </template>
    </a-tree>
    <div class="no-data" v-else>暂无结果</div>
    <!-- 添加编辑目录弹窗 -->
    <HelpDocCatalogFormModal ref="helpDocCatalogFormModal" @refresh="refresh" />
  </a-card>
</template>
<script setup>
import { ExclamationCircleOutlined, GithubOutlined } from '@ant-design/icons-vue';
import { ref } from 'vue';
import { onUnmounted, watch } from 'vue';
import { Modal } from 'ant-design-vue';
import _ from 'lodash';
import { createVNode, onMounted } from 'vue';
import HelpDocCatalogFormModal from './device-monitor-catalog-form-modal.vue';
import { helpDocCatalogApi } from '/@/api/support/help-doc-catalog-api';
import { SmartLoading } from '/@/components/framework/smart-loading';
import helpDocCatalogEmitter from '../device-monitor-mitt';
import { smartSentry } from '/@/lib/smart-sentry';
import {
  DingdingOutlined   // 默认文件夹图标
} from '@ant-design/icons-vue';

const HELP_DOC_CATALOG_PARENT_ID = 0;

// ----------------------- 组件参数 ---------------------

const props = defineProps({
  // 是否可以选中
  checkable: {
    type: Boolean,
    default: false,
  },
  // 父子节点选中状态不再关联
  checkStrictly: {
    type: Boolean,
    default: false,
  },
  // 树高度 超出出滚动条
  height: Number,
  // 显示菜单
  showMenu: {
    type: Boolean,
    default: true,
  },
});

// ----------------------- 目录树的展示 ---------------------
const topHelpDocCatalogId = ref();
// 所有目录列表
const helpDocCatalogList = ref([]);
// 目录树形数据
const helpDocCatalogTreeData = ref([]);
// 存放目录id和目录，用于查找
const idInfoMap = ref(new Map());
// 是否显示排序字段
const showSortFlag = ref(false);

onMounted(() => {
  queryHelpDocCatalogTree();
});

// 刷新
async function refresh() {
  await queryHelpDocCatalogTree();
  if (currentSelectedHelpDocCatalogId.value) {
    selectTree(currentSelectedHelpDocCatalogId.value);
  }
}

// 查询目录列表并构建 目录树
async function queryHelpDocCatalogTree() {
  let res = await helpDocCatalogApi.getAll();
  let data = res.data;
  helpDocCatalogList.value = data;

  // 构建树形结构并计算基站数量
  helpDocCatalogTreeData.value = buildHelpDocCatalogTree(data, HELP_DOC_CATALOG_PARENT_ID);

  data.forEach((e) => {
    idInfoMap.value.set(e.helpDocCatalogId, e);
  });

  // 默认显示 最顶级ID为列表中返回的第一条数据的ID
  if (!_.isEmpty(helpDocCatalogTreeData.value) && helpDocCatalogTreeData.value.length > 0) {
    topHelpDocCatalogId.value = helpDocCatalogTreeData.value[0].helpDocCatalogId;
    selectTree(helpDocCatalogTreeData.value[0].helpDocCatalogId);
  }
}

// 判断节点是否是基站节点（最终叶子节点）
function isStationNode(nodeName) {
  // 根据名称特征判断是否是基站节点
  // 可以根据实际业务规则修改判断条件
  const stationKeywords = ['基站', '站点', '机房', '基站站', 'superstation', '资源点', '站'];
  return stationKeywords.some(keyword =>
    nodeName.toLowerCase().includes(keyword.toLowerCase())
  );
}

// 递归计算基站数量（只统计真正的基站节点）
function calculateStationCount(node, allData) {
  // 如果当前节点是基站节点，返回1
  if (isStationNode(node.name)) {
    return 1;
  }

  // 如果有子节点，递归计算子节点中的基站数量
  if (node.children && node.children.length > 0) {
    let stationCount = 0;

    node.children.forEach(child => {
      stationCount += calculateStationCount(child, allData);
    });

    return stationCount;
  }

  // 既不是基站节点也没有子节点，返回0
  return 0;
}

// 构建目录树并添加基站数量统计
function buildHelpDocCatalogTree(data, parentId) {
  let children = data.filter((e) => e.parentId === parentId) || [];
  children = _.sortBy(children, (e) => e.sort);

  children.forEach((e) => {
    // 递归构建子节点
    e.children = buildHelpDocCatalogTree(data, e.helpDocCatalogId);

    // 计算基站数量（只统计真正的基站节点）
    e.stationCount = calculateStationCount(e, data);

    // 如果是基站节点本身，不显示数量
    if (isStationNode(e.name)) {
      e.stationCount = 0;
      e.scopedSlots = { icon: 'stationIcon' }
    }
  });

  updateHelpDocCatalogPreIdAndNextId(children);
  return children;
}

// 更新树的前置id和后置id
function updateHelpDocCatalogPreIdAndNextId(data) {
  for (let index = 0; index < data.length; index++) {
    if (index === 0) {
      data[index].nextId = data.length > 1 ? data[1].helpDocCatalogId : undefined;
      continue;
    }

    if (index === data.length - 1) {
      data[index].preId = data[index - 1].helpDocCatalogId;
      data[index].nextId = undefined;
      continue;
    }

    data[index].preId = data[index - 1].helpDocCatalogId;
    data[index].nextId = data[index + 1].helpDocCatalogId;
  }
}

// ----------------------- 树的选中 ---------------------
const selectedKeys = ref([]);
const checkedKeys = ref([]);
const breadcrumb = ref([]);
const currentSelectedHelpDocCatalogId = ref();
const selectedHelpDocCatalogChildren = ref([]);

helpDocCatalogEmitter.on('selectTree', selectTree);

function selectTree(id) {
  selectedKeys.value = [id];
  treeSelectChange(selectedKeys.value);
}

function treeSelectChange(idList) {
  if (_.isEmpty(idList)) {
    breadcrumb.value = [];
    selectedHelpDocCatalogChildren.value = [];
    return;
  }
  let id = idList[0];
  selectedHelpDocCatalogChildren.value = helpDocCatalogList.value.filter((e) => e.parentId === id);
  let filterHelpDocCatalogList = [];
  recursionFilterHelpDocCatalog(filterHelpDocCatalogList, id, true);
  breadcrumb.value = filterHelpDocCatalogList.map((e) => e.name);
}

// -----------------------  筛选 ---------------------
const keywords = ref('');
watch(
  () => keywords.value,
  () => {
    onSearch();
  }
);

// 筛选
function onSearch() {
  if (!keywords.value) {
    helpDocCatalogTreeData.value = buildHelpDocCatalogTree(helpDocCatalogList.value, HELP_DOC_CATALOG_PARENT_ID);
    return;
  }
  let originData = helpDocCatalogList.value.concat();
  if (!originData) {
    return;
  }
  // 筛选出名称符合的目录
  let filterDepartmenet = originData.filter((e) => e.name.indexOf(keywords.value) > -1);
  let filterHelpDocCatalogList = [];
  // 循环筛选出的目录 构建目录树
  filterDepartmenet.forEach((e) => {
    recursionFilterHelpDocCatalog(filterHelpDocCatalogList, e.helpDocCatalogId, false);
  });

  helpDocCatalogTreeData.value = buildHelpDocCatalogTree(filterHelpDocCatalogList, HELP_DOC_CATALOG_PARENT_ID);
}

// 根据ID递归筛选目录
function recursionFilterHelpDocCatalog(resList, id, unshift) {
  let info = idInfoMap.value.get(id);
  if (!info || resList.some((e) => e.helpDocCatalogId === id)) {
    return;
  }
  if (unshift) {
    resList.unshift(info);
  } else {
    resList.push(info);
  }
  if (info.parentId && info.parentId !== 0) {
    recursionFilterHelpDocCatalog(resList, info.parentId, unshift);
  }
}

// ----------------------- 表单操作：添加目录/修改目录/删除目录/上下移动 ---------------------
const helpDocCatalogFormModal = ref();

// 添加
function addHelpDocCatalog(e) {
  let data = {
    helpDocCatalogId: 0,
    name: '',
    parentId: e.helpDocCatalogId,
  };
  currentSelectedHelpDocCatalogId.value = e.helpDocCatalogId;
  helpDocCatalogFormModal.value.showModal(data);
}
// 添加
function addTop() {
  let data = {
    helpDocCatalogId: 0,
    name: '',
    parentId: 0,
  };
  helpDocCatalogFormModal.value.showModal(data);
}
// 编辑
function updateHelpDocCatalog(e) {
  currentSelectedHelpDocCatalogId.value = e.helpDocCatalogId;
  helpDocCatalogFormModal.value.showModal(e);
}

// 删除
function deleteHelpDocCatalog(id) {
  Modal.confirm({
    title: '提醒',
    icon: createVNode(ExclamationCircleOutlined),
    content: '确定要删除该目录吗?',
    okText: '删除',
    okType: 'danger',
    async onOk() {
      SmartLoading.show();
      try {
        // 若删除的是当前的目录 先找到上级目录
        let selectedKey = null;
        if (!_.isEmpty(selectedKeys.value)) {
          selectedKey = selectedKeys.value[0];
          if (selectedKey === id) {
            let selectInfo = helpDocCatalogList.value.find((e) => e.helpDocCatalogId === id);
            if (selectInfo && selectInfo.parentId) {
              selectedKey = selectInfo.parentId;
            }
          }
        }
        await helpDocCatalogApi.delete(id);
        await queryHelpDocCatalogTree();
        // 刷新选中目录
        if (selectedKey) {
          selectTree(selectedKey);
        }
      } catch (error) {
        smartSentry.captureError(error);
      } finally {
        SmartLoading.hide();
      }
    },
    cancelText: '取消',
    onCancel() { },
  });
}

onUnmounted(() => {
  helpDocCatalogEmitter.all.clear();
});

// ----------------------- 以下是暴露的方法内容 ----------------------------
defineExpose({
  queryHelpDocCatalogTree,
  selectedHelpDocCatalogChildren,
  breadcrumb,
  selectedKeys,
  checkedKeys,
  keywords,
});
</script>
<style scoped lang="less">
.tree-container {
  height: 100%;

  .tree {
    height: 618px;
    margin-top: 10px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .sort-flag-row {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .sort-span {
    margin-left: 5px;
    color: #999;
  }

  // 新增：基站数量徽章样式
  .count-badge {
    margin-left: 5px;
    color: #1890ff;
    font-size: 12px;
    font-weight: 500;
  }

  .no-data {
    margin: 10px;
  }
}
</style>