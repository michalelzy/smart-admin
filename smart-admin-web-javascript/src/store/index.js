/*
 * pinia 状态管理
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-06 20:58:09
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 * 
 * Pinia 是 Vue 官方推荐的状态管理库（替代了 Vuex），用于在 Vue 应用中集中管理组件共享的状态（如用户信息、全局配置、权限等）。
 * 
 * export const store = createPinia() 通过 createPinia() 创建了一个 Pinia 实例，并将其命名为 store 导出。这个实例是整个应用状态管理的 “根容器”，所有的状态模块（如用户模块、配置模块等）都会挂载到这个实例上。
 * 
 * 统一管理全局状态：整个后台系统中需要跨组件共享的数据（如登录状态、主题配置、全局加载状态等），都会通过这个 Pinia 实例进行管理，避免了组件间繁琐的状态传递。
 * 
 * 在前端工程化中，index.js 通常作为目录的 “默认入口”，当其他文件通过 import '@/store' 引用时，会自动加载 store/index.js。这种约定让项目结构更清晰，开发者无需记忆具体文件路径，降低协作成本。
 */
import { createPinia } from 'pinia';

export const store = createPinia();
