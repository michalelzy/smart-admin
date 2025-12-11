package net.lab1024.sa.admin.module.business.oa.influxdb.service;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.client.QueryApi;
import com.influxdb.query.FluxRecord;
import com.influxdb.query.FluxTable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InfluxDBQueryService {

    private final QueryApi queryApi;
    private final String org;
    private final String bucket;
    private static final String MEASUREMENT_NAME = "pv_device_status"; // 测量名称可以设为常量或从配置中获取

    public InfluxDBQueryService(
            InfluxDBClient influxDBClient,
            @Value("${influxdb.org}") String org,
            @Value("${influxdb.bucket}") String bucket
    ) {
        this.queryApi = influxDBClient.getQueryApi();
        this.org = org;
        this.bucket = bucket;
    }

    // 废弃/移除原有的 queryDynamicData 方法以避免混淆，或将其标记为 Deprecated。

    /**
     * 【新增/最终方法】执行动态 Flux 查询，支持 Flux 风格的时间范围字符串。
     * @param deviceId 设备ID (Tag)
     * @param fieldName 测量字段名 (Field)
     * @param timeRange Flux 风格的时间范围字符串 (e.g., "24h", "7d", "1M")
     * @return 包含查询结果数据的列表
     */
    public List<Map<String, Object>> queryDynamicDataByRangeString(String deviceId, String fieldName, String timeRange) {

        // 1. 动态构造 Flux 查询语句
        // 使用 timeRange 变量来构造 range(start: -...)
        String fluxQuery = String.format(
                "from(bucket:\"%s\") " +
                        "|> range(start: -%s) " + // ⬅️ 直接使用 Flux 风格的时间字符串
                        "|> filter(fn: (r) => r[\"_measurement\"] == \"%s\") " +
                        "|> filter(fn: (r) => r[\"device_id\"] == \"%s\") " +
                        "|> filter(fn: (r) => r[\"_field\"] == \"%s\") " +
                        "|> sort(columns: [\"_time\"], desc: true)",
                bucket, timeRange, MEASUREMENT_NAME, deviceId, fieldName
        );


        System.out.println("🤖 执行 Flux 查询: " + fluxQuery);

        // 2. 执行查询 (保持不变)
        List<FluxTable> tables = queryApi.query(fluxQuery, org);

        // 3. 处理查询结果 (保持不变)
        List<Map<String, Object>> resultList = new ArrayList<>();

        for (FluxTable fluxTable : tables) {
            for (FluxRecord fluxRecord : fluxTable.getRecords()) {

                Map<String, Object> recordMap = new HashMap<>();

                fluxRecord.getValues().forEach((key, value) -> {
                    if (!key.startsWith("_") &&
                            !key.equals("result") &&
                            !key.equals("table") &&
                            !key.equals("bucket") &&
                            !key.equals("organization")) {
                        recordMap.put(key, value);
                    }
                });

                recordMap.put("time", fluxRecord.getTime());

                String fieldKey = fluxRecord.getField();
                Object fieldValue = fluxRecord.getValue();

                if (fieldKey != null) {
                    recordMap.put(fieldKey, fieldValue);
                }

                resultList.add(recordMap);
            }
        }

        System.out.println("✅ 查询成功！共返回 " + resultList.size() + " 条数据。");
        return resultList;
    }
}