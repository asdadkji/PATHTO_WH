// ============================================================
// 认证 Pinia store：token / userInfo 持久化到 localStorage，
// 提供 isLogin / isAdmin / getRedirectPath 等访问器。
// ============================================================
import { defineStore } from 'pinia'
import type { UserInfo } from '@/types'

interface AuthState {
  token: string
  userInfo: UserInfo | null
}

/** 从 localStorage 安全读取 userInfo */
function loadUserInfo(): UserInfo | null {
  try {
    const raw = localStorage.getItem('userInfo')
    return raw ? (JSON.parse(raw) as UserInfo) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || '',
    userInfo: loadUserInfo(),
  }),
  getters: {
    /** 是否已登录 */
    isLogin: (state): boolean => !!state.token,
    /** 是否为管理员 */
    isAdmin: (state): boolean => state.userInfo?.role === 'admin',
    /** 登录后默认跳转：管理员进后台，儿童进首页 */
    getRedirectPath: (state): string =>
      state.userInfo?.role === 'admin' ? '/admin/dashboard' : '/dashboard',
  },
  actions: {
    /** 写入登录态并持久化 */
    setAuth(payload: { token: string; userInfo: UserInfo }) {
      this.token = payload.token
      this.userInfo = payload.userInfo
      localStorage.setItem('token', payload.token)
      localStorage.setItem('userInfo', JSON.stringify(payload.userInfo))
    },
    /** 退出登录：清理内存与本地凭证 */
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
    /** 从 localStorage 重新加载（如多标签页同步后手动刷新） */
    loadFromStorage() {
      this.token = localStorage.getItem('token') || ''
      this.userInfo = loadUserInfo()
    },
  },
})
