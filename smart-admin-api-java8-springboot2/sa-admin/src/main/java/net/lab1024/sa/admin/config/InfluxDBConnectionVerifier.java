package net.lab1024.sa.admin.config;

import com.influxdb.client.InfluxDBClient;
import com.influxdb.exceptions.InfluxException;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class InfluxDBConnectionVerifier implements ApplicationRunner {

    private final InfluxDBClient influxDBClient;

    // 注入您在 InfluxDataBaseConfig 中创建的 InfluxDBClient Bean
    public InfluxDBConnectionVerifier(InfluxDBClient influxDBClient) {
        this.influxDBClient = influxDBClient;
    }

    /**
     * 应用程序启动后立即运行此方法
     */
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("======================================================");
        System.out.println("🚀 正在验证 InfluxDB 连接...");

        try {
            // 使用客户端提供的 Health Check 或简单 API 调用进行连接测试。
            // 推荐使用 ping() 或 health() 方法，它们不会产生实际的读写操作。

            // InfluxDBClient.health() 方法会返回 HealthCheck 对象
            // 如果返回的状态是 ready/pass，则表示连接成功。
            influxDBClient.health();

            // 如果 health() 成功返回，则打印成功信息
            System.out.println("✅ InfluxDB 连接成功！配置和连接有效。");

        } catch (InfluxException e) {
            // 如果连接失败，InfluxDBClient 会抛出 InfluxException
            System.err.println("❌ InfluxDB 连接失败！请检查配置或服务器状态。");
            System.err.println("错误信息: " + e.getMessage());

            // 生产环境中，可以考虑在这里退出应用以防止后续错误
            // System.exit(1);

        } catch (Exception e) {
            // 捕获其他可能的异常，如网络问题等
            System.err.println("❌ InfluxDB 连接测试发生未知错误！");
            System.err.println("错误类型: " + e.getClass().getName());
            System.err.println("错误信息: " + e.getMessage());
        } finally {
            // 注意：不应该在每次测试后关闭客户端，它应该保持打开状态供应用使用
            System.out.println("======================================================");
        }
    }
}