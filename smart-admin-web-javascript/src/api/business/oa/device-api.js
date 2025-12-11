/*
 * 设备管理 - Api
 */
import {postRequest, getRequest, postDownload} from '/@/lib/axios';

export const deviceApi = {
    // 新建设备 
    create: (param) => {
        return postRequest('/oa/device/create', param);
    },

    // 删除设备
    delete: (deviceId) => {
        return getRequest(`/oa/device/delete/${deviceId}`);
    },

    // 查询设备详情
    detail: (deviceId) => {
        return getRequest(`/oa/device/get/${deviceId}`);
    },

    // 分页查询设备模块 -- 直接查询和输入关键字查询都是用到这个接口，只是在param中加入参数，就会在后台采用不同的逻辑
    pageQuery: (param) => {
        return postRequest('/oa/device/page/query', param);
    },

    // 设备监测页面的分页查询，带站点ID参数查询该站点设备
    queryByStationId: (param) => {
        console.log('查询 param 是:',param)
        return postRequest('/oa/device/page/stationDevice/query',param)
    },

    // 导出设备数据excel 
    exportExcel: (param) => {
        return postDownload('/oa/enterprise/exportExcel', param);
    },

    // 设备列表查询 含数据范围 
    queryList: (type) => {
        let query = '';
        if (type) {
            query = `?type=${type}`;
        }
        return getRequest(`/oa/enterprise/query/list${query}`);
    },

    // 编辑设备 
    update: (param) => {
        return postRequest('/oa/device/update', param);
    },
    // 
    employeeList: (param) => {
        return postRequest('/oa/enterprise/employee/list', param);
    },
    // 
    queryPageEmployeeList: (param) => {
        return postRequest('/oa/enterprise/employee/queryPage', param);
    },
    // 
    addEmployee: (param) => {
        return postRequest('/oa/enterprise/employee/add', param);
    },

    // 
    deleteEmployee: (param) => {
        return postRequest('/oa/enterprise/employee/delete', param);
    },

};
