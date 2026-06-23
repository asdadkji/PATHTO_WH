//地址仓库
import { defineStore } from 'pinia'
import {reactive, ref, watch} from "vue";
import type{updateAddress} from '@/types/store/address.ts'
export const useAddressStore = defineStore('address', () => {
  //地址列表 - 按用户ID隔离
  const addressLists = reactive<Record<number, updateAddress[]>>({})
  //当前用户ID
  const currentUserId = ref<number | undefined>(undefined)
  //选中的地址
  const selectedAddressId = ref<number | undefined>(undefined)
  //自定义地址列表id - 按用户ID隔离
  const nextIds = reactive<Record<number, number>>({})
  
  //获取当前用户的地址列表
  const addressList = reactive<updateAddress[]>([])
  
  //监听当前用户ID变化，更新地址列表

  watch(currentUserId, (newUserId) => {
    if (newUserId) {
      // 清空当前地址列表
      addressList.splice(0, addressList.length)
      // 加载新用户的地址列表
      const userAddresses = addressLists[newUserId] || []
      addressList.push(...userAddresses)
      // 初始化nextId
      if (!nextIds[newUserId]) {
        if (userAddresses.length > 0) {
          const maxId = Math.max(...userAddresses.map((address: updateAddress) => address.id || 0))
          nextIds[newUserId] = maxId + 1
        } else {
          nextIds[newUserId] = 1
        }
      }
    } else {
      // 清空当前地址列表
      addressList.splice(0, addressList.length)
    }
  }, { immediate: true })

  //默认地址
  const defaultAddress = () => {
    return addressList.find(address => address.isDefault) || null
  }
  //发货地址
  const shippingAddress = () => {
    return addressList.find(address => address.isShippingAddress) || addressList[0] || null
  }
  //新增地址
  const addAddress = async (data:Omit<updateAddress, 'id'>) => {
    try {
      const userId = data.userId
      currentUserId.value = userId
      
      if (data.isDefault) {
        addressList.forEach(addr => {
          addr.isDefault = false
        })
      }
      if (data.isShippingAddress) {
        addressList.forEach(addr => {
          addr.isShippingAddress = false
        })
      }
      const newAddress:updateAddress = {
        ...data,
        id: nextIds[userId]++
      }
      addressList.push(newAddress)
      // 更新用户地址列表
      addressLists[userId] = [...addressList]
      saveToLocalStorage(userId)

      return newAddress
    } catch (e) {
      console.log('新增地址失败',e)
      throw e;
    }
  }
  //修改地址
  const updateAddress = (addressId:number,updateData:Partial<updateAddress>) => {
    const index = addressList.findIndex(address => address.id === addressId)
    if (index === -1) {
      throw new Error('地址不存在')
    }
    if(updateData.isDefault) {
      addressList.forEach(addr => {
        if(addr.id !== addressId) {
          addr.isDefault = false
        }
      })
    }
    if(updateData.isShippingAddress) {
      addressList.forEach(addr => {
        if(addr.id !== addressId) {
          addr.isShippingAddress = false
        }
      })
    }
    const updatedAddress = {
      ...addressList[index],
      ...updateData
    }
    addressList[index] = updatedAddress;
    
    const userId = updatedAddress?.userId;
    if (userId) {
      // 更新用户地址列表
      addressLists[userId] = [...addressList]
      saveToLocalStorage(Number(userId))
    }

    return updatedAddress
  }
  //删除地址
  const deleteAddress = (addressId:number) => {
    const index = addressList.findIndex(address => address.id === addressId)
    if (index === -1) {
      throw new Error('地址不存在')
    }
    const userId = addressList[index]?.userId;
    if (!userId) {
      console.error('删除地址时未找到 userId')
      return
    }
    addressList.splice(index, 1)

    if (selectedAddressId.value === addressId) {
      selectedAddressId.value = undefined
    }

    // 更新用户地址列表
    addressLists[userId] = [...addressList]
    saveToLocalStorage(Number(userId))
  }
  //获取地址列表
  const getAddressList = (userId:number) => {
    try {
      currentUserId.value = userId
      const saved = localStorage.getItem(`addresses_${userId}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 清空当前地址列表
        addressList.splice(0, addressList.length)
        // 加载用户地址列表
        addressList.push(...parsed)
        // 更新用户地址列表
        addressLists[userId] = [...parsed]
        // 初始化nextId
        if (parsed.length > 0) {
          const maxId = Math.max(...parsed.map((address:updateAddress) => address.id || 0))
          nextIds[userId] = Math.max(maxId + 1, nextIds[userId] || 1)
        } else {
          nextIds[userId] = 1
        }
      } else {
        // 清空当前地址列表
        addressList.splice(0, addressList.length)
        // 初始化用户地址列表
        addressLists[userId] = []
        nextIds[userId] = 1
      }
      return [...addressList]
    } catch (e) {
      console.log('获取地址列表失败',e)
      throw e
    }
  }
  //设置默认地址
  const setDefaultAddress = (addressId:number) => {
    return updateAddress(addressId, {isDefault: true})
  }
  //选择最终地址
  const selectAddress = (addressId:number) => {
    selectedAddressId.value = addressId
  }
  //初始化默认地址
  const initSelectedAddress = () => {
    if (selectedAddressId.value === undefined) {
      const defaultAddr = defaultAddress();
      if (defaultAddr) {
        selectedAddressId.value = defaultAddr.id
      }
    }
  }
  //保存本地
  const saveToLocalStorage = (userId:number) => {
    try {
      const userAddresses = addressLists[userId] || addressList
      const rawList = JSON.parse(JSON.stringify(userAddresses))
      localStorage.setItem(`addresses_${userId}`, JSON.stringify(rawList))
    } catch (e) {
      console.error('保存地址列表失败',e)
    }
  }
  //根据地址ID查询地址信息
  const getAddressById = (addressId: number): updateAddress | null => {
    const address = addressList.find(addr => addr.id === addressId)
    if (!address) {
      console.warn(`未找到ID为 ${addressId} 的地址`)
      return null
    }
    return address
  }
  const getFormattedAddress = (addressId: number): string => {
    const address = getAddressById(addressId)
    if (!address) {
      return '地址不存在'
    }
    const { username, phone, address: detailAddress } = address
    // 格式：姓名 电话 详细地址
    /*return `${username} ${phone} ${detailAddress}`*/
    return JSON.stringify({ username, phone, detailAddress })
  }

  return {
    addressList,
    selectedAddressId,
    addAddress,
    updateAddress,
    deleteAddress,
    getAddressList,
    setDefaultAddress,
    selectAddress,
    initSelectedAddress,
    saveToLocalStorage,
    getFormattedAddress,
    getAddressById,
    shippingAddress,
  }
})
