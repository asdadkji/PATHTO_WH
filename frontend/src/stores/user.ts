//用户仓库
import { defineStore } from 'pinia'
import {ref,reactive} from 'vue'
import { getUserInfo, changeUserInfo } from '@/apis/services/user.ts'
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
import type{User} from '@/types/api/user.ts'
//持久化
import storage from '@/utils/localstorage.ts'
const STORAGE_KEYS = {
  USER_INFO:'user_info',
  ORIGINAL_USER_INFO:'original_user_info'
}

export const useUserStore = defineStore('user', () => {
  //用户信息
  const userInfo = ref<User | null>(storage.get(STORAGE_KEYS.USER_INFO))
  const originalUserInfo = ref<User | null>(storage.get(STORAGE_KEYS.ORIGINAL_USER_INFO))
  const saveToStorage = () => {
    storage.set(STORAGE_KEYS.USER_INFO,userInfo.value)
    storage.set(STORAGE_KEYS.ORIGINAL_USER_INFO,originalUserInfo.value)
  }
  //清除持久化
  const clearStorage = () => {
    storage.remove(STORAGE_KEYS.USER_INFO)
    storage.remove(STORAGE_KEYS.ORIGINAL_USER_INFO)
  }
  //获取用户信息
  const getUserInfoById = async (userId:number) => {
    const res = await getUserInfo(userId)
    //浅拷贝
    userInfo.value = {...res}
    //保留原始副本
    originalUserInfo.value = {...res}
    saveToStorage()
  }
  //返回副本
  const getFormData = () => {
    return userInfo.value ? {...userInfo.value} : null
  }
  //提交修改
  const submitFormData = async (userId:number,formData:any) => {
    try {
      const res = await changeUserInfo(userId,formData)
      userInfo.value = {...res}
      originalUserInfo.value = {...res}
      saveToStorage()
      return res
    } catch (e) {
      userInfo.value = originalUserInfo.value ? {...originalUserInfo.value} : null
      saveToStorage()
      throw e;
    }
  }
  //取消/重置表单
  const resetFormData = () => {
    if (originalUserInfo.value) {
      userInfo.value = {...originalUserInfo.value}
      saveToStorage()
    }
  }
  //持久化
  const initializeFromStorage = () => {
    const storedUserInfo = storage.get(STORAGE_KEYS.USER_INFO)
    const storedOriginalUserInfo = storage.get(STORAGE_KEYS.ORIGINAL_USER_INFO)

    if (storedUserInfo) {
      userInfo.value = storedUserInfo
    }
    if (storedOriginalUserInfo) {
      originalUserInfo.value = storedOriginalUserInfo
    }
  }
  initializeFromStorage()
  //判定数据是否改变
  const hasUserInfo = () => {
    return !!userInfo.value
  }
  return {
    userInfo,
    getUserInfoById,
    getFormData,
    submitFormData,
    resetFormData,
    hasUserInfo
  }
})
