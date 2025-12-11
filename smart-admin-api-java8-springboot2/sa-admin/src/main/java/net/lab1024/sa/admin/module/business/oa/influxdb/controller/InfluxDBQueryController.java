package net.lab1024.sa.admin.module.business.oa.influxdb.controller;

import net.lab1024.sa.admin.module.business.oa.influxdb.service.InfluxDBQueryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/influxdb")
public class InfluxDBQueryController {

    @Resource
    private InfluxDBQueryService queryService;

    /**
     * 【最终修正接口】查询指定设备和指定字段的数据，支持动态时间单位。
     * * 访问示例 (Postman/浏览器):
     * 1. 查最近 2 小时: GET http://localhost:1024/api/influxdb/query?deviceId=PV-007&rangeValue=2&rangeUnit=h&fieldName=pv_power
     * 2. 查最近 7 天: GET http://localhost:1024/api/influxdb/query?deviceId=PV-007&rangeValue=7&rangeUnit=d&fieldName=pv_power
     * 3. 查最近 1 个月: GET http://localhost:1024/api/influxdb/query?deviceId=PV-007&rangeValue=1&rangeUnit=M&fieldName=pv_power
     * * @param deviceId 设备ID
     * * @param fieldName 测量字段名 (e.g., pv_power)
     * * @param rangeValue 时间范围数值
     * * @param rangeUnit 时间范围单位 (h, d, M, etc.)
     * @return 包含查询结果和状态的 JSON 结构
     */
    @GetMapping("/query")
    public Map<String, Object> queryByDynamicRange(
            @RequestParam(name = "deviceId") String deviceId,
            @RequestParam(name = "fieldName", defaultValue = "pv_power") String fieldName,
            @RequestParam(name = "rangeValue", defaultValue = "24") int rangeValue, // 默认值改为 24
            @RequestParam(name = "rangeUnit", defaultValue = "h") String rangeUnit // 新增单位参数，默认 "h"
    ) {

        Map<String, Object> response = new HashMap<>();

        // 校验基本参数
        if (rangeValue <= 0) {
            rangeValue = 1;
        }

        // 构造 Flux 风格的时间范围字符串，例如 "24h", "7d", "1M"
        String timeRange = rangeValue + rangeUnit;

        System.out.println("🚀 接收到查询请求。设备: " + deviceId + ", 字段: " + fieldName + ", 范围: -" + timeRange);

        try {
            // 传递新的 timeRange 字符串给 Service
            List<Map<String, Object>> resultList = queryService.queryDynamicDataByRangeString(deviceId, fieldName, timeRange);

            // 构造成功的响应
            response.put("status", "SUCCESS");
            response.put("deviceId", deviceId);
            response.put("fieldName", fieldName);
            response.put("timeRange", timeRange); // 返回给前端确认
            response.put("totalRecords", resultList.size());
            response.put("data", resultList);
        } catch (Exception e) {
            // 构造失败的响应
            response.put("status", "ERROR");
            response.put("message", "查询 InfluxDB 失败，请检查配置或服务器状态。详细错误: " + e.getMessage());
            e.printStackTrace();
        }
        return response;
    }
}