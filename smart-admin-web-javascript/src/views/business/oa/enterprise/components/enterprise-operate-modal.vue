<template>
  <a-modal
    :open="visible"
    :title="form.enterpriseId ? '编辑' : '添加'"
    :width="700"
    forceRender
    ok-text="确认"
    cancel-text="取消"
    @ok="onSubmit"
    @cancel="onClose"
  >
    <a-form ref="formRef" :model="form" :rules="rules" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <a-form-item label="公司名称" name="enterpriseName">
        <a-input v-model:value="form.enterpriseName" placeholder="请输入公司名称" />
      </a-form-item>

      <a-form-item label="站点名称" name="stationName">
        <a-input v-model:value="form.stationName" placeholder="请输入站点名称" />
      </a-form-item>

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

      <a-form-item label="类型" name="type">
        <SmartEnumSelect width="100%" v-model:value="form.type" placeholder="请选择类型" enum-name="ENTERPRISE_TYPE_ENUM" />
      </a-form-item>

      <a-form-item label="联系人" name="contact">
        <a-input v-model:value="form.contact" placeholder="请输入联系人" />
      </a-form-item>
      <a-form-item label="联系人电话" name="contactPhone">
        <a-input v-model:value="form.contactPhone" placeholder="请输入联系人电话" />
      </a-form-item>

      <a-form-item label="所在城市" name="province">
        <AreaCascader type="province_city_district" style="width: 100%" v-model:value="area" placeholder="请选择所在城市" @change="changeArea" />
      </a-form-item>
      <a-form-item label="详细地址" name="address">
        <a-input v-model:value="form.address" placeholder="请输入详细地址" />
      </a-form-item>

      <a-form-item label="邮箱" name="email">
        <a-input v-model:value="form.email" placeholder="请输入邮箱" />
      </a-form-item>

      <a-form-item label="注册时间" name="registerTime">
        <a-date-picker v-model:value="form.registerTime" placeholder="请选择注册时间" style="width: 100%">

        </a-date-picker>
      </a-form-item>
      <a-form-item label="启用状态" name="disabledFlag">
        <a-switch v-model:checked="enabledChecked" @change="enabledCheckedChange" />
      </a-form-item>

      <a-form-item label="装机容量" name="installedCapacity">
        <a-input-number v-model:value="form.installedCapacity" placeholder="请输入装机容量" style="width: 100%" :precision="2" :min="0"></a-input-number>
      </a-form-item>

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
  import { message } from 'ant-design-vue';
  import _ from 'lodash';
  import { nextTick, reactive, ref } from 'vue';
  import { enterpriseApi } from '/@/api/business/oa/enterprise-api';
  import AreaCascader from '/@/components/framework/area-cascader/index.vue';
  import { SmartLoading } from '/@/components/framework/smart-loading';
  import Upload from '/@/components/support/file-upload/index.vue';
  import { regular } from '/@/constants/regular-const';
  import { smartSentry } from '/@/lib/smart-sentry';
  import SmartEnumSelect from '/@/components/framework/smart-enum-select/index.vue';

  import dayjs from 'dayjs';
  defineExpose({
    showModal,
  });
  const emit = defineEmits(['refresh']);

  // --------------------- modal 显示与隐藏 ---------------------
  // 是否展示
  const visible = ref(false);

  function showModal(enterpriseId) {
    console.log('企业时：',enterpriseId);
    Object.assign(form, formDefault);
    area.value = [];
    if (enterpriseId) {
      detail(enterpriseId);
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

  function onClose() {
    visible.value = false;
  }

  async function detail(enterpriseId) {
    try {
      let result = await enterpriseApi.detail(enterpriseId);
      let data = result.data;
      console.log('返回的 registerTime 是', data.registerTime);
      console.log('register.Time的类型是',typeof data.registerTime);
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

  // --------------------- 表单 ---------------------

  //  组件
  const formRef = ref();

  const formDefault = {
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
  };
  let form = reactive({ ...formDefault });
  // 强制输入规则（如果想某个输入内容必须强制输入）
  const rules = {
    enterpriseName: [{ required: true, message: '请输入企业名称' }],
    stationName: [{ required: true, message: '请输入站点名称' }],
    // unifiedSocialCreditCode: [{ required: true, message: '请输入统一社会信用代码' }],
    contact: [{ required: true, message: '请输入联系人' }],
    contactPhone: [
      { required: true, message: '请输入联系人电话' },
      { pattern: regular.phone, message: '请输入正确的联系人电话', trigger: 'blur' },
    ],
    type: [{ required: true, message: '请选择类型' }],
    installedCapacity: [{ required: true, message: '请输入装机容量' }],
    registerTime: [{ required: true, message: '请选择注册时间' }],
    province:[{ required: true, message: '请选择所在地区' }],

  };

  function onSubmit() {
    formRef.value
      .validate()
      .then(async () => {
        SmartLoading.show();
        try {
          if (form.enterpriseId) {
            await enterpriseApi.update(form);
          } else {
            await enterpriseApi.create(form);
          }
          message.success(`${form.enterpriseId ? '修改' : '添加'}成功`);
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
