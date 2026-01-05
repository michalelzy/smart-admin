/*
 * influxDB 时序数据库 - Api
 */
import {postRequest, getRequest, postDownload, postInfluxRequest, getInfluxRequest} from '/@/lib/axios';

export const influxDbApi = {

    
    // 批量查询DTU设备最新实时状态（适配批量关联逻辑）
    getDtuRealTimeStatus: (dtuNumberList) => {
        //dtuNumberList：DTU序列号数据，如['860678074049117','860678074049100','860678074049201']
        return postInfluxRequest('/dtu/batch/latest', {
            dtuNumberList:dtuNumberList,// 批量传参,避免循环查询
            limit:1, // 仅返回每个DTU最新的1条状态
            start:'-30d',
        })
    }
    

};
