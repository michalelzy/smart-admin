/*
 * 企业
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-03 22:07:27
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */

export const ENTERPRISE_TYPE_ENUM = {
  NORMAL: {
    value: 1,
    desc: '纯光站',
  },
  FOREIGN: {
    value: 2,
    desc: '叠光站',
  },
};

export const DEVICE_TYPE_ENUM = {
  CONTROLLER: {
    value: 1, 
    desc: '控制器',
    color: 'orange'
  },
  METER: {
    value: 2, 
    desc: '电表',
    color: 'blue'
  }
}

export const STATUS_ENUM = {
  OFFLINE: {
    value: false, 
    desc: '离线',
    color: 'error'
  },
  ONLINE: {
    value: true, 
    desc: '在线',
    color: 'success'
  }
}

export const DTU_STATUS_ENUM = {
  OFFLINE: {
    value: false, 
    desc: '离线',
    color: 'error'
  },
  ONLINE: {
    value: true, 
    desc: '在线',
    color: 'success'
  }
}

export default {
  ENTERPRISE_TYPE_ENUM,
  DEVICE_TYPE_ENUM,
  STATUS_ENUM,
};
