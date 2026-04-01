//认证仓库
import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {applyForMerchant, beforeResetPwd, login, register, resetPwd, isMerchant2} from "@/apis/services/auth.ts"
import storage from "@/utils/localstorage.ts";
import {asyncComputed} from "@vueuse/core";
import {jwtDecode} from 'jwt-decode';
//引入购物车仓库
import {useCartStore} from "@/stores/cart.ts";
//ts
export interface MyJwtPayload {
  sub: string
  username: string
  exp: number
  role?: string
  userId?: number
}
export const useAuthStore = defineStore('auth', () => {
  const cartStore = useCartStore()
  //token持久化
  const token = ref(localStorage.getItem('token') || '')
  //用户基础信息
  const user = ref(storage.get('user') || {})
  //登录状态
  const isLogin = computed(() => !!token.value)
  //商家身份认证
  const isMerchant = ref(storage.get('is_merchant') || false)
  //解析token
  const myJwtDecode = (token: string | null):MyJwtPayload | null => {
    if(!token) return null
    try {
      const raw = token.replace(/^Bearer\s+/i, '')
      return jwtDecode(raw) as MyJwtPayload
    }catch (e) {
      return null
    }
  }
  const decodedToken = computed(() => myJwtDecode(token.value))
  //用户身份认证
  const isUser = computed(() => decodedToken.value?.role === 'student')
  const isAdmin = computed(() => decodedToken.value?.role === 'admin')
  const isTransport = computed(() => decodedToken.value?.role === 'transporter')
  const isMaxAdmin = computed(() => decodedToken.value?.role === 'maxAdmin')
  const userId = computed(() => decodedToken.value?.userId)

  const isSeller = asyncComputed(async () => {
    if (!userId.value) return false
    return await isMerchant2(userId.value)
  })

  //登录
  const loginAction = async (p:any) => {
    const res = await login(p);
    token.value = res.token;
    storage.set('user', res.user)
    user.value = res.user;
    localStorage.setItem('token', token.value)
    cartStore.switchUser(String(userId))
  }
  //注册
  const registerAction = async (p:any) => {
    await register(p);
  }
  //重置前置验证
  const beforeResetPwdAction = async (username:string,phone:number) => {
    return await beforeResetPwd(username,phone);
  }
  //重置密码
  const resetPwdAction = async (p:any) => {
    await resetPwd(p);
  }
  //登出
  const logout = () => {
    token.value = ''
    user.value = ''
    localStorage.removeItem('token')
    storage.remove('user')
    storage.remove('is_merchant')
    cartStore.logout()
  }
  //商家登录
  const applyForMerchantAction = async (userId:number,realName:string) => {
    const res = await applyForMerchant(userId, realName);
    if(!res) {
      isMerchant.value = true
      storage.set('is_merchant', true)
    }
  }
  //分角色重定向
  const getRedirectPath = () => {
    if(isAdmin || isMaxAdmin || isTransport) {
      return '/admin'
    } else {
      return '/home'
    }
  }

  return {
    token,
    user,
    isLogin,
    loginAction,
    registerAction,
    resetPwdAction,
    logout,
    isMerchant,
    applyForMerchantAction,
    isUser,
    isAdmin,
    isTransport,
    isMaxAdmin,
    userId,
    beforeResetPwdAction,
    getRedirectPath,
    isSeller,
    decodedToken
  }
})
