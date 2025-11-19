/*
 * 所有路由入口
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-06 20:52:26
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */
import { homeRouters } from './system/home';
import { loginRouters } from './system/login';
import { helpDocRouters } from './support/help-doc';
import NotFound from '/@/views/system/40X/404.vue';
import NoPrivilege from '/@/views/system/40X/403.vue';

export const routerArray = [
    //通过数组展开运算符（...） 将多个路由模块（loginRouters、homeRouters 等）合并为一个数组，最终导出作为基础路由配置。
    ...loginRouters,
     ...homeRouters, 
    ...helpDocRouters, 
    /**
     * 在 Vue Router 中，路由配置是一个数组，数组中的每个元素都是一个路由对象（用 {} 包裹），每个对象代表一条路由规则
     * 
     * { 
           path: '/:pathMatch(.*)*',  // 路由路径（必填）
           name: '404',               // 路由名称（可选，用于标识路由）
           component: NotFound        // 路由对应的组件（必填，匹配路径时渲染该组件）
        }
     */
    //path: '/:pathMatch(.*)* 是通配符语法，* 表示 “匹配任意字符”，意味着当用户访问的 URL 没有匹配到任何已定义的路由时，会触发这条规则
    { path: '/:pathMatch(.*)*', name: '404', component: NotFound },
    { path: '/403', name: '403', component: NoPrivilege }
];
