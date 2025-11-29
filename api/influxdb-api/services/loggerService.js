const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// 定义日志格式
const logFormat = winston.format.printf(({ message }) => {
  // 我们只关心消息体本身，并且希望每条消息是独立的JSON
  return message;
});

/**
 * winston-daily-rotate-file 的工作机制是：当 datePattern 配置存在时，它会优先根据时间来切割文件。你把时间精确到了秒（HHmmss），这意味着每一秒都会创建一个新的文件，所以你才会看到 “一个文件只有一条数据” 的现象。
解决方案
要实现 “按文件大小切割”，你需要移除 datePattern 配置，或者将其设置为一个不会频繁触发的值（比如 YYYYMMDD，每天切割一次）。当 datePattern 不存在或不满足时间条件时，maxSize 配置才会生效。
 */

// 创建一个按大小切割的传输器
const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join('./data/logs', 'pv_data_%DATE%.log'),
  datePattern: 'YYYYMMDD', // 文件名中的日期格式，精确到秒以避免冲突
  maxSize: '1m', // 单个文件最大大小，支持 'k', 'm', 'g'
  zippedArchive: false, // 是否压缩归档文件
  maxFiles: '14d', // 保留14天的日志文件
  format: winston.format.combine(
    logFormat
  )
});

// 创建logger实例
const logger = winston.createLogger({
  level: 'info', // 级别可以随意，因为我们主要用它来写入数据
  transports: [
    fileRotateTransport
  ]
});


/**
 * 写入光伏数据到日志文件（使用回调函数）
 * @param {object} data - 光伏数据对象
 * @param {function} callback - 回调函数，格式：(err) => {}
 */
function writePvDataToFile(data, callback) {
  if (!data) {
    console.warn('[FileLogger] 传入的数据为空，已跳过写入。');
    // 调用回调函数，第一个参数为 null 表示成功
    return callback(null);
  }

  const dataString = JSON.stringify(data);
  /**
   * 你说得对，writePvDataToFile 函数里并没有一行像 fs.writeFile() 这样的 “写入” 代码。真正执行写入操作的，是 logger.info(dataString, callback) 这一行。
   */
  // 使用 logger.info 的回调来处理结果
  logger.info(dataString, (err) => {
    if (err) {
      const errorMsg = `[FileLogger] 光伏数据写入文件失败：${err.message}`;
      console.error(errorMsg);
      // 调用回调函数，并传递错误对象
      return callback(new Error(errorMsg));
    } 
    else {
      const successMsg = `[FileLogger] 光伏数据已成功写入文件：${data.device_id} @ ${new Date(data.report_time * 1000).toLocaleString()}`;
      console.log(successMsg);
      // 调用回调函数，第一个参数为 null 表示成功
      return callback(null);
    }
  });
}

module.exports = {
  write: writePvDataToFile
};