<!--
  * 主应用页面
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-09-12 23:46:47
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
-->

<template>
  <!-- 
      :locale="antdLocale"：设置 Ant Design 组件的国际化语言（如按钮文字、提示信息等），值由 antdLocale 计算属性提供。

      :theme：配置 Ant Design 组件的主题样式，包含以下子配置：
        algorithm：主题算法（如亮色 / 暗色模式、紧凑模式），由 themeAlgorithm 计算属性动态决定。
        token：主题基础变量（如主色、链接色、圆角等），依赖 themeColors（主题色配置）和全局状态中的 colorIndex（当前选中的主题索引）。
        components：针对特定组件（如 Button、Icon）的样式覆盖，确保组件样式与全局主题一致。

      :transformCellText：表格单元格文本的转换函数（用于处理表格内容的省略显示和复制功能）。
  
  -->
  <a-config-provider
    :locale="antdLocale"
    :theme="{
      algorithm: themeAlgorithm,
      token: {
        colorPrimary: themeColors[colorIndex].primaryColor,
        colorLink: themeColors[colorIndex].primaryColor,
        colorLinkActive: themeColors[colorIndex].activeColor,
        colorLinkHover: themeColors[colorIndex].hoverColor,
        colorIcon: themeColors[colorIndex].primaryColor,
        borderRadius: borderRadius,
      },
      components: {
        Button: {
          colorLink: themeColors[colorIndex].primaryColor,
          colorLinkActive: themeColors[colorIndex].activeColor,
          colorLinkHover: themeColors[colorIndex].hoverColor,
        },
        Icon: {
          colorIcon: themeColors[colorIndex].primaryColor,
        },
      },
    }"
    :transformCellText="transformCellText"
  >
    <!---全局loading--->
    <!-- 
      <a-spin> 是 Ant Design 的加载组件，:spinning 控制是否显示加载状态（值来自 spinStore.loading），tip 是加载提示文字。
      整个应用的路由视图（<RouterView />）被包裹在 a-spin 中，意味着全局加载状态会覆盖所有页面。
    -->
    <a-spin :spinning="spinning" tip="稍等片刻，我在拼命加载中..." size="large">
      <!-- <RouterView /> 是 “动态占位符”，最终渲染的组件由当前访问的 URL 路径和路由配置共同决定，具体对应关系在你的路由配置文件中定义。
      <RouterView /> 最终会被替换 
      -->
      <!--- 路由 -->
      <RouterView />
    </a-spin>
  </a-config-provider>
</template>

<script setup>
  import dayjs from 'dayjs';
  //h 用于创建虚拟 DOM 节点，useSlots 处理组件插槽。
  import { computed, h, useSlots } from 'vue';
  //引入国际化配置（messages）、状态管理仓库（useAppConfigStore、useSpinStore）、Ant Design 组件（Popover、theme）等。
  import { messages } from '/@/i18n';
  import { useAppConfigStore } from '/@/store/modules/system/app-config';
  import { useSpinStore } from '/@/store/modules/system/spin';
  import { Popover, theme } from 'ant-design-vue';
  import { themeColors } from '/@/theme/color.js';
  import SmartCopyIcon from '/@/components/framework/smart-copy-icon/index.vue';

  const antdLocale = computed(() => messages[useAppConfigStore().language].antdLocale);
  const dayjsLocale = computed(() => messages[useAppConfigStore().language].dayjsLocale);
  dayjs.locale(dayjsLocale);

  // 全局loading
  let spinStore = useSpinStore();
  const spinning = computed(() => spinStore.loading);
  // 主题颜色
  const colorIndex = computed(() => {
    return useAppConfigStore().colorIndex;
  });
  // 主题
  const themeAlgorithm = computed(() => {
    let themeArray = [];
    themeArray.push(useAppConfigStore().darkModeFlag ? theme.darkAlgorithm : theme.defaultAlgorithm);
    if (useAppConfigStore().compactFlag) {
      themeArray.push(theme.compactAlgorithm);
    }
    return themeArray;
  });
  // 圆角
  const borderRadius = computed(() => {
    return useAppConfigStore().borderRadius;
  });

  /**
 * 表格单元格文本转换处理函数（适配 Ant Design Vue 的 transformCellText 配置）
 * 支持超长文本省略显示，鼠标悬停通过 Popover 展示完整文本并提供复制功能
 * 
 * 当表格列配置 textEllipsisFlag: true 时，对单元格文本进行处理：
显示时自动省略超长文本（text-overflow: ellipsis）。
鼠标悬停时通过 Popover 显示完整文本，并提供 SmartCopyIcon 组件用于复制文本。
未设置 textEllipsisFlag 时，直接显示原始文本。
 * 
 * @param {Object} options - 函数入参对象（Ant Design 表格组件自动传入）
 * @param {string|number} options.text - 单元格原始文本内容
 * @param {Object} options.column - 单元格对应的列配置对象
 * @param {boolean} [options.column.textEllipsisFlag] - 列配置中是否启用文本省略的标记（true 启用，默认不启用）
 * @param {string} options.column.dataIndex - 列的字段名（用于生成唯一 DOM ID）
 * @param {Object} options.record - 单元格所在行的完整数据记录
 * @param {number} options.index - 单元格所在行的索引（用于生成唯一 DOM ID）
 * @returns {VNode|string|number} 处理后的单元格内容：启用省略时返回 Popover 包裹的 VNode，否则返回原始文本
 * @example
 * // 列配置启用文本省略时，生成带省略和复制功能的单元格
 * // 列配置：{ dataIndex: 'username', textEllipsisFlag: true }
 * transformCellText({
 *   text: '这是一段超长的用户名文本需要省略显示',
 *   column: { dataIndex: 'username', textEllipsisFlag: true },
 *   record: { id: 1, username: '这是一段超长的用户名文本需要省略显示' },
 *   index: 0
 * })
 * @example
 * // 列配置未启用文本省略时，直接返回原始文本
 * transformCellText({
 *   text: '普通文本',
 *   column: { dataIndex: 'age' },
 *   record: { id: 1, age: 25 },
 *   index: 0
 * })
 */
  function transformCellText({ text, column, record, index }) {
    if (column && column.textEllipsisFlag === true) {
      return h(
        Popover,
        { placement: 'bottom' },
        {
          default: () =>
            h(
              'div',
              {
                style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
                id: `${column.dataIndex}${index}`,
              },
              text
            ),
          content: () =>
            h('div', { style: { display: 'flex' } }, [
              h('div', text),
              h(SmartCopyIcon, { value: document.getElementById(`${column.dataIndex}${index}`).innerText }),
            ]),
        }
      );
    } else {
      return text;
    }
  }

  const { useToken } = theme;
  const { token } = useToken();
</script>
<style lang="less">
  @color-bg-container: v-bind('token.colorBgContainer');

  :deep(.ant-table-column-sorters) {
    align-items: flex-start !important;
  }

  .smart-query-form {
    background-color: @color-bg-container;
    padding: 5px 10px;
    margin-bottom: 10px;
  }

  .smart-detail-header {
    background-color: @color-bg-container;
    padding: 10px;
  }
</style>
