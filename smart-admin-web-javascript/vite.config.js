/*
 * vite配置
 *
 * @Author:    1024创新实验室-主任：卓大
 * @Date:      2022-05-02 23:44:56
 * @Wechat:    zhuda1024
 * @Email:     lab1024@163.com
 * @Copyright  1024创新实验室 （ https://1024lab.net ），Since 2012
 */
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import customVariables from '/@/theme/custom-variables.js';

// 定义路径解析函数：将相对路径转换为绝对路径。pathResolve 函数的核心作用是将相对路径安全、准确地转换为绝对路径，这是前端工程化中处理文件路径的基础操作，不做这一步会导致路径解析混乱、跨环境报错等问题。
const pathResolve = (dir) => {
  // resolve 是 Node.js 的路径处理模块，__dirname 是当前文件所在目录
  // 作用：拼接当前目录（vite.config.js 所在目录）与传入的 dir，返回绝对路径
  return resolve(__dirname, '.', dir);
};
export default {
  base: process.env.NODE_ENV === 'production' ? '/' : '/',
  root: process.cwd(),
  resolve: {
    alias: [
      // 国际化替换
      {
        find: 'vue-i18n', // 当导入 'vue-i18n' 时
        replacement: 'vue-i18n/dist/vue-i18n.cjs.js', // 实际加载这个具体的文件（CommonJS 版本）
      },
      // 绝对路径重命名：/@/xxxx => src/xxxx
      {
        find: /\/@\//, // 匹配以 "/@/" 开头的路径（正则表达式，确保精确匹配）
        replacement: pathResolve('src') + '/', // 替换为项目中 src 目录的绝对路径 + 斜杠
      },
      {
        find: /^~/,
        replacement: '',
      },
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 8081,
    server: {
      proxy: {
        // 代理路径
        '/': {
          target: 'http://127.0.0.1:1024/', // 目标服务器地址
          changeOrigin: true, // 是否修改请求头中的 Origin 字段
          rewrite: (path) => path, // 重写路径
        },
      },
    }
  },
  plugins: [vue()],
  optimizeDeps: {
    include: ['ant-design-vue/es/locale/zh_CN', 'dayjs/locale/zh-cn', 'ant-design-vue/es/locale/en_US'],
    exclude: ['vue-demi'],
  },
  build: {
    // 清除console和debugger
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        //配置这个是让不同类型文件放在不同文件夹，不会显得太乱
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]',
        manualChunks(id) {
          //静态资源分拆打包
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    target: 'esnext',
    outDir: 'dist', // 指定输出路径
    assetsDir: 'assets', // 指定生成静态文件目录
    assetsInlineLimit: '4096', // 小于此阈值的导入或引用资源将内联为 base64 编码
    chunkSizeWarningLimit: 500, // chunk 大小警告的限制
    minify: 'terser', // 混淆器，terser构建后文件体积更小
    emptyOutDir: true, //打包前先清空原有打包文件
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: customVariables,
        javascriptEnabled: true,
      },
    },
  },
  define: {
    __INTLIFY_PROD_DEVTOOLS__: false,
    'process.env': process.env,
  },
};
