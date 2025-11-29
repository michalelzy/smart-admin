/*
 * 首页路由
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-06 20:51:41
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */
import { component } from 'v-viewer';
import { HOME_PAGE_NAME } from '/@/constants/system/home-const';
import { MENU_TYPE_ENUM } from '/@/constants/system/menu-const';
import SmartLayout from '/@/layout/index.vue';

export const homeRouters = [
  {
    // 输入 '/' 时重定向到 HOME_PAGE_NAME 组件
    path: '/',
    name: '_home',
    // 当访问根路径 / 时，根据 name: 'Home' 去匹配路由配置中 name: 'Home' 的项（也就是子路由 /home）。
    // 也就是会用 component: () => import('/@/views/system/home/index.vue'),
    redirect: { name: HOME_PAGE_NAME },
    /** 
     * 
     * 1. component: SmartLayout 的作用
SmartLayout 是整个应用的布局容器组件，并非具体的页面内容组件。它的核心作用是：
提供页面的整体布局结构（比如侧边栏、顶部导航、内容区域等）；
根据配置动态切换不同的布局模式（侧边栏模式、顶部菜单模式等）；
作为嵌套路由的 “父容器”，子路由（如 /home、/account）的内容会被渲染到 SmartLayout 中 <router-view /> 的位置（虽然你贴的代码里没直接写 <router-view />，但这类布局组件内部肯定包含，否则子路由无法显示）。
2. SmartLayout 的具体功能解析
从你提供的 SmartLayout 代码来看：
它根据 layout 变量（从全局状态 app-config 中获取）动态渲染不同的布局组件：
SideLayout：左侧菜单布局（最常见的侧边栏模式，包含侧边导航 + 主内容区）；
SideExpandLayout：左侧展开菜单布局（侧边栏可展开 / 收起）；
TopLayout：顶部菜单布局（导航在顶部，内容在下方）；
TopExpandLayout：顶部展开菜单布局；
同时全局挂载了 RegularChangePasswordModal（定期修改密码的弹窗），确保所有页面都能触发这个弹窗。
3. 为什么根路由要配置 component: SmartLayout？
这是嵌套路由的核心逻辑：
根路径 / 匹配到 SmartLayout，先渲染布局框架（比如侧边栏 + 顶部导航）；
子路由（如 /home）的内容会被插入到 SmartLayout 内部的 <router-view /> 中；
最终页面效果 = 布局框架（侧边栏 / 顶部导航） + 子路由页面内容（首页 / 个人中心）。
4. 关于 “页面侧面栏” 的疑问
你说的 “页面侧面栏” 正是 SmartLayout 中 SideLayout/SideExpandLayout 组件实现的！比如：
SideLayout 内部会包含侧边导航菜单组件、主内容区域的 <router-view />；
当 layout 配置为 LAYOUT_ENUM.SIDE.value 时，就会显示侧边栏布局。
总结执行流程
访问根路径 / 时：
匹配到 path: '/' 的路由，渲染 SmartLayout（布局框架）；
触发 redirect: { name: HOME_PAGE_NAME }，跳转到名称为 HOME_PAGE_NAME 的路由（即 /home）；
/home 作为子路由，其内容（home/index.vue）被渲染到 SmartLayout 的 <router-view /> 中；
最终页面 = 侧边栏布局（SmartLayout） + 首页内容（home/index.vue）。
简单说：SmartLayout 是 “骨架”，子路由组件是 “血肉”，二者结合构成完整页面。
     */
    component: SmartLayout,
    meta: {
      title: '首页',
      menuType: MENU_TYPE_ENUM.CATALOG.value,
      icon: 'HomeOutlined',
    },
    children: [
      {
        path: '/home',
        name: HOME_PAGE_NAME,
        meta: {
          title: '首页',
          menuType: MENU_TYPE_ENUM.MENU.value,
          icon: 'HomeOutlined',
          parentMenuList: [{ name: '_home', title: '首页' }],
        },
        component: () => import('/@/views/system/home/index.vue'),
      },
      {
        path: '/account',
        name: 'Account',
        component: () => import('/@/views/system/account/index.vue'),
        meta: {
          title: '个人中心',
          hideInMenu: false,
        },
      },
    ],
  },
];
