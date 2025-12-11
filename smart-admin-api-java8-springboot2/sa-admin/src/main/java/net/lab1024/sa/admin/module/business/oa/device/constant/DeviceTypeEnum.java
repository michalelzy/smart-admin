package net.lab1024.sa.admin.module.business.oa.device.constant;

import net.lab1024.sa.base.common.enumeration.BaseEnum;
public enum DeviceTypeEnum implements BaseEnum {
    /**
     *  德瑞恒网络科技有限公司
     */
    Controller(1,"控制器"),
    ElectricityMeter(2,"电表"),;

    private Integer value;
    private String desc;

    DeviceTypeEnum(Integer value, String desc) {
        this.value = value;
        this.desc = desc;
    }

    @Override
    public Integer getValue() {return value;}

    @Override
    public String getDesc() {return desc;}
}
