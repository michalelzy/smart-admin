<!--
  *  layout 多种模式
  *
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-09-06 20:40:16
  * @Wechat:    zhuda1024
  * @Email:     lab1024@163.com
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
-->
<template>
  <!--1. 左侧菜单 模式（对应设置中的“传统”模式）-->
  <SideLayout v-if="layout === LAYOUT_ENUM.SIDE.value" />
  <!--2. 左侧展开菜单 模式-->
  <SideExpandLayout v-if="layout === LAYOUT_ENUM.SIDE_EXPAND.value" />
  <!--3. 顶部菜单 模式-->
  <TopLayout v-if="layout === LAYOUT_ENUM.TOP.value" />
  <!-- <RegularChangePasswordModal /> 是 “定期修改密码” 的弹窗组件，直接渲染在布局容器中（无 v-if 控制），确保所有页面都能触发该弹窗（比如登录后检测密码有效期）。 -->
  <!--定期修改密码-->
  <RegularChangePasswordModal />
  <!--4. 顶部展开 模式（对应设置中的“分组”模式）-->
  <TopExpandLayout v-if="layout === LAYOUT_ENUM.TOP_EXPAND.value" />
</template>
<script setup>
  import { computed } from 'vue';
  import { LAYOUT_ENUM } from '/@/constants/layout-const';
  import SideExpandLayout from './side-expand-layout.vue';
  import TopExpandLayout from './top-expand-layout.vue';
  import SideLayout from './side-layout.vue';
  import TopLayout from './top-layout.vue';
  import { useAppConfigStore } from '/@/store/modules/system/app-config';
  import RegularChangePasswordModal from './components/change-password/regular-change-password-modal.vue';

  // 布局的切换完全由全局状态（Pinia 中的 layout）控制，用户可在系统设置中切换布局模式，状态同步后页面会自动渲染对应布局。
  // 同一时间只会渲染其中一个布局组件，实现布局模式的动态切换。
  // 用户可在系统设置中切换布局模式，状态同步后页面会自动渲染对应布局。
  // computed() 会自动追踪其内部使用的响应式数据（如 ref/reactive/Pinia 状态等），当依赖数据变化时，计算属性的值会自动重新计算，并触发使用该计算属性的视图或逻辑更新。响应式
  const layout = computed(() => useAppConfigStore().$state.layout);
</script>
