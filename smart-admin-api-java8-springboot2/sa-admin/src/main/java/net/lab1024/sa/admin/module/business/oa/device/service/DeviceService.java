package net.lab1024.sa.admin.module.business.oa.device.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import net.lab1024.sa.admin.module.business.oa.device.dao.DeviceDao;
//import net.lab1024.sa.admin.module.business.oa.device.dao.DeviceEmployeeDao;
//import net.lab1024.sa.admin.module.business.oa.device.domain.entity.DeviceEmployeeEntity;
import net.lab1024.sa.admin.module.business.oa.device.domain.entity.DeviceEntity;
import net.lab1024.sa.admin.module.business.oa.device.domain.form.*;
//import net.lab1024.sa.admin.module.business.oa.device.domain.vo.DeviceEmployeeVO;
import net.lab1024.sa.admin.module.business.oa.device.domain.vo.DeviceExcelVO;
import net.lab1024.sa.admin.module.business.oa.device.domain.vo.DeviceListVO;
import net.lab1024.sa.admin.module.business.oa.device.domain.vo.DeviceVO;

import net.lab1024.sa.admin.module.system.department.service.DepartmentService;
import net.lab1024.sa.base.common.code.UserErrorCode;
import net.lab1024.sa.base.common.domain.PageResult;
import net.lab1024.sa.base.common.domain.ResponseDTO;
import net.lab1024.sa.base.common.util.SmartBeanUtil;
import net.lab1024.sa.base.common.util.SmartPageUtil;
import net.lab1024.sa.base.module.support.datatracer.constant.DataTracerTypeEnum;
import net.lab1024.sa.base.module.support.datatracer.domain.form.DataTracerForm;
import net.lab1024.sa.base.module.support.datatracer.service.DataTracerService;
import org.apache.commons.collections4.CollectionUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;


/**
 * 企业
 *
 * @Author 1024创新实验室: 开云
 * @Date 2022/7/28 20:37:15
 * @Wechat zhuoda1024
 * @Email lab1024@163.com
 * @Copyright <a href="https://1024lab.net">1024创新实验室</a>
 */
@Service
@Slf4j
public class DeviceService {

    @Resource
    private DeviceDao deviceDao;



    @Resource
    private DataTracerService dataTracerService;

    @Resource
    private DepartmentService departmentService;

    /**
     * 分页查询企业模块
     *
     */
    public ResponseDTO<PageResult<DeviceVO>> queryByPage(DeviceQueryForm queryForm) {
        queryForm.setDeletedFlag(Boolean.FALSE);
        Page<?> page = SmartPageUtil.convert2PageQuery(queryForm);
        List<DeviceVO> deviceList = deviceDao.queryPage(page, queryForm);
        PageResult<DeviceVO> pageResult = SmartPageUtil.convert2PageResult(page, deviceList);
        return ResponseDTO.ok(pageResult);
    }

    /**
     * 根据 站点ID 查询该站点下的所有设备
     */
    public ResponseDTO<PageResult<DeviceVO>> queryByStationId(DeviceQueryForm queryForm) {
        log.info("Service 接收的 queryForm 完整对象：{}", queryForm);
        log.info("Service 接收的 stationId：{}", queryForm.getStationId());
        log.info("Service 接收的 pageNum：{}", queryForm.getPageNum());
        queryForm.setDeletedFlag(Boolean.FALSE);
        Page<?> page = SmartPageUtil.convert2PageQuery(queryForm);

        List<DeviceVO> deviceList = deviceDao.queryByStationId(page, queryForm);
        PageResult<DeviceVO> pageResult = SmartPageUtil.convert2PageResult(page, deviceList);
        return ResponseDTO.ok(pageResult);
    }

    /**
     * 获取导出数据
     */
    public List<DeviceExcelVO> getExcelExportData(DeviceQueryForm queryForm) {
        queryForm.setDeletedFlag(false);
        return deviceDao.selectExcelExportData(queryForm);
    }

    /**
     * 查询企业详情
     *
     */
    public DeviceVO getDetail(Integer deviceId) {
        return deviceDao.getDetail(deviceId, Boolean.FALSE);
    }

