//地址仓库
import { defineStore } from 'pinia'
import {reactive, ref} from "vue";
import type{updateAddress} from '@/types/store/address.ts'
export const useAddressStore = defineStore('address', () => {
  //地址列表
  const addressList = reactive<updateAddress[]>([])
  //选中的地址
  const selectedAddressId = ref<number | undefined>(undefined)
  //自定义地址列表id
  let nextId = 1

  //默认地址
  const defaultAddress = () => {
    return addressList.find(address => address.isDefault) || null
  }
  //新增地址
  const addAddress = async (data:Omit<updateAddress, 'id'>) => {
    try {
      if (data.isDefault) {
        addressList.forEach(addr => {
          addr.isDefault = false
        })
      }
      const newAddress:updateAddress = {
        ...data,
        id: nextId++
      }
      addressList.push(newAddress)
      saveToLocalStorage(<number>data.userId)

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
    const updatedAddress = {
      ...addressList[index],
      ...updateData
    }
    addressList[index] = updatedAddress;

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

    saveToLocalStorage(Number(userId))
  }
  //获取地址列表
  const getAddressList = (userId:number) => {
    try {
      const saved = localStorage.getItem(`addresses_${userId}`)
      if (saved) {
        const paresd = JSON.parse(saved)
        addressList.splice(0, addressList.length, ...paresd);
        if (paresd.length > 0) {
          const maxId = Math.max(...paresd.map((address:updateAddress) => address.id || 0))
          nextId = Math.max(maxId + 1, nextId)
        }
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
      const rawList = JSON.parse(JSON.stringify(addressList))
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
    nextId,
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
  }
})
