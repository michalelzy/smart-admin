package net.lab1024.sa.admin.module.business.oa.device.domain.form;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * OA企业模块编辑
 *
 * @Author 1024创新实验室: 开云
 * @Date 2022/7/28 20:37:15
 * @Wechat zhuoda1024
 * @Email lab1024@163.com
 * @Copyright  <a href="https://1024lab.net">1024创新实验室</a>
 */
@Data
public class DeviceUpdateForm extends DeviceCreateForm {

    @Schema(description = "设备ID")
    @NotNull(message = "设备ID不能为空")
    private Integer deviceId;
}
