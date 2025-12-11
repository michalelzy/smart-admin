package net.lab1024.sa.admin.module.business.oa.device.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import net.lab1024.sa.admin.constant.AdminSwaggerTagConst;
import net.lab1024.sa.admin.module.business.oa.device.domain.form.DeviceQueryForm;
import net.lab1024.sa.admin.module.business.oa.device.service.DeviceService;
import net.lab1024.sa.admin.module.business.oa.device.domain.form.*;
import net.lab1024.sa.admin.module.business.oa.device.domain.vo.DeviceExcelVO;
import net.lab1024.sa.admin.module.business.oa.device.domain.vo.DeviceListVO;
import net.lab1024.sa.admin.module.business.oa.device.domain.vo.DeviceVO;


import net.lab1024.sa.admin.module.business.oa.enterprise.domain.form.EnterpriseUpdateForm;
import net.lab1024.sa.admin.module.business.oa.enterprise.domain.vo.EnterpriseVO;
import net.lab1024.sa.base.module.support.operatelog.annotation.OperateLog;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.validation.Valid;

import net.lab1024.sa.admin.util.AdminRequestUtil;
import net.lab1024.sa.base.common.domain.PageResult;
import net.lab1024.sa.base.common.domain.RequestUser;
import net.lab1024.sa.base.common.domain.ResponseDTO;
import net.lab1024.sa.base.common.util.*;
import net.lab1024.sa.base.module.support.operatelog.annotation.OperateLog;
import org.apache.commons.collections.CollectionUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@Tag(name = AdminSwaggerTagConst.Business.OA_ENTERPRISE)
@OperateLog
public class DeviceController {
    @Resource
    private DeviceService deviceService;

    @Operation(summary = "分页查询设备模块")
    @PostMapping("/oa/device/page/query")
    @SaCheckPermission("oa:device:query")
    public ResponseDTO<PageResult<DeviceVO>> queryByPage(@RequestBody @Valid DeviceQueryForm queryForm) {
        ResponseDTO<PageResult<DeviceVO>> response = deviceService.queryByPage(queryForm);
        return response;
    }

    /**
     * 查询某个站点下的所有设备
     */
    @Operation(summary = "查询某个站点下的所有设备模块")
    @PostMapping("/oa/device/page/stationDevice/query")
    @SaCheckPermission("oa:device:query")
    public ResponseDTO<PageResult<DeviceVO>> queryByStationId(@RequestBody @Valid DeviceQueryForm queryForm) {
        log.info("Controller 接收的 queryForm 完整对象：{}", queryForm);
        log.info("Controller 接收的 stationId：{}", queryForm.getStationId());
        log.info("Controller 接收的 pageNum：{}", queryForm.getPageNum());
        log.info("Controller 接收的 deletedFlag：{}", queryForm.getDeletedFlag());
        return deviceService.queryByStationId(queryForm);
    }

    @Operation(summary = "设备管理-新建设备模块")
    @PostMapping("/oa/device/create")
    @SaCheckPermission("oa:device:add")
    public ResponseDTO<String> createDevice(@RequestBody @Valid DeviceCreateForm createVO) {
        RequestUser requestUser = SmartRequestUtil.getRequestUser();
        log.info("Device Controller");
        log.info(requestUser.toString());
        log.info(createVO.toString());
        log.info(requestUser.getUserName());
        log.info(requestUser.getUserId().toString());
        createVO.setCreateUserId(requestUser.getUserId());
        createVO.setCreateUserName(requestUser.getUserName());

        return deviceService.createDevice(createVO);
    }

    @Operation(summary = "查询设备详情 —— 点击“编辑”填充Modal")
    @GetMapping("/oa/device/get/{deviceId}")
    @SaCheckPermission("oa:device:detail")
    public ResponseDTO<DeviceVO> getDetail(@PathVariable Integer deviceId) {
        return ResponseDTO.ok(deviceService.getDetail(deviceId));
    }

    @Operation(summary = "编辑设备")
    @PostMapping("/oa/device/update")
    @SaCheckPermission("oa:device:update")
    public ResponseDTO<String> updateDevice(@RequestBody @Valid DeviceUpdateForm updateVO) {
        return deviceService.updateDevice(updateVO);
    }

    @Operation(summary = "删除设备")
    @GetMapping("/oa/device/delete/{deviceId}")
    @SaCheckPermission("oa:device:delete")
    public ResponseDTO<String> deleteDevice(@PathVariable Integer deviceId) {
        return deviceService.deleteDevice(deviceId);
    }



}