    /**
     * 新建企业
     *
     */
    @Transactional(rollbackFor = Exception.class)
    public ResponseDTO<String> createDevice(DeviceCreateForm createVO) {
        // 验证企业名称是否重复
        // todo:将 queryByEnterpriseName里 的代码修改为 queryByDeviceName
        DeviceEntity validateDevice = deviceDao.queryByDeviceName(createVO.getDeviceName(), null, Boolean.FALSE);
        if (Objects.nonNull(validateDevice)) {
            return ResponseDTO.userErrorParam("企业名称重复");
        }
        // 数据插入
        DeviceEntity insertDevice = SmartBeanUtil.copy(createVO, DeviceEntity.class);
        log.info("inserDevice.createUserId {}",insertDevice.getCreateUserId());
        log.info("inserDevice.createUserName {}", insertDevice.getCreateUserName());
        // 向数据库中插入记录（DeviceEntity），继承了 mybatis-core-plus 的自动 CRUD 接口
        deviceDao.insert(insertDevice);
        dataTracerService.insert(insertDevice.getDeviceId(), DataTracerTypeEnum.OA_ENTERPRISE);
        return ResponseDTO.ok();
    }

    /**
     * 编辑企业
     *
     */
    @Transactional(rollbackFor = Exception.class)
    public ResponseDTO<String> updateDevice(DeviceUpdateForm updateVO) {
        Integer deviceId = updateVO.getDeviceId();
        // 校验企业是否存在
        DeviceEntity deviceDetail = deviceDao.selectById(deviceId);
        if (Objects.isNull(deviceDetail) || deviceDetail.getDeletedFlag()) {
            return ResponseDTO.userErrorParam("设备不存在");
        }
        // 验证设备名称是否重复
        DeviceEntity validateDevice = deviceDao.queryByDeviceName(updateVO.getDeviceName(), deviceId, Boolean.FALSE);
        if (Objects.nonNull(validateDevice)) {
            return ResponseDTO.userErrorParam("企业名称重复");
        }
        // 数据编辑
        DeviceEntity updateEntity = SmartBeanUtil.copy(deviceDetail, DeviceEntity.class);
        SmartBeanUtil.copyProperties(updateVO, updateEntity);
        deviceDao.updateById(updateEntity);

        //变更记录
//        DataTracerForm dataTracerForm = DataTracerForm.builder()
//                .dataId(updateVO.getDeviceId())
//                .type(DataTracerTypeEnum.OA_ENTERPRISE)
//                .content("修改企业信息")
//                .diffOld(dataTracerService.getChangeContent(deviceDetail))
//                .diffNew(dataTracerService.getChangeContent(updateEntity))
//                .build();
//
//        dataTracerService.addTrace(dataTracerForm);
        return ResponseDTO.ok();
    }


    /**
     * 删除企业
     *
     */
    @Transactional(rollbackFor = Exception.class)
    public ResponseDTO<String> deleteDevice(Integer deviceId) {
        // 校验企业是否存在
        DeviceEntity deviceDetail = deviceDao.selectById(deviceId);
        if (Objects.isNull(deviceDetail) || deviceDetail.getDeletedFlag()) {
            return ResponseDTO.userErrorParam("设备不存在");
        }
        deviceDao.deleteDevice(deviceId, Boolean.TRUE);
//        dataTracerService.delete(deviceId, DataTracerTypeEnum.OA_ENTERPRISE);
        return ResponseDTO.ok();
    }

    /**
     * 企业列表查询
     */
    public ResponseDTO<List<DeviceListVO>> queryList(Integer type) {
        List<DeviceListVO> deviceList = deviceDao.queryList(type, Boolean.FALSE, Boolean.FALSE);
        return ResponseDTO.ok(deviceList);
    }

    //----------------------------------------- 以下为员工相关--------------------------------------------

    /**
     * 企业添加员工
     *
     */


    /**
     * 企业删除员工
     *
     */


    /**
     * 企业下员工列表
     *
     */


    /**
     * 分页查询企业员工
     *
     */

}
