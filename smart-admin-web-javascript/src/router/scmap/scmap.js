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

export const scMapRouters = [
  {
    path: '/3d-screen',
    name: '3D看板',
    component: scMap,
    meta: {
      title: '3D看板',
      hideInMenu: true,
    },
  },
];
