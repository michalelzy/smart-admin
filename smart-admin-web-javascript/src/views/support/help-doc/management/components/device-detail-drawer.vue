<!--
  * 帮助文档表单
  * 
  * @Author:    1024创新实验室-主任：卓大
  * @Date:      2022-07-21 21:55:12
  * @Wechat:    zhuda1024 
  * @Email:     lab1024@163.com 
  * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012 
-->
<template>
    <a-drawer :title="formData.helpDocId ? '编辑设备手册' : '设备详情手册'" :open="visibleFlag" :width="1000"
        :footerStyle="{ textAlign: 'right' }" @close="onClose" :destroyOnClose="true">
        <!-- <a-form ref="formRef" :model="formData" :rules="formRules" :label-col="{ span: 3 }" :wrapper-col="{ span: 20 }">
      <a-form-item label="标题" name="title">
        <a-input v-model:value="formData.title" placeholder="请输入标题" />
      </a-form-item>
      <a-form-item label="目录" name="helpDocCatalogId">
        <HelpDocCatalogTreeSelect v-model:value="formData.helpDocCatalogId" style="width: 100%" />
      </a-form-item>
      <a-form-item label="作者" name="author">
        <a-input v-model:value="formData.author" placeholder="请输入作者" />
      </a-form-item>
      <a-form-item label="排序" name="sort">
        <a-input-number v-model:value="formData.sort" placeholder="值越小越靠前" />（值越小越靠前）
      </a-form-item>
      <a-form-item label="是否首页显示">
        <a-radio-group v-model:value="relateHomeFlag" button-style="solid">
          <a-radio-button :value="true">首页显示</a-radio-button>
          <a-radio-button :value="false">首页不用显示</a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="关联菜单" v-if="!relateHomeFlag">
        <MenuTreeSelect v-model:value="formData.relationIdList" ref="menuTreeSelect" />
      </a-form-item>
      <a-form-item label="公告内容" name="contentHtml">
        <Wangeditor ref="contentRef" :modelValue="formData.contentHtml" :height="300" />
      </a-form-item>
      <a-form-item label="附件">
        <Upload
          :defaultFileList="defaultFileList"
          :maxUploadSize="10"
          :folder="FILE_FOLDER_TYPE_ENUM.HELP_DOC.value"
          buttonText="上传附件"
          listType="text"
          extraMsg="最多上传10个附件"
          @change="changeAttachment"
        />
      </a-form-item>
    </a-form> -->

        <!-- <template #footer>
      <a-space>
        <a-button @click="onClose">取消</a-button>
        <a-button type="primary" @click="onSubmit">保存</a-button>
      </a-space>
    </template> -->

        <!-- 设备头部信息 -->
        <div class="device-header">
            <img src="https://t13.baidu.com/it/u=2559609758,4177895468&fm=224&app=112&f=JPEG?w=500&h=500"
                class="device-icon" />
            <div class="device-info">
                <h2>甘孜州德格错阿综合机房</h2>
                <div class="device-meta">
                    <!-- 核心：根据isOnline动态判断状态 -->
                    <a-tag :color="isOnline ? 'success' : 'error'">
                        <template #icon>
                            <sync-outlined :spin="isOnline" />
                        </template>
                        {{ isOnline ? '在线' : '离线' }}
                    </a-tag>
                    <!-- 设备类型标签（新增） -->
                    <a-tag :color="deviceTypeCode === 1 ? 'blue' : 'purple'" class="type-tag">
                        {{ deviceTypeCode === 1 ? '控制器' : '电表' }}
                    </a-tag>
                    <span class="device-address">设备地址：1</span>
                </div>
            </div>
        </div>

        <!-- 标签页 -->
        <a-tabs default-active-key="1" style="margin: 16px 0;">
            <a-tab-pane tab="实时数据" key="1">
                <!-- 栅格布局：动态渲染卡片 -->
                <a-row :gutter="[16, 16]">
                    <!-- 核心：v-for 遍历 + 绑定闪烁类 -->
                    <a-col v-for="(item, index) in realTimeDataList" :key="index" :xs="24" :sm="12" :md="8"
                        class="data-col">
                        <!-- 关键：:class 动态绑定闪烁类（item.value === 0 时生效） -->
                        <a-card hoverable class="data-card" :class="{
                            'status-card': item.type === 'status',
                            'zero-flash-card': item.type === 'number' && item.value === 0 // 零值闪烁类
                        }">
                            <div class="card-header">
                                <span class="card-title">{{ item.title }}</span>
                                <a-tag v-if="item.type === 'status'" :color="item.statusValue === 0 ? 'gold' : 'green'" class="status-tag">
                                    {{ item.statusValue === 0 ? '待机' : '在线' }}
                                </a-tag>
                            </div>
                            <div class="card-time">
                                <clock-circle-outlined /> {{ item.updateTime }}
                            </div>
                            <!-- 数值类型（含单位） -->
                            <div v-if="item.type === 'number'" class="card-value-group">
                                <span class="card-value" :class="{ 'zero-value': item.value === 0 }">{{ item.value
                                    }}</span>
                                <a-badge :color="item.value === 0 ? 'red' : 'blue'" class="unit-badge">{{ item.unit
                                    }}</a-badge>
                            </div>
                            <!-- 状态类型 -->
                            <div v-if="item.type === 'status'" class="card-value status-value">{{ item.value }}</div>
                        </a-card>
                    </a-col>

                    <!-- 无数据提示 -->
                    <div v-if="realTimeDataList.length === 0" class="no-data">
                        暂无实时采集数据
                    </div>
                </a-row>
            </a-tab-pane>
            <a-tab-pane tab="运行数据" key="2">
                <!-- 运行数据同理 -->
            </a-tab-pane>
        </a-tabs>

    </a-drawer>


