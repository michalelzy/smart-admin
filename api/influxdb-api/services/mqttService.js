const mqtt = require('mqtt');
// 导出config多个对象，拿到其中的mqtt对象（对象结构赋值），并将mqtt赋值给新的常量mqttConfig
// mqttConfig 是一个 const 后期不能修改引用
const {mqtt:mqttConfig} = require('../config/config.js');

// MQTT 客户端实例
let client;

// 消息处理回调函数数组
// 支持注册多个处理器，例如一个写入 Redis，一个直接写入数据库（用于调试）
let messageHandlers = [];

/**
 * 初始化 MQTT 客户端
 * @private
 */
function _initClient() {
    if (client) {
        return; // 防止重复初始化
    }

    client = mqtt.connect(mqttConfig.brokerUrl, {
        //如果config有id就用id，没有id就随机产生一个id
        clientId: mqttConfig.clientId || `mqtt-client-${Math.random().toString(16).substr(2, 8)}`,
        clean: mqttConfig.clean || false,
        reconnectPeriod: mqttConfig.reconnectPeriod || 1000,
        // 如果你的 MQTT Broker 需要认证
        username: mqttConfig.username,
        password: mqttConfig.password,
    });

    client.on('connect', () => {
        console.log(`[MQTT Service] Connected to broker: ${mqttConfig.brokerUrl}`);
        // 连接成功后，订阅主题组；
        if (Array.isArray(mqttConfig.topics) && mqttConfig.topics.length > 0){
            client.subscribe(mqttConfig.topics, (err, granted) => {
                if (err) {
                    console.error(`[MQTT Service] Failed to subscribe to topics Array:`, err);
                } else {
                    // granted 包含所有成功订阅的主题信息
                    const subscribedTopics = granted.map(item => item.topic).join(', ');
                    console.log(`[MQTT Service] Successfully!! Subscribed to topics Array: ${subscribedTopics}`);
                }
            })
        } else {
            console.warn(`[MQTT Service] No Valid topics Array configured`);
        }
    });

    client.on('message', (topic, message) => {
        console.log(`[MQTT Service] Received message on topic: ${topic}`);
        try {
            const payload = JSON.parse(message.toString());
            // 将消息分发给所有注册的处理器
            messageHandlers.forEach(handler => {
                handler(payload, topic);
            });
        } catch (error) {
            console.error(`[MQTT Service] Error parsing JSON message on topic '${topic}'. Please ensure the message is a valid JSON string.`);
            console.error(`[MQTT Service] Raw message: ${message.toString()}`);
            console.error(`[MQTT Service] Error processing message: ${message.toString()}`, error);
        }
    });

    client.on('error', (err) => {
        console.error('[MQTT Service] Client error:', err);
    });

    client.on('reconnect', () => {
        console.log('[MQTT Service] Reconnecting...');
    });

    client.on('close', () => {
        console.log('[MQTT Service] Connection closed');
    });
}

/**
 * 启动 MQTT 服务
 */
function start() {
    _initClient();
}

/**
 * 停止 MQTT 服务并关闭连接
 */
function stop() {
    if (client) {
        client.end(true, () => {
            console.log('[MQTT Service] Connection closed gracefully');
        });
        client = null;
    }
}

/**
 * 注册消息处理函数
 * @param {Function} handler - 处理函数，签名为 (payload, topic) => {}
 */
function registerMessageHandler(handler) {
    if (typeof handler === 'function' && !messageHandlers.includes(handler)) {
        messageHandlers.push(handler);
        console.log(`[MQTT Service] Registered new message handler. Total handlers: ${messageHandlers.length}`);
    } else {
        console.warn('[MQTT Service] Handler is not a function or already registered.');
    }
}

/**
 * 移除已注册的消息处理函数
 * @param {Function} handler - 要移除的处理函数
 */
function unregisterMessageHandler(handler) {
    const index = messageHandlers.indexOf(handler);
    if (index !== -1) {
        messageHandlers.splice(index, 1);
        console.log(`[MQTT Service] Unregistered message handler. Total handlers: ${messageHandlers.length}`);
    }
}

// 导出服务接口
module.exports = {
    start,
    stop,
    registerMessageHandler,
    unregisterMessageHandler,
};