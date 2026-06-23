import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  //插件控制
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({resolvers:[ElementPlusResolver({importStyle:true})]}),
    Components({resolvers:[ElementPlusResolver({importStyle:true})]}),
  ],
  //路径优化
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'components':path.resolve(__dirname, './src/components'),
      'views': path.resolve(__dirname, './src/views'),
      'utils': path.resolve(__dirname, './src/utils'),
      'apis': path.resolve(__dirname, './src/apis'),
      '@assets': path.resolve(fileURLToPath(new URL('./assets', import.meta.url))),
      'lodash': 'lodash-es'
    },
    extensions:['.js','.ts','.jsx','.tsx','.json','.vue']
  },
  //样式设计
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@assets/styles/abstracts" as *; @use "@assets/styles/base" as *;`
      }
    }
  },
  //服务器配置
  server: {
    port: 8080,
    host:'0.0.0.0',
    open: true,
    cors: true,

    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p,
        configure: (proxy, options) => {
          proxy.on('error', (err) => console.log('[Proxy] error', err));
          proxy.on('proxyReq', (req) => {
            // Vite 把原始路径放在 header
            const original = (req as any).headers?.['x-original-url'] || req.path || (req as any).url || '';
            console.log('[Proxy] >', req.method, original);
          });
        }
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p,
        configure: (proxy, options) => {
          proxy.on('error', (err) => console.log('[Proxy /uploads] error:', err));
          proxy.on('proxyReq', (req) => {
            const original = (req as any).headers?.['x-original-url'] || req.path || (req as any).url || '';
            console.log('[Proxy /uploads] >', req.method, original, '->', options.target + original);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Proxy /uploads] <', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  //构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vender': ['vue', 'vue-router', 'pinia'],
          'ui-library': ['element-plus'],
          'utils': ['lodash-es', 'dayjs', 'axios'],
          'editor': ['@wangeditor/editor']
        }
      }
    }
  },
  //环境变量
  define: {
    __APP_ENV__: JSON.stringify(process.env.APP_ENV)
  },
  // 优化预处理
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'lodash-es',
      'dayjs',
      'axios',
      '@wangeditor/editor'
      ]
  }
})
