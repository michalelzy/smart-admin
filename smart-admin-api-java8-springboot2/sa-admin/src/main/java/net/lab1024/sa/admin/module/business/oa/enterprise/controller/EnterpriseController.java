package net.lab1024.sa.admin.module.business.oa.enterprise.controller;

import cn.dev33.satoken.annotation.SaCheckPermission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import net.lab1024.sa.admin.constant.AdminSwaggerTagConst;
import net.lab1024.sa.admin.module.business.oa.enterprise.service.EnterpriseService;
import net.lab1024.sa.admin.module.business.oa.enterprise.domain.form.*;
import net.lab1024.sa.admin.module.business.oa.enterprise.domain.vo.EnterpriseEmployeeVO;
import net.lab1024.sa.admin.module.business.oa.enterprise.domain.vo.EnterpriseExcelVO;
import net.lab1024.sa.admin.module.business.oa.enterprise.domain.vo.EnterpriseListVO;
import net.lab1024.sa.admin.module.business.oa.enterprise.domain.vo.EnterpriseVO;
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

/**
 * 企业
 *
 * @Author 1024创新实验室: 开云
 * @Date 2022/7/28 20:37:15
 * @Wechat zhuoda1024
 * @Email lab1024@163.com
 * @Copyright  <a href="https://1024lab.net">1024创新实验室</a>
 */
@Slf4j
@RestController
@Tag(name = AdminSwaggerTagConst.Business.OA_ENTERPRISE)
@OperateLog
public class EnterpriseController {

    @Resource
    private EnterpriseService enterpriseService;


    // @Operation注解是Swagger/OpenAPI 规范中的核心注解（通常来自io.swagger.v3.oas.annotations.Operation），它的作用是为接口生成标准化的 API 文档，让接口信息更清晰、可维护，同时支持自动化文档展示和接口测试。
    @Operation(summary = "分页查询企业模块 @author 开云")
    @PostMapping("/oa/enterprise/page/query")
    // 这个注解是 Sa-Token 框架 提供的权限校验注解（Sa-Token 是一款轻量级 Java 权限认证框架），核心作用是：拦截当前接口的访问请求，校验调用者是否拥有指定权限（oa:enterprise:query），无权限则直接拒绝访问。
    @SaCheckPermission("oa:enterprise:query")
    public ResponseDTO<PageResult<EnterpriseVO>> queryByPage(@RequestBody @Valid EnterpriseQueryForm queryForm) {
        return enterpriseService.queryByPage(queryForm);
    }

    @Operation(summary = "导出企业信息 @author 卓大")
    @PostMapping("/oa/enterprise/exportExcel")
    public void exportExcel(@RequestBody @Valid EnterpriseQueryForm queryForm, HttpServletResponse response) throws IOException {
        List<EnterpriseExcelVO> data = enterpriseService.getExcelExportData(queryForm);
        if (CollectionUtils.isEmpty(data)) {
            SmartResponseUtil.write(response, ResponseDTO.userErrorParam("暂无数据"));
            return;
        }

        String watermark = AdminRequestUtil.getRequestUser().getActualName();
        watermark += SmartLocalDateUtil.format(LocalDateTime.now(), SmartDateFormatterEnum.YMD_HMS);

        SmartExcelUtil.exportExcelWithWatermark(response,"电站基本信息.xlsx","电站信息",EnterpriseExcelVO.class,data,watermark);

    }

    @Operation(summary = "查询企业详情 @author 开云")
    @GetMapping("/oa/enterprise/get/{enterpriseId}")
    @SaCheckPermission("oa:enterprise:detail")
    public ResponseDTO<EnterpriseVO> getDetail(@PathVariable Long enterpriseId) {
        return ResponseDTO.ok(enterpriseService.getDetail(enterpriseId));
    }

    //是的，前端传递的内容会自动映射并装入 createVO（即 EnterpriseCreateForm 对象），这是 Spring MVC 的参数绑定机制实现的，具体过程如下：@RequestBody 注解：表示 Spring 会将前端 POST 请求的JSON 格式请求体，通过 Jackson 等 JSON 解析工具，自动转换为 EnterpriseCreateForm 类型的 Java 对象（即 createVO）。
    @Operation(summary = "新建企业 @author 开云")
    @PostMapping("/oa/enterprise/create")
    @SaCheckPermission("oa:enterprise:add")
    public ResponseDTO<String> createEnterprise(@RequestBody @Valid EnterpriseCreateForm createVO) {
        RequestUser requestUser = SmartRequestUtil.getRequestUser();

        createVO.setCreateUserId(requestUser.getUserId());
        createVO.setCreateUserName(requestUser.getUserName());
        return enterpriseService.createEnterprise(createVO);
    }

    @Operation(summary = "编辑企业 @author 开云")
    @PostMapping("/oa/enterprise/update")
    @SaCheckPermission("oa:enterprise:update")
    public ResponseDTO<String> updateEnterprise(@RequestBody @Valid EnterpriseUpdateForm updateVO) {
        return enterpriseService.updateEnterprise(updateVO);
    }

    @Operation(summary = "删除企业 @author 开云")
    @GetMapping("/oa/enterprise/delete/{enterpriseId}")
    @SaCheckPermission("oa:enterprise:delete")
    public ResponseDTO<String> deleteEnterprise(@PathVariable Long enterpriseId) {
        return enterpriseService.deleteEnterprise(enterpriseId);
    }

    @Operation(summary = "按照类型查询企业 @author 开云")
    @GetMapping("/oa/enterprise/query/list")
    @SaCheckPermission("oa:enterprise:query")
    public ResponseDTO<List<EnterpriseListVO>> queryList(@RequestParam(value = "type", required = false) Integer type) {
        return enterpriseService.queryList(type);
    }


    @Operation(summary = "企业添加员工 @author 罗伊")
    @PostMapping("/oa/enterprise/employee/add")
    @SaCheckPermission("oa:enterprise:addEmployee")
    public ResponseDTO<String> addEmployee(@RequestBody @Valid EnterpriseEmployeeForm enterpriseEmployeeForm) {
        return enterpriseService.addEmployee(enterpriseEmployeeForm);
    }

    @Operation(summary = "查询企业全部员工 @author 罗伊")
    @PostMapping("/oa/enterprise/employee/list")
    @SaCheckPermission("oa:enterprise:queryEmployee")
    public ResponseDTO<List<EnterpriseEmployeeVO>> employeeList(@RequestBody @Valid List<Long> enterpriseIdList) {
        return ResponseDTO.ok(enterpriseService.employeeList(enterpriseIdList));
    }

    @Operation(summary = "分页查询企业员工 @author 卓大")
    @PostMapping("/oa/enterprise/employee/queryPage")
    @SaCheckPermission("oa:enterprise:queryEmployee")
    public ResponseDTO<PageResult<EnterpriseEmployeeVO>> queryPageEmployeeList(@RequestBody @Valid EnterpriseEmployeeQueryForm queryForm) {
        return ResponseDTO.ok(enterpriseService.queryPageEmployeeList(queryForm));
    }


    @Operation(summary = "企业删除员工 @author 罗伊")
    @PostMapping("/oa/enterprise/employee/delete")
    @SaCheckPermission("oa:enterprise:deleteEmployee")
    public ResponseDTO<String> deleteEmployee(@RequestBody @Valid EnterpriseEmployeeForm enterpriseEmployeeForm) {
        return enterpriseService.deleteEmployee(enterpriseEmployeeForm);
    }
}
