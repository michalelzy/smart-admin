package net.lab1024.sa.admin.module.business.oa.device.domain.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

import net.lab1024.sa.admin.module.business.oa.device.constant.DeviceTypeEnum;
import net.lab1024.sa.base.module.support.datatracer.annoation.DataTracerFieldEnum;
import net.lab1024.sa.base.module.support.datatracer.annoation.DataTracerFieldLabel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Data
@TableName("t_oa_device")
public class DeviceEntity {
//    @TableId(type = IdType.AUTO)
//    private Long enterpriseId;

    @TableId(type = IdType.AUTO)
    private Long deviceId;

    /**
     * 站点名称
     */
    @DataTracerFieldLabel("站点名称")
    private String stationName;

    @DataTracerFieldLabel("设备名称")
    private String deviceName;

    /**
     * 企业logo
     */
//    @DataTracerFieldLabel("企业logo")
//    private String enterpriseLogo;

    /**
     * 统一社会信用代码
     */
//    @DataTracerFieldLabel("统一社会信用代码")
//    private String unifiedSocialCreditCode;

    /**
     * 类型
     *
     * @see DeviceTypeEnum
     */
    @DataTracerFieldLabel("类型")
    @DataTracerFieldEnum(enumClass = DeviceTypeEnum.class)
    private Integer type;

    /**
     * 联系人
     */
    @DataTracerFieldLabel("设备序列号")
    private String serialNumber;

    /**
     * 联系人电话
     */
    @DataTracerFieldLabel("设备版本号")
    private String versionNumber;

    /**
     * 邮箱
     */
    @DataTracerFieldLabel("设备型号")
    private String deviceModel;

    /**
     * 省份
     */
//    private Integer province;

    /**
     * 省份名称
     */
    @DataTracerFieldLabel("dtu序列号")
    private String dtuNumber;

    /**
     * 城市
     */
//    private Integer city;

    /**
     * 城市名称
     */
    @DataTracerFieldLabel("设备状态")
    private Boolean status;

    /**
     * 区县
     */
//    private Integer district;

    /**
     * 区县名称
     */
    @DataTracerFieldLabel("dtu状态")
    private Boolean dtuStatus;

    /**
     * 详细地址
     */
//    @DataTracerFieldLabel("详细地址")
//    private String address;

    /**
     * 营业执照
     */
//    @DataTracerFieldLabel("营业执照")
//    private String businessLicense;

    /**
     * 禁用状态
     */
    @DataTracerFieldLabel("禁用状态")
    private Boolean disabledFlag;

    /**
     * 删除状态
     */
    @DataTracerFieldLabel("删除状态")
    private Boolean deletedFlag;

    /**
     * 创建人ID
     */
    private Long createUserId;

    /**
     * 创建人ID
     */
    private String createUserName;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @DataTracerFieldLabel("更新时间")
    private LocalDateTime updateTime;

    @DataTracerFieldLabel("站点ID")
    private Integer stationId;

    @DataTracerFieldLabel("光伏板数量")
    private Integer panelCount;

    @DataTracerFieldLabel("装机容量")
    private String installedCapacity;

    /**
     * 注册时间
     */
//    @DataTracerFieldLabel("注册时间")
//    private OffsetDateTime registerTime;

    /**
     * 注册时间
     */
//    @DataTracerFieldLabel("装机容量")
//    private BigDecimal installedCapacity;
}
