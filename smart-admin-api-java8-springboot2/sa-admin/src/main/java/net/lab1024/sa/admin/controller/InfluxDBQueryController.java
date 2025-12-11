//package net.lab1024.sa.admin.controller;
//
//import net.lab1024.sa.admin.module.business.oa.enterprise.domain.vo.EnterpriseVO;
//import net.lab1024.sa.admin.service.InfluxDBQueryService;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
//import net.lab1024.sa.base.common.domain.PageResult;
//import net.lab1024.sa.base.common.domain.RequestUser;
//import net.lab1024.sa.base.common.domain.ResponseDTO;
//import net.lab1024.sa.base.common.util.*;
//
//import javax.annotation.Resource;
//
//@RestController
//@RequestMapping("/api/influxdb")
//public class InfluxDBQueryController {
//
//    @Resource
//    private InfluxDBQueryService queryService;
//
////    public InfluxDBQueryController(InfluxDBQueryService queryService) {
////        this.queryService = queryService;
////    }
//
////    /**
////     * 【修正后的测试接口】查询指定设备和指定字段的数据
////     * * 访问示例 (Postman/浏览器):
////     * GET http://localhost:8080/api/influxdb/query?deviceId=PV-007&rangeHours=2&fieldName=pv_power
////     * * @param deviceId 设备ID
////     * * @param fieldName 测量字段名 (e.g., pv_power)
////     * @param rangeHours 查询时间范围
////     * @return 包含查询结果和状态的 JSON 结构
////     */
////    @GetMapping("/query")
////    public Map<String, Object> queryByPage(
////            @RequestParam(name = "deviceId") String deviceId,
////            @RequestParam(name = "fieldName", defaultValue = "pv_power") String fieldName, // 增加 Field 动态参数
////            @RequestParam(name = "rangeHours", defaultValue = "500") int rangeHours) {
////
////        Map<String, Object> response = new HashMap<>();
////
////        System.out.println("🚀 接收到查询请求。设备: " + deviceId + ", 字段: " + fieldName + ", 范围: " + rangeHours + "h");
////
////        try {
////            // 传递所有动态参数给 Service
////            List<Map<String, Object>> resultList = queryService.queryDynamicData(deviceId, fieldName, rangeHours);
////
////            // 构造成功的响应
////            response.put("status", "SUCCESS");
////            response.put("deviceId", deviceId);
////            response.put("fieldName", fieldName);
////            response.put("rangeHours", rangeHours);
////            response.put("totalRecords", resultList.size());
////            response.put("data", resultList);
////
////        } catch (Exception e) {
////            // 构造失败的响应
////            response.put("status", "ERROR");
////            response.put("message", "查询 InfluxDB 失败，请检查配置或服务器状态。详细错误: " + e.getMessage());
////            e.printStackTrace();
////        }
////        return response;
////    }
//    /**
//     * 【修正后的测试接口】查询指定设备和指定字段的数据
//     * * 访问示例 (Postman/浏览器):
//     * GET http://localhost:8080/api/influxdb/query?deviceId=PV-007&rangeHours=2&fieldName=pv_power
//     * * @param deviceId 设备ID
//     * * @param fieldName 测量字段名 (e.g., pv_power)
//     * @param rangeHours 查询时间范围
//     * @return 包含查询结果和状态的 JSON 结构
//     */
//    @GetMapping("/query")
//    public ResponseDTO<PageResult<EnterpriseVO>> queryByPage(
//            @RequestParam(name = "deviceId") String deviceId,
//            @RequestParam(name = "fieldName", defaultValue = "pv_power") String fieldName, // 增加 Field 动态参数
//            @RequestParam(name = "rangeHours", defaultValue = "500") int rangeHours) {
//
//        Map<String, Object> response = new HashMap<>();
//
//        System.out.println("🚀 接收到查询请求。设备: " + deviceId + ", 字段: " + fieldName + ", 范围: " + rangeHours + "h");
//
//        try {
//            // 传递所有动态参数给 Service
//            List<Map<String, Object>> resultList = queryService.queryDynamicData(deviceId, fieldName, rangeHours);
//
//            // 构造成功的响应
//            response.put("status", "SUCCESS");
//            response.put("deviceId", deviceId);
//            response.put("fieldName", fieldName);
//            response.put("rangeHours", rangeHours);
//            response.put("totalRecords", resultList.size());
//            response.put("data", resultList);
//
//        } catch (Exception e) {
//            // 构造失败的响应
//            response.put("status", "ERROR");
//            response.put("message", "查询 InfluxDB 失败，请检查配置或服务器状态。详细错误: " + e.getMessage());
//            e.printStackTrace();
//        }
//        return response;
//    }
//}