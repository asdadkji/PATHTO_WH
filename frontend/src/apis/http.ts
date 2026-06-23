// 封装axios
import axios from 'axios'
import {useAuthStore} from "@/stores/auth.ts";

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {'Content-Type': 'application/json;charset=UTF-8'}
})
//token白名单
const whiteListPatterns = [
  /^\/home$/,
  /^\/auth\/login$/,
  /^\/auth\/register$/,
  /^\/auth\/forget$/,
  /^\/product\/\d+$/,
  /^\/filter$/,
  /^\/filter\/category$/,
  /^\/filter\/search$/
]
// 请求拦截器
service.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    const url = config.url ?? ''

    // 检查是否在白名单中
    const isWhiteList = whiteListPatterns.some(pattern => pattern.test(url))
    // 如果不是白名单，添加token
    if (!isWhiteList) {
      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
      } else {
        console.warn(`⚠️ ${url} 需要token但未登录`)
        // 可以选择在这跳转到登录页
      }
    } else {
      console.log(`⏩ ${url} 在白名单中，跳过token添加`)
    }

    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const {code,data} = response.data;
    if (code === 0) {
      return data
    } else {
      console.log('响应拦截器 - 错误响应:', response.status, response.data);
      return Promise.reject(response.data)
    }
  },
  (error) => {
    console.log('响应拦截器 - 错误:', error.response?.status, error.message);
    return Promise.reject(error)
  }
)

export default service
