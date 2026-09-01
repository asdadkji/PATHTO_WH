// ============================================================
// axios 封装：统一注入 token、拆包响应 { code, data, message }、
// 401 自动清理凭证并跳转登录；业务层只需读 data。
// ============================================================
import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
})

// 不需要注入 token 的白名单（认证相关接口）
const WHITE_LIST = ['/auth/login', '/auth/register']

// 请求拦截器：注入 token（白名单除外；从 localStorage 读取以保持向后兼容）
service.interceptors.request.use(
  (config) => {
    const url = config.url || ''
    const inWhite = WHITE_LIST.some((p) => url.includes(p))
    const token = localStorage.getItem('token')
    if (token && !inWhite) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：拆包 { code, data, message }；401 清理并跳登录
service.interceptors.response.use(
  (response) => {
    const { code, data } = response.data
    if (code === 0) {
      return data
    }
    // 业务错误：统一 reject 为 { code, message } 结构，便于业务层处理
    return Promise.reject(response.data)
  },
  (error) => {
    const status = error?.response?.status
    // 401：token 缺失或失效，清理本地凭证并跳登录页
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      const current = window.location.pathname + window.location.search
      if (!current.startsWith('/auth/login')) {
        const redirect = encodeURIComponent(current)
        window.location.href = `/auth/login?redirect=${redirect}`
      }
    }
    // 归一化错误结构，便于业务层统一读取 code / message
    const respData = error?.response?.data
    const normalized = {
      code: respData?.code ?? status ?? -1,
      message: respData?.message || error?.message || '网络异常，请稍后重试',
    }
    return Promise.reject(normalized)
  },
)

export default service
