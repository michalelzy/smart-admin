package net.lab1024.sa.admin.module.business.oa.device.domain.vo;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import net.lab1024.sa.admin.module.business.oa.device.constant.DeviceTypeEnum;
import net.lab1024.sa.base.common.json.serializer.FileKeyVoSerializer;
import net.lab1024.sa.base.common.swagger.SchemaEnum;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

/**
 * 企业信息
 *
 * @Author 1024创新实验室: 开云
 * @Date 2022/7/28 20:37:15
 * @Wechat zhuoda1024
 * @Email lab1024@163.com
 * @Copyright  <a href="https://1024lab.net">1024创新实验室</a>
 */
@Data
public class DeviceVO {

//    @Schema(description = "企业ID")
//    private Long enterpriseId;
//
//    @Schema(description = "企业名称")
//    private String enterpriseName;
//
//    @Schema(description = "企业logo")
//    @JsonSerialize(using = FileKeyVoSerializer.class)
//    private String enterpriseLogo;
//
//    @Schema(description = "统一社会信用代码")
//    private String unifiedSocialCreditCode;

    @SchemaEnum(desc = "类型", value = DeviceTypeEnum.class)
    private Integer type;

//    @Schema(description = "联系人")
//    private String contact;
//
//    @Schema(description = "联系人电话")
//    private String contactPhone;
//
//    @Schema(description = "邮箱")
//    private String email;
//
//    @Schema(description = "省份")
//    private Integer province;
//
//    @Schema(description = "省份名称")
//    private String provinceName;
//
//    @Schema(description = "城市")
//    private Integer city;
//
//    @Schema(description = "城市名称")
//    private String cityName;
//
//    @Schema(description = "区县")
//    private Integer district;
//
//    @Schema(description = "区县名称")
//    private String districtName;
//
//    @Schema(description = "详细地址")
//    private String address;
//
//    @Schema(description = "营业执照")
//    @JsonSerialize(using = FileKeyVoSerializer.class)
//    private String businessLicense;
//
//    @Schema(description = "禁用状态")
//    private Boolean disabledFlag;
//
//    @Schema(description = "创建人ID")
//    private Long createUserId;
//
//    @Schema(description = "创建人名称")
//    private String createUserName;
//
//    @Schema(description = "创建时间")
//    private LocalDateTime createTime;
//
//    @Schema(description = "更新时间")
//    private LocalDateTime updateTime;
//
//    @Schema(description = "站点名称")
//    private String stationName;
//
//    @Schema(description = "注册时间")
//    private LocalDateTime registerTime;
//
//    @Schema(description = "装机容量")
//    private BigDecimal installedCapacity;

    @Schema(description = "站点名称")
    private String stationName;

    @Schema(description = "设备ID")
    private Integer deviceId;

    @Schema(description = "设备名称")
    private String deviceName;

    @Schema(description = "设备序列号")
    private String serialNumber;

    @Schema(description = "设备版本号")
    private String versionNumber;

    @Schema(description = "设备型号")
    private String deviceModel;

    @Schema(description = "dtu序列号")
    private String dtuNumber;

    @Schema(description = "设备状态")
    private Boolean status;

    @Schema(description = "dtu状态")
    private Boolean dtuStatus;

    @Schema(description = "上报时间")
    private LocalDateTime updateTime;

    @Schema(description = "禁用标志")
    private Boolean disabledFlag;

    @Schema(description = "删除状态")
    private Boolean deletedFlag;

    @Schema(description = "创建人ID")
    private Integer createUserId;

    @Schema(description = "创建人名称")
    private String createUserName;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "站点ID")
    private Integer stationId;

    @Schema(description = "光伏板数量")
    private Integer panelCount;

    @Schema(description = "装机容量")
    private String installedCapacity;
}
