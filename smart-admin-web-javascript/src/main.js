/*
 * 项目启动入口方法
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-06 20:59:23
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */

import { createApp } from 'vue';
import Antd, { message } from 'ant-design-vue';
import * as antIcons from '@ant-design/icons-vue';
import lodash from 'lodash';
import JsonViewer from 'vue3-json-viewer';
import 'vue3-json-viewer/dist/index.css';
import App from './App.vue';
import { smartSentry } from '/@/lib/smart-sentry';
import { loginApi } from '/@/api/system/login-api';
import constantsInfo from '/@/constants/index';
import { privilegeDirective } from '/@/directives/privilege';
import i18n from '/@/i18n/index';
import privilegePlugin from '/@/plugins/privilege-plugin';
import dictPlugin from '/@/plugins/dict-plugin';
import smartEnumPlugin from '/@/plugins/smart-enums-plugin';
import { buildRoutes, router } from '/@/router';
import { store } from '/@/store';
import { useUserStore } from '/@/store/modules/system/user';
import 'ant-design-vue/dist/reset.css';
import '/@/theme/index.less';
import { localRead } from '/@/utils/local-util.js';
import LocalStorageKeyConst from '/@/constants/local-storage-key-const.js';
import '/@/utils/ployfill';
import { useDictStore } from '/@/store/modules/system/dict.js';
import { dictApi } from '/@/api/support/dict-api.js';

/*
 * -------------------- ※ 着重 解释说明下main.js的初始化逻辑 begin ※ --------------------
 *
 * 1、在main.js里很多框架都是 直接调用初始化的vue方法，创建vue实例，然后挂载路由router、状态管理store等等，但是关于router这块是有问题的；
 * 2、因为现在大部分路由都是从后端接口返回的，如若直接初始化挂载路由，这时前端还没有从后端请求路由的数据，所以只能写到路由拦截器里，这样很绕很不清晰；
 *    正确的做法流程应该是：
 *      2.1）如果存在登录信息，则先ajax请求用户的所有路由，然后加载，再去创建vue实例和挂载路由
 *      2.2）如果不存在路由信息，则创建vue实例和挂载路由（此时的路由应该只有login页面，因为用户拥有哪些路由是登录之后才知道的）
 * 3、以上，在main.js里两个方法，一个是 获取登录信息getLoginInfo，另一个初始化vue: initVue，在最下的if操作里
 *
 * -------------------- ※ 着重 解释说明下main.js的初始化逻辑 end ※ --------------------
 */

/**
 * 获取用户信息和用户权限对应的路由，构建动态路由
 */
async function getLoginInfo() {
  try {
    //获取登录用户信息  1. 调用接口获取登录用户信息（包含菜单列表等）
    const res = await loginApi.getLoginInfo();
    // 2. 调用接口获取所有数据字典（如下拉框选项等全局静态数据）
    const dictRes = await dictApi.getAllDictData();
    //构建系统的路由
    let menuRouterList = res.data.menuList.filter((e) => e.path || e.frameUrl);
    // 4. 调用路由配置中的 buildRoutes 函数，根据菜单列表生成动态路由
    buildRoutes(menuRouterList);
    // 5. 初始化 Vue 应用（挂载根组件等）
    initVue();
    // 初始化数据字典
    useDictStore().initData(dictRes.data);
    //更新用户信息到pinia。这一行，很重要，这行代码向后端拿到了数据，而这些从后端拿到的数据会用来构建前端页面。因为前端页面的内容不是写死在前端的。例如，侧边栏的内容也是根据从后端拿到的内容来构建的。
    useUserStore().setUserLoginInfo(res.data);
  } catch (e) {
    message.error(e.data ? e.data.msg : e.message);
    smartSentry.captureError(e);
    initVue();
  }
}

async function initVue() {
  //创建 Vue 应用实例（传入根组件 App.vue）
  let vueApp = createApp(App);
  let app = vueApp
    .use(router)  // 安装路由插件（router/index.js 中创建的路由实例）
    .use(store) // 安装 Pinia 状态管理（store/index.js 中创建的 store 实例）
    .use(i18n) // 安装国际化插件（处理多语言）
    .use(Antd) // 安装 Ant Design Vue 组件库
    .use(smartEnumPlugin, constantsInfo)  // 安装自定义枚举插件（传入常量配置）
    .use(privilegePlugin) //安装权限插件（控制按钮/菜单权限）
    .use(dictPlugin) // 安装数据字典插件（全局使用字典数据）
    .use(JsonViewer); // 安装 JSON 查看器插件
  //注入权限 3. 注册全局权限指令（v-privilege，用于控制元素显示权限）
  app.directive('privilege', {
    mounted(el, binding) {
      privilegeDirective(el, binding); // 调用权限指令的实现逻辑
    },
  });
  // 注册图标组件
  Object.keys(antIcons).forEach((key) => {
    app.component(key, antIcons[key]);
  });
  //全局
  app.config.globalProperties.$antIcons = antIcons;
  app.config.globalProperties.$lodash = lodash;
  //挂载
  app.mount('#app');
}

/**
 * main.js 是 Vue 项目的入口文件，相当于整个应用的 “启动器” 
 * 创建 Vue 实例，安装路由、状态管理、UI 组件库等核心依赖
 * main.js 是默认的入口文件，构建工具（如 Vite）会自动将其作为程序的起点加载并执行。
 * Vite 会从 main.js 开始解析代码，执行其中的逻辑（创建应用、挂载组件等），最终在浏览器中渲染页面。
*/

//不需要获取用户信息、用户菜单、用户菜单动态路由，直接初始化vue即可
let token = localRead(LocalStorageKeyConst.USER_TOKEN);
if (!token) {
  await initVue();
} else {
  await getLoginInfo();
}
