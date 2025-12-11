<template>
  <div class="area-tree-container" style="width: 200px; max-height: 600px; overflow-y: auto;">
    <!-- 搜索框（可选） -->
    <a-input
      v-model:value="searchKey"
      placeholder="输入关键字进行过滤"
      style="margin-bottom: 8px;"
      @input="onSearch"
    />
    
    <!-- 行政区域树 -->
    <a-tree
      :tree-data="processedTreeData"
      :default-expand-all="false"
      :default-expanded-keys="['sichuan', 'ganzi']"
      show-line
      @select="onSelectArea"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// 原始数据：分离标题和数量
const sichuanAreaData = [
  {
    title: '四川省',
    key: 'sichuan',
    children: [
      {
        title: '阿坝藏族羌族自治州',
        key: 'aba',
        children: [
          { title: '马尔康市', key: 'maerkang', stationCount: 0 },
          { title: '汶川县', key: 'wenchuan', stationCount: 0 }
        ]
      },
      {
        title: '甘孜藏族羌族自治州',
        key: 'ganzi',
        children: [
          { title: '康定市', key: 'kangding', stationCount: 0 },
          { title: '泸定县', key: 'luding', stationCount: 6 },
          { title: '丹巴县', key: 'danba', stationCount: 0 },
          { title: '九龙县', key: 'jiulong', stationCount: 0 },
          { title: '雅江县', key: 'yajiang', stationCount: 1 },
          { title: '道孚县', key: 'daofu', stationCount: 18 },
          { title: '炉霍县', key: 'luhuo', stationCount: 5 },
          { title: '甘孜县', key: 'ganziCounty', stationCount: 20 },
          { 
            title: '新龙县', 
            key: 'xinlong', 
            children: [
              { title: '子片区1', key: 'xinlong1', stationCount: 3 },
              { title: '子片区2', key: 'xinlong2', stationCount: 2 }
            ]
          }
        ]
      },
      {
        title: '成都市',
        key: 'chengdu',
        children: [
          { title: '武侯区', key: 'wuhou', stationCount: 12 },
          { title: '锦江区', key: 'jinjiang', stationCount: 8 }
        ]
      }
    ]
  }
];

// 光伏站数据API示例（实际项目中可从接口获取）
const fetchStationData = () => {
  // 模拟异步获取数据
  return {
    luding: 5,
    yajiang: 1,
    daofu: 18,
    luhuo: 5,
    ganziCounty: 20,
    wuhou: 12,
    jinjiang: 8
  };
};

// 搜索关键词
const searchKey = ref('');

// 递归计算各级节点的总数量
const calculateTotalCount = (node) => {
  // 如果是叶子节点且有stationCount，直接返回
  if (!node.children && node.stationCount !== undefined) {
    return node.stationCount;
  }
  
  // 递归计算子节点数量总和
  if (node.children && node.children.length > 0) {
    let total = 0;
    node.children.forEach(child => {
      total += calculateTotalCount(child);
    });
    return total;
  }
  
  return 0;
};

// 处理树数据，生成带数量的标题
const processTreeData = (nodes) => {
  return nodes.map(node => {
    // 计算当前节点的总数量
    const totalCount = calculateTotalCount(node);
    
    // 生成显示标题（标题 + 数量）
    const displayTitle = totalCount > 0 
      ? `${node.title} (${totalCount})` 
      : `${node.title} (0)`;
    
    // 递归处理子节点
    const children = node.children ? processTreeData(node.children) : undefined;
    
    return {
      ...node,
      title: displayTitle,
      children,
      // 保存原始标题和数量，方便后续使用
      rawTitle: node.title,
      totalCount
    };
  });
};

// 处理后的树数据
const processedTreeData = computed(() => {
  let data = processTreeData(sichuanAreaData);
  
  // 如果有搜索关键词，进行过滤
  if (searchKey.value) {
    const filterNodes = (nodes) => {
      return nodes
        .map(node => {
          const children = node.children ? filterNodes(node.children) : [];
          // 匹配原始标题或数量
          const matchesSearch = 
            node.rawTitle.includes(searchKey.value) || 
            (node.totalCount.toString() === searchKey.value);
          
          if (matchesSearch || children.length > 0) {
            return { ...node, children };
          }
          return null;
        })
        .filter(Boolean);
    };
    
    data = filterNodes(data);
  }
  
  return data;
});

// 选择区域的回调
const onSelectArea = (selectedKeys, info) => {
  const node = info.node;
  console.log('选中区域：', {
    key: selectedKeys[0],
    name: node.rawTitle || node.title,
    stationCount: node.totalCount || 0,
    isLeaf: !node.children
  });
};
</script>

<style scoped>
/* 可选：自定义树节点样式 */
.area-tree-container .ant-tree-node-content-wrapper {
  padding: 2px 0;
}
.area-tree-container .ant-tree-title {
  font-size: 12px;
}
</style>