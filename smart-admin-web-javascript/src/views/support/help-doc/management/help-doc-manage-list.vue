<!--
  * 设备监测 管理
  * 
  *
  * 
  * 
-->
<template>
  <div class="height100">
    <a-row :gutter="16" class="height100">
      <!-- TODO:这是树形列表 -->
      <!-- <a-col :span="6">
        <HelpDocCatalogTree ref="helpDocCatalogTreeRef" />
      </a-col> -->

      <!-- <a-col :span="6">
        <cata-tree />
      </a-col> -->
      <a-col :span="6">
        <!-- 树形结构 -->
        <CatTreePlus ref="helpDocCatalogTreeRef" />
      </a-col>
      
      <a-col :span="18" class="height100">
        <div class="help-doc-box height100">
          <!-- 卡片详情页 -->
          <HelpDocList :helpDocCatalogId="selectedHelpDocCatalogId" />
        </div>
      </a-col>
    </a-row>
  </div>
</template>
<script setup>
  import _ from 'lodash';
  import { computed, ref } from 'vue';
  import HelpDocCatalogTree from './components/help-doc-catalog-tree.vue';
  import HelpDocList from './components/help-doc-list.vue';
  import CataTree from './components/cata-tree.vue';
  import CatTreePlus from './components/cat-tree-plus.vue';
  

  const helpDocCatalogTreeRef = ref();

  // 当前选中的目录id
  const selectedHelpDocCatalogId = computed(() => {
    if (helpDocCatalogTreeRef.value) {
      // 从这里获得 tree 结构中获取到的 help_doc_catalog_id
      let selectedKeys = helpDocCatalogTreeRef.value.selectedKeys;
      return _.isEmpty(selectedKeys) ? null : selectedKeys[0];
    }
    return null;
  });
</script>
<style scoped lang="less">
  .height100 {
    height: 100%;
  }
  .help-doc-box {
    display: flex;
    flex-direction: column;

    .employee {
      flex-grow: 2;
      margin-top: 10px;
    }
  }
</style>