</template>

<script setup>
import { nextTick, reactive, ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { ClockCircleOutlined } from '@ant-design/icons-vue';
import _ from 'lodash';
import { SmartLoading } from '/@/components/framework/smart-loading';
import { FILE_FOLDER_TYPE_ENUM } from '/@/constants/support/file-const';
import { helpDocApi } from '/@/api/support/help-doc-api';
import Wangeditor from '/@/components/framework/wangeditor/index.vue';
import Upload from '/@/components/support/file-upload/index.vue';
import HelpDocCatalogTreeSelect from './help-doc-catalog-tree-select.vue';
import MenuTreeSelect from '/@/components/system/menu-tree-select/index.vue';
import { smartSentry } from '/@/lib/smart-sentry';

const emits = defineEmits(['reloadList']);

// ------------------ 显示，关闭 ------------------
// 显示
const visibleFlag = ref(false);
function showModal(helpDocId) {
    Object.assign(formData, defaultFormData);
    defaultFileList.value = [];
    if (helpDocId) {
        getDetail(helpDocId);
    }

    visibleFlag.value = true;
    nextTick(() => {
        formRef.value.clearValidate();
    });
}

// 关闭
function onClose() {
    visibleFlag.value = false;
}

// --------------------- 后台数据模拟 -----------------------
const realTimeDataList = ref([]);

// 模拟调用后台接口获取采集数据
const getRealTimeData = async () => {
    // 实际项目中替换为真实接口请求：await api.getRealTimeData(stationId)
    // 模拟后台返回的采集数据结构（可根据实际需求扩展字段）
    const mockData = [
        {
            title: '工作状态',        // 数据项标题
            type: 'status',           // 数据类型：status（状态）/ number（数值）
            value: '待机',            // 数据值
            updateTime: '2025-12-05 14:41:00', // 更新时间
            statusColor: 'gold',      // 状态标签颜色
            statusText: '待机',        // 状态标签文本
            statusValue: 1
        },
        {
            title: '光伏输入电压1',
            type: 'number',
            value: 141.7,
            unit: 'V',
            updateTime: '2025-12-05 14:41:00'
        },
        {
            title: '光伏输入电压2',
            type: 'number',
            value: 0,
            unit: 'V',
            updateTime: '2025-12-05 14:41:00'
        },
        {
            title: '光伏输入电流1',
            type: 'number',
            value: 0,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        },
        {
            title: '电池电压',
            type: 'number',
            value: 0,
            unit: 'V',
            updateTime: '2025-12-05 14:41:00'
        },
        {
            title: '光伏输入电流1',
            type: 'number',
            value: 2.5,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        }, {
            title: '光伏输入电流1',
            type: 'number',
            value: 2.5,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        }, {
            title: '光伏输入电流1',
            type: 'number',
            value: 2.5,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        }, {
            title: '光伏输入电流1',
            type: 'number',
            value: 2.5,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        }, {
            title: '光伏输入电流1',
            type: 'number',
            value: 0,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        }, {
            title: '光伏输入电流1',
            type: 'number',
            value: 0,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        }, {
            title: '光伏输入电流1',
            type: 'number',
            value: 2.5,
            unit: 'A',
            updateTime: '2025-12-05 14:41:00'
        },
    ];
    realTimeDataList.value = mockData;
};

// 真实接口调用示例
// const getRealTimeData = async () => {
//   try {
//     // 假设stationId从父组件/路由获取
//     const res = await api.getRealTimeData({ stationId: 513444 });
//     // 接口返回的数据需映射为上述通用结构
//     realTimeDataList.value = res.data.map(item => ({
//       title: item.dataTitle,
//       type: item.dataType === 'STATUS' ? 'status' : 'number',
//       value: item.dataValue,
//       unit: item.unit || '',
//       updateTime: item.updateTime,
//       statusColor: item.status === 'ONLINE' ? 'gold' : 'red',
//       statusText: item.status === 'ONLINE' ? '在线' : '离线'
//     }));
//   } catch (err) {
//     console.error('获取实时数据失败：', err);
//     realTimeDataList.value = [];
//   }
// };

// ------------------ 设备头部信息 ---------------
const isOnline = ref(true);
const deviceTypeCode = ref(1);

// 实际项目中接口调用示例（可直接替换）
// const getDeviceStatus = async () => {
//   const res = await api.getDeviceStatus(stationId);
//   isOnline.value = res.data.isOnline; // 后台返回的boolean值
// };
// getDeviceStatus();

// 实际项目替换为接口调用示例：
// import { deviceApi } from '/@/api/business/oa/device-api';
// const getDeviceInfo = async () => {
//   const res = await deviceApi.getDetail({ stationId: 513444 });
//   isOnline.value = res.data.isOnline; // 后台返回的在线状态（boolean）
//   deviceTypeCode.value = res.data.deviceType; // 后台返回的设备类型编码（1/2）
// };
// getDeviceInfo()

// ------------------ 表单 ------------------

const formRef = ref();
const contentRef = ref();
const relateHomeFlag = ref(false);

const defaultFormData = {
    helpDocId: undefined,
    helpDocCatalogId: undefined,
    title: undefined, // 标题
    author: undefined, // 作者
    sort: 0, // 排序
    attachment: [], // 附件
    relationIdList: [], //关联id集合
    contentHtml: '', // html内容
    contentText: '', // 纯文本内容
};

const formData = reactive({ ...defaultFormData });

const formRules = {
    title: [{ required: true, message: '请输入' }],
    helpDocCatalogId: [{ required: true, message: '请选择目录' }],
    author: [{ required: true, message: '请输入作者' }],
    sort: [{ required: true, message: '请输入排序' }],
    contentHtml: [{ required: true, message: '请输入内容' }],
};

// 查询详情
async function getDetail(helpDocId) {
    try {
        SmartLoading.show();
        const result = await helpDocApi.getDetail(helpDocId);
        const attachment = result.data.attachment;
        if (!_.isEmpty(attachment)) {
            defaultFileList.value = attachment;
        } else {
            defaultFileList.value = [];
        }
        Object.assign(formData, result.data);
        formData.relationIdList = result.data.relationList ? result.data.relationList.map((e) => e.relationId) : [];
        if (formData.relationIdList.length === 1 && formData.relationIdList[0].relationId === 0) {
            relateHomeFlag.value = true;
        } else {
            relateHomeFlag.value = false;
        }
    } catch (err) {
        smartSentry.captureError(err);
    } finally {
        SmartLoading.hide();
    }
}

// 点击确定，验证表单
async function onSubmit() {
    try {
        formData.contentHtml = contentRef.value.getHtml();
        formData.contentText = contentRef.value.getText();
        await formRef.value.validateFields();
        await save();
    } catch (err) {
        message.error('参数验证错误，请仔细填写表单数据!');
    }
}

// 新建、编辑API
const menuTreeSelect = ref();

async function save() {
    try {
        SmartLoading.show();
        let param = _.cloneDeep(formData);
        // 首页显示的话，为0
        if (relateHomeFlag.value) {
            param.relationList = [
                {
                    relationName: '首页',
                    relationId: 0,
                },
            ];
        } else {
            let relationList = menuTreeSelect.value.getMenuListByIdList(formData.relationIdList);
            param.relationList = relationList.map((e) => Object.assign({}, { relationId: e.menuId, relationName: e.menuName }));
        }

        if (param.helpDocId) {
            await helpDocApi.update(param);
        } else {
            await helpDocApi.add(param);
        }
        message.success('保存成功');
        emits('reloadList');
        onClose();
    } catch (err) {
        smartSentry.captureError(err);
    } finally {
        SmartLoading.hide();
    }
}

// ----------------------- 上传附件 ----------------------------
// 已上传的附件列表
const defaultFileList = ref([]);
function changeAttachment(fileList) {
    defaultFileList.value = fileList;
    formData.attachment = _.isEmpty(fileList) ? [] : fileList;
}

// ----------------------- 页面数据加载
onMounted(() => {
    getRealTimeData();
})

// ----------------------- 以下是暴露的方法内容 ------------------------
defineExpose({
    showModal,
});
</script>

<style lang="less" scoped>
.visible-list {
    display: flex;
    flex-wrap: wrap;

    .visible-item {
        padding-top: 8px;
    }
}

// 新增：零值卡片闪烁动画
@keyframes zeroFlash {
    0% {
        background-color: #fff; // 初始白色
        border-color: #f8f8f8;
    }

    50% {
        background-color: #fff5f5; // 浅红色背景
        border-color: #ffccc7; // 浅红色边框
    }

    100% {
        background-color: #fff;
        border-color: #f8f8f8;
    }
}

.device-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;

    .device-icon {
        width: 80px;
        height: 80px;
        object-fit: contain;
    }

    .device-info {
        h2 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
        }

        .device-meta {
            display: flex;
            align-items: center;
            gap: 3px;
            color: #666;

            .status-tag, .type-tag {
                margin: 0; // 清除tag默认margin，避免排版错乱
            }

            .device-type {
                font-size: 12px;
            }

            .device-address {
                font-size: 14px;
                margin-left: 5px;
            }
        }
    }
}

.data-col {
    display: flex;
    flex-direction: column;
}

.data-card {
    flex: 1;
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #f8f8f8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); // 默认阴影
    transition: all 0.3s ease;

    // hover 增强（可选）
    &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        border-color: #e8e8e8;
    }

    // 零值闪烁卡片样式（绑定动画）
    &.zero-flash-card {
        animation: zeroFlash 1.5s infinite; // 1.5秒一个周期，无限循环
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .card-title {
            font-size: 16px;
            color: #333;
            font-weight: 500;
        }

        .status-tag {
            font-size: 12px;
        }
    }

    .card-time {
        font-size: 14px;
        color: #999;
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 12px;
    }

    .card-value-group {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .card-value {
        font-size: 24px;
        font-weight: 600;
        color: #1890ff;

        &.zero-value {
            color: #ff4d4f; // 零值文字改为红色，更醒目
        }

        &.status-value {
            color: #faad14;
        }
    }

    .unit-badge {
        font-size: 12px;
        height: 20px;
        line-height: 20px;
    }
}

.status-card {
    border-left: 4px solid #faad14;
}

.no-data {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px 0;
    color: #999;
    font-size: 14px;
}
</style>
