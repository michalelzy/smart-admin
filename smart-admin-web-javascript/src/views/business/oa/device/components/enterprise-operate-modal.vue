<template>
  <a-modal :open="visible" :title="form.deviceId ? '编辑' : '添加'" :width="700" forceRender ok-text="确认" cancel-text="取消"
    @ok="onSubmit" @cancel="onClose">
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <a-form-item label="设备名称" name="deviceName">
        <a-input v-model:value="form.deviceName" placeholder="请输入设备名称" />
      </a-form-item>

      <!-- 原站点名称输入框替换为下拉选择器 -->
      <a-form-item label="站点名称" name="stationId">
        <a-select v-model:value="form.stationId" placeholder="请选择站点" style="width: 100%" @change="handleStationChange">
          <a-select-option v-for="station in stationList" :key="station.helpDocCatalogId"
            :value="station.helpDocCatalogId">
            {{ station.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      
      <!-- 显示选中站点的helpDocCatalogId -->
      <a-form-item label="站点ID" v-if="form.stationId">
        <a-input v-model:value="form.stationId" readonly placeholder="站点ID" style="background: #f5f5f5;" />
        <template #extra>
          <span class="text-secondary">当前站点的id</span>
        </template>
      </a-form-item>

      <!-- dtu序列号替换为下拉菜单 -->
      <a-form-item label="DTU序列号" name="dtuNumber">
        <a-select v-model:value="form.dtuNumber" placeholder="请选择dtu序列号" style="width: 100%" :options="dtuSerialList" :loading="dtuListLoading">
          <!-- <a-select-option v-for="station in stationList" :key="station.helpDocCatalogId"
            :value="station.helpDocCatalogId">
            {{ station.name }}
          </a-select-option> -->
        </a-select>
      </a-form-item>

      <!-- <a-form-item label="站点名称" name="stationName">
        <a-input v-model:value="form.stationName" placeholder="请输入站点名称" />
      </a-form-item> -->

      <!-- <a-form-item label="企业logo" name="enterpriseLogo">
        <Upload
          accept=".jpg,.jpeg,.png,.gif"
          :maxUploadSize="1"
          buttonText="点击上传企业logo"
          :default-file-list="form.enterpriseLogo"
          @change="enterpriseLogoChange"
        />
      </a-form-item> -->

      <!-- <a-form-item label="统一社会信用代码" name="unifiedSocialCreditCode">
        <a-input v-model:value="form.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" />
      </a-form-item> -->

      <a-form-item label="设备类型" name="type">
        <SmartEnumSelect width="100%" v-model:value="form.type" placeholder="请选择类型" enum-name="DEVICE_TYPE_ENUM" />
      </a-form-item>

      <a-form-item label="设备序列号" name="serialNumber">
        <a-input v-model:value="form.serialNumber" placeholder="请输入序列号" />
      </a-form-item>
      <a-form-item label="版本号" name="versionNumber">
        <a-input v-model:value="form.versionNumber" placeholder="请输入版本号" />
      </a-form-item>

      <!-- <a-form-item label="所在城市" name="provinceCityDistrict">
        <AreaCascader type="province_city_district" style="width: 100%" v-model:value="area" placeholder="请选择所在城市" @change="changeArea" />
      </a-form-item> -->
      <a-form-item label="设备型号" name="deviceModel">
        <a-input v-model:value="form.deviceModel" placeholder="请输入设备型号" />
      </a-form-item>

      <a-form-item label="光伏板数量" name="panelCount">
        <a-input v-model:value="form.panelCount" placeholder="请输入光伏板数量" />
      </a-form-item>

      <a-form-item label="装机容量" name="installedCapacity">
        <a-input v-model:value="form.installedCapacity" placeholder="装机容量" />
      </a-form-item>

      <!-- <a-form-item label="dtu序列号" name="dtuNumber">
        <a-input v-model:value="form.dtuNumber" placeholder="请输入dtu序列号" />
      </a-form-item> -->

      <!-- <a-form-item label="注册时间" name="registerTime">
        <a-date-picker v-model:value="form.registerTime" placeholder="请选择注册时间" style="width: 100%">

        </a-date-picker>
      </a-form-item> -->
      <a-form-item label="启用状态" name="disabledFlag">
        <a-switch v-model:checked="enabledChecked" @change="enabledCheckedChange" />
      </a-form-item>

      <!-- <a-form-item label="装机容量" name="installedCapacity">
        <a-input-number v-model:value="form.installedCapacity" placeholder="请输入装机容量" style="width: 100%" :precision="2" :min="0"></a-input-number>
      </a-form-item> -->

      <!-- <a-form-item label="营业执照" name="businessLicense">
        <Upload
          accept=".jpg,.jpeg,.png,.gif"
          :maxUploadSize="1"
          buttonText="点击上传营业执照"
          :default-file-list="form.businessLicense"
          @change="businessLicenseChange"
        />
      </a-form-item> -->


    </a-form>
  </a-modal>
</template>

<script setup>
import { install, message } from 'ant-design-vue';
import { onMounted, watch } from 'vue';
import _ from 'lodash';
import { nextTick, reactive, ref } from 'vue';
import { enterpriseApi } from '/@/api/business/oa/enterprise-api';
import AreaCascader from '/@/components/framework/area-cascader/index.vue';
import { SmartLoading } from '/@/components/framework/smart-loading';
import Upload from '/@/components/support/file-upload/index.vue';
import { regular } from '/@/constants/regular-const';
import { smartSentry } from '/@/lib/smart-sentry';
import SmartEnumSelect from '/@/components/framework/smart-enum-select/index.vue';
import { PAGE_SIZE } from '/@/constants/common-const';
import dayjs from 'dayjs';
import { deviceApi } from '/@/api/business/oa/device-api';
import { helpDocApi } from '/@/api/support/help-doc-api';
import { helpDocCatalogApi } from '/@/api/support/help-doc-catalog-api';

defineExpose({
  showModal,
});
const emit = defineEmits(['refresh']);

// --------------------- modal 显示与隐藏 ---------------------
// 是否展示
const visible = ref(false);
/**
 * 
 * @param {Number} deviceId 设备ID，编辑时传入，新增时不传
 */
async function showModal(deviceId) {
  //第一步：重置所有状态
  // resetAllState();
  // 第二步：如果有deviceId，说明是编辑，查询详情接口，填充表单
  // 反之，则是新增，保持表单为空
  // 查询相应接口 detail，自动填写model中的表单，才会有点击编辑，自动填充原有字段的效果
  
  // 第三步：展示弹窗
  visible.value = true;
  Object.assign(form, formDefault);
  area.value = [];

  if (deviceId) {
    await detail(deviceId);
  }
  
  visible.value = true;
  nextTick(() => {
    // 解决弹窗错误信息显示,没有可忽略
    const domArr = document.getElementsByClassName('ant-modal');
    if (domArr && domArr.length > 0) {
      Array.from(domArr).forEach((item) => {
        if (item.childNodes && item.childNodes.length > 0) {
          Array.from(item.childNodes).forEach((child) => {
            if (child.setAttribute) {
              child.setAttribute('aria-hidden', 'false');
            }
          });
        }
      });
    }
  });
}

function handleModalClose() {
  visible.value = false;
  nextTick(() => {
    resetAllState();
  });
}

// 写这段代码的目的是重置弹窗中的所有状态，避免有时候会出现残留数据的问题造成无法提交表单
function resetAllState() {
  //1.充值表单数据，清楚所以残留数据
  form = reactive({ ...formDefault });
  //2.重置表单校验状态
  if (formRef.value) {
    formRef.value.clearValidate();
    formRef.value.resetFields();
  }
  //3.重置地区选择器
  area.value = [];
  //4.重置开关状态
  enabledChecked.value = !formDefault.disabledFlag;
  //5.重置下拉选择器
  form.stationId = undefined;
  form.dtuNumber = undefined;
}

function onClose() {
  handleModalClose();
  visible.value = false;
}

async function detail(deviceId) {
  try {
    let result = await deviceApi.detail(deviceId);
    let data = result.data;
    console.log(data);
    // 这里是解决一个错误。就是在“编辑”时，查询数据库会返回一个字符串的时间，但是前端组件时一个 <a-date-picker> 无法直接和字符串匹配
    // 所以就需要用dayjs先将字符串转换为dayjs（一种Date类型可以和 <a-date-picker> 兼容>，不然就会报错，导致前端逻辑错误
    if (data.registerTime) {
      data.registerTime = dayjs(data.registerTime);
    }
    Object.assign(form, data);
    nextTick(() => {
      // 省市区不存在，不需要赋值
      if (!data.provinceName) {
        return;
      }
      area.value = [
        {
          value: data.province,
          label: data.provinceName,
        },
        {
          value: data.city,
          label: data.cityName,
        },
        {
          value: data.district,
          label: data.districtName,
        },
      ];
    });
  } catch (error) {
    smartSentry.captureError(error);
  } finally {
    SmartLoading.hide();
  }
}

// -------------------- 站点选择器 ----------------
const stationList = ref([]);
const tableLoading = ref(false);
const total = ref(0);

const queryFormState = {
  // helpDocCatalogId: props.helpDocCatalogId, //目录
  keywords: '', //标题、作者
  createTimeBegin: null, //创建-开始时间
  createTimeEnd: null, //创建-截止时间
  pageNum: 1,
  pageSize: PAGE_SIZE,
};
const queryForm = reactive({ ...queryFormState });

const handleStationChange = (stationId) => {
  const selectedStation = stationList.value.find( item => item.helpDocCatalogId === stationId);
  if (selectedStation) {
    form.stationId = stationId;
    form.stationName = selectedStation.name
  }
}

// 获取已有站点列表
async function queryStationList() {
  try {
    tableLoading.value = true;
    const result = await helpDocCatalogApi.getAll(queryForm);
    // 得到了站点目录的列表，
    console.log('站点列表', result.data);
    stationList.value = (result.data || []).filter(item => item.helpDocCatalogId > 513437);
    console.log('stationList is', stationList);
  } catch (error) {
    smartSentry.captureError(error);
    message.error('获取站点列表失败');
  }
}

// --------------------- DTU序列号选择器 ------------------

const dtuSerialList = ref([]);
const dtuListLoading = ref(false);

// 3. 新增模拟InfluxDB查询DTU序列号的方法
async function fetchDtuSerialList() {
  try {
    dtuListLoading.value = true;
    // 模拟接口请求延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    // 模拟InfluxDB返回的DTU数据（后续替换为真实接口）
    const mockDtuData = [
      { label: 'DTU001-北京站点', value: '860678074035413' },
      { label: 'DTU002-上海站点', value: '860678074080112' },
      { label: 'DTU003-广州站点', value: '860678074049117' },
      { label: 'DTU004-深圳站点', value: '860678074084908' },
      { label: 'DTU005-杭州站点', value: '860678074002082' },
    ];
    dtuSerialList.value = mockDtuData;
  } catch (error) {
    smartSentry.captureError(error);
    message.error('获取DTU序列号失败，请稍后重试');
  } finally {
    dtuListLoading.value = false;
  }
}

// --------------------- 表单 ---------------------

//  组件
const formRef = ref();

const formDefault = {
  deviceName: undefined,
  stationName: undefined,
  serialNumber: undefined,
  versionNumber: undefined,
  deviceModel: undefined,
  dtuNumber: undefined,
  enterpriseId: undefined,
  enterpriseName: undefined,
  stationName: undefined,
  unifiedSocialCreditCode: undefined,
  businessLicense: undefined,
  contact: undefined,
  enterpriseLogo: undefined,
  contactPhone: undefined,
  email: undefined,
  registerTime: undefined,
  installedCapacity: undefined,
  province: undefined,
  provinceName: undefined,
  city: undefined,
  cityName: undefined,
  district: undefined,
  districtName: undefined,
  address: undefined,
  disabledFlag: false,
  type: undefined,
  deviceId: undefined,
  installedCapacity: undefined,
  panelCount: undefined,
};
let form = reactive({ ...formDefault });
// 强制输入规则（如果想某个输入内容必须强制输入）
const rules = {
  // enterpriseName: [{ required: true, message: '请输入企业名称' }],
  deviceName: [{ required: true, message: '请输入设备名称' }],
  stationName: [{ required: true, message: '请输入站点名称' }],
  stationId:[{ required: true, message: '请输选择站点' }],
  serialNumber: [{ required: true, message: '请输入设备序列号' }],
  versionNumber: [{ required: true, message: '请输入版本号' }],
  deviceModel: [{ required: true, message: '请输入设备型号' }],
  dtuNumber: [{ required: true, message: '请输入dtu序列号' }],
  // dtuSerialNumber:[{ required: true, message: '请选择DTU序列号'}],
  // unifiedSocialCreditCode: [{ required: true, message: '请输入统一社会信用代码' }],
  // contact: [{ required: true, message: '请输入联系人' }],
  // contactPhone: [
  //   { required: true, message: '请输入联系人电话' },
  //   { pattern: regular.phone, message: '请输入正确的联系人电话', trigger: 'blur' },
  // ],
  type: [{ required: true, message: '请选择类型' }],
  panelCount: [{ required: true, message: '请输入光伏板数量' }],
  installedCapacity: [{ required: true, message: '请输入装机容量' }],
  // installedCapacity: [{ required: true, message: '请输入装机容量' }],
  // registerTime: [{ required: true, message: '请选择注册时间' }],

};

// 添加页面，点击“确定”后调用 onSubmit()
function onSubmit() {
  formRef.value
    .validate()
    .then(async () => {
      SmartLoading.show();
      try {
        if (form.deviceId) {
          // 调用更新接口API
          await deviceApi.update(form);
        } else {
          // 调用创建接口API
          await deviceApi.create(form);
        }
        message.success(`${form.deviceId ? '修改' : '添加'}成功`);
        // 通过 emit 发送信息，主动刷新页面
        emit('refresh');
        onClose();
      } catch (error) {
        smartSentry.captureError(error);
      } finally {
        SmartLoading.hide();
      }
    })
    .catch((error) => {
      console.log('error', error);
      message.error('参数验证错误，请仔细填写表单数据!');
    });
}

// 状态
const enabledChecked = ref(true);

function enabledCheckedChange(checked) {
  form.disabledFlag = !checked;
}

// 地区
const area = ref([]);

function changeArea(value, selectedOptions) {
  Object.assign(form, {
    province: '',
    provinceName: '',
    city: '',
    cityName: '',
    district: '',
    districtName: '',
  });
  if (!_.isEmpty(selectedOptions)) {
    // 地区信息
    form.province = area.value[0].value;
    form.provinceName = area.value[0].label;

    form.city = area.value[1].value;
    form.cityName = area.value[1].label;
    if (area.value[2]) {
      form.district = area.value[2].value;
      form.districtName = area.value[2].label;
    }
  }
}

function enterpriseLogoChange(fileList) {
  form.enterpriseLogo = fileList;
}

function businessLicenseChange(fileList) {
  form.businessLicense = fileList;
}

onMounted(async () => {
  await queryStationList();
  fetchDtuSerialList();
}
)
</script>

<style lang="less" scoped>
.form-width {
  width: 100% !important;
}

.footer {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

:deep(.ant-card-body) {
  padding: 10px;
}
</style>
