/*
 * 枚举插件
 * 此插件为 1024创新实验室 自创的插件
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-09-06 20:51:03
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */
import _ from 'lodash';

// 引入布尔值枚举（true/false对应1/0）
import { FLAG_NUMBER_ENUM } from '/@/constants/common-const';

export default {
  /** Vue 插件的固定入口方法，Vue 会在app.use(插件)时调用它；所以你代码里的install不是随便命名的，是 Vue 插件的强制规范～
   *  app：Vue 应用实例（比如createApp(App)创建的实例）；
   *  前端所有枚举的 “总配置”。.use(smartEnumPlugin, constantsInfo) 这里传递的第二个参数就是这个总配置，包含了所有的枚举对象
   *  
   * 
   */

  install: (app, smartEnumWrapper) => {
    const smartEnumPlugin = {};
    /**
     * 根据枚举值获取描述
     * @param {*} constantName 枚举名
     * @param {*} value          枚举值
     * @returns
     */
    smartEnumPlugin.getDescByValue = function (constantName, value) {
      //  1. 校验：如果枚举名不存在（比如写错了DEVICE_TYPE_ENUM），打印错误并返回空

      /**
       * Object.prototype.hasOwnProperty：是 JavaScript 对象的原生方法，用于判断一个对象是否包含某个自身属性（不包括继承属性）。语法是obj.hasOwnProperty(propName)，返回布尔值（true= 存在，false= 不存在）。
       * 比如这里，第一个参数传入一个枚举集合，第二参数传入一个字符串类型该枚举的名字，就可以判断这个集合对象里面含不含这个枚举（用名称来判断含不含有）
       */
      if (!smartEnumWrapper || !Object.prototype.hasOwnProperty.call(smartEnumWrapper, constantName)) {
        console.error('无法找到变量名称：' + constantName + '，请检查 /constants/index.js 文件中是否引入此变量！');
        return '';
      }
      // 2. 特殊处理布尔值：比如把true转成1，false转成0（适配FLAG_NUMBER_ENUM枚举）
      // boolean类型需要做特殊处理
      /**
       * 这一段要做的是：如果当前要传入的枚举是FLAG_NUMBER_ENUM，并且传入的value不是undefined，并且value是布尔类型（true/false）→ 把布尔值转换成FLAG_NUMBER_ENUM枚举中对应的数字值。只有操作FLAG_NUMBER_ENUM枚举时才会执行后续逻辑
       * _.isUndefined(value)是 lodash 工具库的方法，判断value是否为undefined；
       * !_.isUndefined(value)确保传入的value不是undefined（如果value是undefined，后续转换就没意义了）
       * typeof value === 'boolean'：判断值类型是否为布尔，这个条件是核心：只有当用户传入的是布尔值时，才需要转换成对应的数字枚举值。
       */
      if (constantName === 'FLAG_NUMBER_ENUM' && !_.isUndefined(value) && typeof value === 'boolean') {
        //如果value是true → 替换成FLAG_NUMBER_ENUM.TRUE.value（通常是1）；如果value是false → 替换成FLAG_NUMBER_ENUM.FALSE.value（通常是0）；
        value = value ? FLAG_NUMBER_ENUM.TRUE.value : FLAG_NUMBER_ENUM.FALSE.value;
      }

      let smartEnum = smartEnumWrapper[constantName];
      for (let item in smartEnum) {
        if (smartEnum[item].value === value) {
          return smartEnum[item].desc;
        }
      }
      return '';
    };
    /**
     * 根据枚举名获取对应的描述键值对[{value:desc}]
     * @param {*} constantName 枚举名
     * @returns
     */
    smartEnumPlugin.getValueDescList = function (constantName) {
      if (!Object.prototype.hasOwnProperty.call(smartEnumWrapper, constantName)) {
        console.error('无法找到变量名称：' + constantName + '，请检查 /constants/index.js 文件中是否引入此变量！');
        return [];
      }
      const result = [];
      let targetSmartEnum = smartEnumWrapper[constantName];
      for (let item in targetSmartEnum) {
        result.push(targetSmartEnum[item]);
      }
      return result;
    };

    /**
     * 根据枚举名获取对应的value描述键值对{value:desc}
     * @param {*} constantName 枚举名
     * @returns
     */
    smartEnumPlugin.getValueDesc = function (constantName) {
      if (!Object.prototype.hasOwnProperty.call(smartEnumWrapper, constantName)) {
        console.error('无法找到变量名称：' + constantName + '，请检查 /constants/index.js 文件中是否引入此变量！');
        return {};
      }
      let smartEnum = smartEnumWrapper[constantName];
      let result = {};
      for (let item in smartEnum) {
        let key = smartEnum[item].value + '';
        result[key] = smartEnum[item].desc;
      }
      return result;
    };

    // 把ENUM里的对象整体返回，因为对象里包含了: value、desc、color等多个属性，所以之前的仅靠 getValueDesc 就不行了，因为访问不到color
    smartEnumPlugin.getEnumItemByValue = function (constantName, value) {
      if (!smartEnumWrapper || !Object.prototype.hasOwnProperty.call(smartEnumWrapper, constantName)) {
        console.error('无法找到变量名称：' + constantName + '.请检查 /constants/index.js 文件中是否引入此变量！');
        return null;
      }

      if (constantName === 'FLAG_NUMBER_ENUM' && !_.isUndefined(value) && typeof value === 'boolean') {
        value = value ? FLAG_NUMBER_ENUM.TRUE.value : FLAG_NUMBER_ENUM.FALSE.value;
      }

      let smartEnum = smartEnumWrapper[constantName];
      for (let item in smartEnum) {
        if (smartEnum[item].value === value) {
          return smartEnum[item]; // 返回完整枚举项（含color）
        }
      }
      return null;
    }

    smartEnumPlugin.getColorByValue = function (constantName, value) {
      const enumItem = this.getEnumItemByValue(constantName, value); // 复用上面的新方法
      return enumItem?.color || 'default'; // 有color则返回，否则返回默认色
    };

    // app.config.globalProperties是Vue提供的全局属性挂载入口，任何挂载到这里的属性/方法，都会成为Vue实例的全局属性；则在Vue项目的其他任何地方，就可以通过 $smartEnumPlugin 这样的方式来使用了
    app.config.globalProperties.$smartEnumPlugin = smartEnumPlugin;
    app.provide('smartEnumPlugin', smartEnumPlugin);
  },
};
