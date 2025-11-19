/*
 * 登录页面
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-06 20:51:50
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 * 
 *
 */
const scMap = () => import("/@/views/scMap/index.vue");

export const loginRouters = [
  {
    path: '/login',
    name: 'Login',
    // component: () => import('/@/views/system/login3/login.vue'),
    component: scMap,
    //meta 是 Vue Router 框架专门设计的用于扩展路由信息的字段
    //你可以在其中定义任意键值对，用于存储路由的 “附加信息”，这些信息会被 Vue Router 保留在路由记录中，方便在组件、导航守卫等场景中获取和使用。
    /** meta 的使用场景:
     * 在 router.beforeEach 中通过 to.meta 获取路由元信息，判断是否需要登录或特定权限。
     */
    meta: {
      title: '登录',
      hideInMenu: true,
    },
  },
];
