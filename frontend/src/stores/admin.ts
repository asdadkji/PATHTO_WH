//后台仓库
import { defineStore } from 'pinia'
import {ref, computed, watch} from 'vue'
import {getUserCountApi,getUserSexApi,getChartDataApi,getAdminListApi,setAdminApi,cancelAdminApi,getShopListApi,freezeShopApi,unfreezeShopApi,getOrdersToDeliverApi} from '@/apis/services/admin.ts'
import {useIntervalFn, useStorage, useTransition} from "@vueuse/core";
import {ElMessage} from "element-plus";
import {OrderStatus, PaymentMethod} from "@/stores/orders.ts";
import {useAuthStore} from "@/stores/auth.ts";
const authStore = useAuthStore()
//ts
interface adminList {
  id:number
  username:string
  phone:string
  bio:string
  role:string
}
interface sellerBase {
  id:number
  user_id:number
  shop_name:string
  status:string
}
interface chartBase {
  title:string
  data:number[]
  categories:string[]
  total:number
  max:number
  today:number
}
interface chart {
  dailyDealCount: chartBase,
  dailyGMV:chartBase,
  dailyActive:chartBase
}
export interface Order {
  id: number
  order_number: string
  book_id: number
  book_snapshot: Record<string, any>
  buyer_id: number
  seller_id: number
  unit_price: number
  quantity: number
  total_price: number
  delivery_fee: number
  final_price: number
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: string
  payment_id?: string
  paid_at?: string
  transaction_method: string
  meeting_location?: string
  meeting_time?: string
  shipping_address?: Record<string, any>
  tracking_company?: string
  tracking_number?: string
  shipped_at?: string
  delivered_at?: string
  buyer_note?: string
  seller_note?: string
  cancel_reason?: string
  cancel_type?: string
  created_at: string
  updated_at: string
  completed_at?: string
  cancelled_at?: string
}

export const useAdminStore = defineStore('admin', () => {
  //用户总数数据(配合动态展示)
  const userCount = useStorage('count',0)
  const outputValue = useTransition(userCount,{
    duration: 1000,
  })
  //男女性别数据
  const male = useStorage('male',0);
  const female = useStorage('female',0);
  //图表数据
  const chartData = useStorage<Partial<chart>>('chartData',{})
  //管理员列表
  const adminList = ref<adminList[]>([])
  //商家列表
  const shopList = ref<sellerBase[]>([])
  //已送达订单
  const deliveryOrders = useStorage<Order[]>('deliveryOrders',[])

  //获取用户总数
  const fetchUsers = async () => {
    try {
      const userData = await getUserCountApi(authStore.userId!)
      if(userData !== undefined && userData !== null) {
        userCount.value = userData
        console.log('前端接收用户总数成功',userData)
      }

    }catch (e) {
      console.log('前端接收用户总数失败',e)
    }
  }
  //获取用户性别数据
  const fetchUserSex = async () => {
    try {
      const sexData = await getUserSexApi(authStore.userId!)
      if(sexData !== undefined && sexData !== null) {
        male.value = sexData[0]?.count ?? 0
        female.value = sexData[1]?.count ?? 0
      }
    }catch (e) {
      console.log('前端接收用户性别数据失败',e)
    }
  }
  //获取图表数据
  const fetchChartData = async () => {
    try {
      chartData.value = await getChartDataApi(authStore.userId!)
    }catch (e) {
      console.log('前端接收图表数据失败',e)
    }
  }
  //获取管理员列表
  const fetchAdminList = async () => {
    try {
      const adminData = await getAdminListApi(authStore.userId!)
      if(adminData) {
        adminList.value = adminData
      }
    }catch (e) {
      console.log('前端接收管理员列表失败',e)
    }
  }
  //添加管理员
  const addAdmin = async (adminId:number,data:{username:string,phone:string}) => {
    try {
      const res = await setAdminApi(data,adminId)
      if(res) {
        console.log('添加管理员成功')
        await fetchAdminList()
      }else {
        console.log('添加管理员失败')
      }
    }catch (e) {
      console.log('前端添加管理员失败',e)
    }
  }
  //取消管理权限
  const cancelAdmin = async (id:number,userId:number) => {
    try {
      const res = await cancelAdminApi(id,userId)
      if(res) {
        ElMessage.success('取消管理权限成功')
        await fetchAdminList()
      }
    }catch (e:any) {
      console.log('前端取消管理权限失败',e)
    }
  }
  //获得商家列表
  const fetchSellers = async (page:number,pageSize:number) => {
    try {
      const res = await getShopListApi(authStore.userId!,page,pageSize)
      if(res) {
        shopList.value = res.data
      }
    }catch (e) {
      console.log('前端获取商家列表失败',e)
    }
  }
  //冻结商家权限
  const freezeSeller = async (id:number,reason:string) => {
    try {
      const res = await freezeShopApi(reason,id)
      if(res) {
        ElMessage.success('冻结商家权限成功')
        await fetchSellers(1,10)
      }else {
        console.log('冻结商家权限失败')
      }
    }catch (e) {
      console.log('前端冻结商家权限失败',e)
    }
  }
  //解冻商家权限
  const unfreezeSeller = async (id:number) => {
    try {
      const res = await unfreezeShopApi(id)
      if(res) {
        ElMessage.success('解冻商家权限成功')
        await fetchSellers(1,8)
      }
    }catch (e) {
      console.log('前端解冻商家权限失败',e)
    }
  }
  //获取已送达的订单
  const fetchOrdersToDeliver = async () => {
    try {
      const res = await getOrdersToDeliverApi()
      if(res) {
        deliveryOrders.value = res
      }else {
        console.log('获取已送达订单失败')
      }
    }catch (e) {
      console.log('前端获取已送达订单失败',e)
    }
  }

  //定时更新
  const { pause, resume } = useIntervalFn(
    fetchUsers,           // 要执行的函数
    5 * 60 * 1000,       // 5分钟
    {
      immediate: true,    // 立即执行一次
      immediateCallback: true // 立即执行回调
    }
  )
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      pause()  // 用户切到其他标签页，暂停更新
    } else {
      resume() // 用户切回来，继续更新
      await fetchUsers() // 立即更新一次
    }
  })

  return {
    userCount,
    outputValue,
    male,
    female,
    chartData,
    fetchUsers,
    fetchUserSex,
    fetchChartData,
    fetchSellers,
    freezeSeller,
    unfreezeSeller,
    cancelAdmin,
    shopList,
    addAdmin,
    adminList,
    fetchAdminList,
    fetchOrdersToDeliver,
    deliveryOrders
  }
})
