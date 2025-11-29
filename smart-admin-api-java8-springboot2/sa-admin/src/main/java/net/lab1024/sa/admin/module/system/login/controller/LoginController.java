package net.lab1024.sa.admin.module.system.login.controller;

import cn.dev33.satoken.stp.StpUtil;
import cn.hutool.extra.servlet.ServletUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.lab1024.sa.admin.constant.AdminSwaggerTagConst;
import net.lab1024.sa.admin.module.system.login.domain.LoginForm;
import net.lab1024.sa.admin.module.system.login.domain.LoginResultVO;
import net.lab1024.sa.admin.module.system.login.service.LoginService;
import net.lab1024.sa.admin.util.AdminRequestUtil;
import net.lab1024.sa.base.common.annoation.NoNeedLogin;
import net.lab1024.sa.base.common.constant.RequestHeaderConst;
import net.lab1024.sa.base.common.domain.ResponseDTO;
import net.lab1024.sa.base.common.util.SmartRequestUtil;
import net.lab1024.sa.base.module.support.captcha.domain.CaptchaVO;
import net.lab1024.sa.base.module.support.securityprotect.service.Level3ProtectConfigService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

/**
 * 员工登录
 *
 * @Author 1024创新实验室-主任:卓大
 * @Date 2021-12-15 21:05:46
 * @Wechat zhuoda1024
 * @Email lab1024@163.com
 * @Copyright <a href="https://1024lab.net">1024创新实验室</a>
 */
@RestController
@Tag(name = AdminSwaggerTagConst.System.SYSTEM_LOGIN)
public class LoginController {

    @Resource
    private LoginService loginService;

    @Resource
    private Level3ProtectConfigService level3ProtectConfigService;

    @NoNeedLogin
    @PostMapping("/login")
    @Operation(summary = "登录 @author 卓大")
    public ResponseDTO<LoginResultVO> login(@Valid @RequestBody LoginForm loginForm, HttpServletRequest request) {
        String ip = ServletUtil.getClientIP(request);
        String userAgent = ServletUtil.getHeaderIgnoreCase(request, RequestHeaderConst.USER_AGENT);
        return loginService.login(loginForm, ip, userAgent);
    }

    // 这是 Spring MVC 的注解，作用是：
    // 声明该方法处理 GET 请求；
    // 匹配的请求路径是 /login/getLoginInfo（与前端调用的接口地址对应）；
    // 前端通过 GET 方式访问这个地址时，会触发下面的方法执行。
    @GetMapping("/login/getLoginInfo")
    // 这是 Swagger/OpenAPI 的注解，用于接口文档生成：方便开发人员理解接口用途，也用于自动化 API 文档展示。
    @Operation(summary = "获取登录结果信息  @author 卓大")
    public ResponseDTO<LoginResultVO> getLoginInfo() {
        // ResponseDTO 是项目全局统一的响应结果封装类（包含状态码、消息、数据体）；
        // LoginResultVO 是具体的返回数据类型（VO = View Object，视图对象），封装了前端需要的登录结果数据（用户信息、菜单、权限等）；
        // StpUtil 是 Sa-Token（权限认证框架）的工具类，用于处理登录状态；
        String tokenValue = StpUtil.getTokenValue();
        // AdminRequestUtil.getRequestUser()：从请求上下文获取当前登录的用户对象（如用户 ID / 账号）；
        // loginService.getLoginResult(...)：调用LoginService（业务层）的方法，根据用户信息和 Token 组装前端需要的登录结果：
        // 包括用户基本信息（姓名、头像、部门）；
        // 用户权限对应的菜单列表（用于前端渲染侧边栏）；
        // 功能权限点（用于前端按钮权限控制）等；
        LoginResultVO loginResult = loginService.getLoginResult(AdminRequestUtil.getRequestUser(), tokenValue);
        // loginResult 是封装好的视图对象，包含前端页面构建所需的所有核心数据。
        // loginResult.setToken(tokenValue);将 Token 设置到返回结果中：
        loginResult.setToken(tokenValue);
        return ResponseDTO.ok(loginResult);
    }

    @Operation(summary = "退出登录  @author 卓大")
    @GetMapping("/login/logout")
    public ResponseDTO<String> logout() {
        return loginService.logout(SmartRequestUtil.getRequestUser());
    }

    @Operation(summary = "获取验证码  @author 卓大")
    @GetMapping("/login/getCaptcha")
    @NoNeedLogin
    public ResponseDTO<CaptchaVO> getCaptcha() {
        return loginService.getCaptcha();
    }

    @NoNeedLogin
    @GetMapping("/login/sendEmailCode/{loginName}")
    @Operation(summary = "获取邮箱登录验证码 @author 卓大")
    public ResponseDTO<String> sendEmailCode(@PathVariable String loginName) {
        return loginService.sendEmailCode(loginName);
    }


    @NoNeedLogin
    @GetMapping("/login/getTwoFactorLoginFlag")
    @Operation(summary = "获取双因子登录标识 @author 卓大")
    public ResponseDTO<Boolean> getTwoFactorLoginFlag() {
        // 双因子登录
        boolean twoFactorLoginEnabled = level3ProtectConfigService.isTwoFactorLoginEnabled();
        return ResponseDTO.ok(twoFactorLoginEnabled);
    }
}
