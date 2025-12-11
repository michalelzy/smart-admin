package net.lab1024.sa.admin.config;

import com.influxdb.client.InfluxDBClient;

import com.influxdb.client.InfluxDBClientFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InfluxDataBaseConfig {

    @Value("${influxdb.url}")
    private String url;

    @Value("${influxdb.token}")
    private String token;

    @Value("${influxdb.org}")
    private String org;

    @Value("${influxdb.bucket}")
    private String bucket;


    /**
     * 创建 InfluxDBClient Bean 实例，外部（或者其他Spring boot 组件要使用这个实例，直接使用　＠Resource 进行依赖注入来使用就可以了）
     * @return InfluxDBClient 实例
     */
    @Bean
    public InfluxDBClient influxDBClient() {
        // 使用 InfluxDBClientFactory 创建客户端实例
        // 这里的 token, org, bucket 都是 InfluxDB 2.x API 所需的参数
        return InfluxDBClientFactory.create(url, token.toCharArray(), org, bucket);
    }
}