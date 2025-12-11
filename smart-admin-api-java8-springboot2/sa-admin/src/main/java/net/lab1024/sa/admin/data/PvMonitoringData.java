package net.lab1024.sa.admin.data;

import com.influxdb.annotations.Column;
import com.influxdb.annotations.Measurement;
import lombok.Data;
import java.time.Instant;

/**
 * 对应 InfluxDB 的一个 Measurement (测量/表)
 * InfluxDB 2.x 推荐使用 Instant 作为时间戳类型
 */
@Data // 使用 Lombok 简化 Getter/Setter
@Measurement(name = "pv_monitoring_data") // 对应 InfluxDB 中的表名
public class PvMonitoringData {

    // --- Tags (标签/索引) ---
    // 标签用于高效过滤和查询
    @Column(tag = true)
    private String device_id;

    @Column(tag = true)
    private String gateway_id;

    @Column(tag = true)
    private String region_code;

    // --- Fields (字段/值) ---
    // 字段用于存储实际的测量值
    @Column
    private Integer device_status;

    @Column
    private Double pv_power;

    @Column
    private Double pv_voltage;

    @Column
    private Double output_voltage;

    @Column
    private Double output_current;

    @Column
    private Double dc_meter_power;

    // --- Time (时间戳) ---
    // 必须有 time = true 标注，并使用 Instant 类型
    // report_time 是您的 payload 字段名，但 InfluxDB 需要 time 列
    @Column(timestamp = true)
    private Instant report_time;

    // 注意：如果您的入参是秒级时间戳，您需要在 Controller 中转换它。
    // 为了代码简洁，我们假设前端传入 Instant 格式或直接传入秒级时间戳
}