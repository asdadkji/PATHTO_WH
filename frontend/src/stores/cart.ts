//购物车仓库
import {defineStore} from "pinia";
import {computed, onMounted, ref, watch} from "vue";
import type{CartItem} from "@/types/store";
import type{Coupon} from "@/types/store/coupon";
import {useRoute} from "vue-router";
import localstorage from "@/utils/localstorage.ts";

// 获取存储key的辅助函数
const getCartKey = (userId: string) => `cart:list:${userId || 'guest'}`
const getJoinedKey = (userId: string) => `cart:joined:${userId || 'guest'}`
const getSelectedCouponsKey = (userId: string) => `cart:selectedCoupons:${userId || 'guest'}`
const getSelectedItemsKey = (userId: string) => `cart:selectedItems:${userId || 'guest'}`

function read<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : def
  } catch {
    return def
  }
}
const write = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value))
}

interface MerchantCoupons {
  [merchantId:string]: Coupon | undefined
}

export const useCartStore = defineStore('cart', ()=>{
  const route = useRoute()

  // 当前登录用户ID（从外部获取，比如从userStore）
  const currentUserId = ref<string>('') // 需要从登录状态获取并设置

  // 购物车列表 - 使用计算属性根据用户ID动态获取对应的key
  const cartList = ref<CartItem[]>([])

  // 已选择的商品
  const selectedItems = ref<CartItem[]>([])

  // 选择的优惠券
  const selectCoupons = ref<MerchantCoupons>({})

  // 商品是否加入购物车
  const joinedIds = ref<Set<string | number>>(new Set())

  // 初始化加载用户数据
  const loadUserData = (userId: string) => {
    if (!userId) return

    // 读取对应用户的购物车数据
    cartList.value = read(getCartKey(userId), [])
    joinedIds.value = new Set(read(getJoinedKey(userId), []))
    selectCoupons.value = read(getSelectedCouponsKey(userId), {})
    selectedItems.value = read(getSelectedItemsKey(userId), [])
  }

  // 保存用户数据
  const saveUserData = (userId: string) => {
    if (!userId) return

    write(getCartKey(userId), cartList.value)
    write(getJoinedKey(userId), [...joinedIds.value])
    write(getSelectedCouponsKey(userId), selectCoupons.value)
    write(getSelectedItemsKey(userId), selectedItems.value)
  }

  // 切换用户的方法
  const switchUser = (userId: string) => {
    // 保存当前用户数据
    if (currentUserId.value) {
      saveUserData(currentUserId.value)
    }

    // 切换用户
    currentUserId.value = userId

    // 加载新用户数据
    loadUserData(userId)
  }

  // 退出登录
  const logout = () => {
    if (currentUserId.value) {
      saveUserData(currentUserId.value)
      currentUserId.value = ''
      cartList.value = []
      joinedIds.value = new Set()
      selectCoupons.value = {}
    }
  }

  // 按商家分组商品
  const itemsGroupByMerchant = computed(()=>{
    const groups:Record<number, CartItem[]> = {}
    selectedItems.value.forEach(item=>{
      if(!groups[item.merchantId]) {
        groups[item.merchantId] = []
      }
      groups[item.merchantId]!.push(item)
    })
    return groups
  })

  // 计算每个商家的总金额
  const merchantTotalPrice = computed(()=>{
    const result:Record<number, number> = {}
    Object.entries(itemsGroupByMerchant.value).forEach(([merchantId,items])=>{
      result[Number(merchantId)] = items.reduce((sum,item)=>sum+item.price*item.quantity,0)
    })
    return result
  })

  // 原总金额
  const totalPrice = computed(()=>{
    return selectedItems.value.reduce((sum,item)=>sum+item.price*item.quantity,0)
  })

  // 优惠金额
  const discountPrice = computed(()=>{
    let totalDiscount = 0
    Object.entries(merchantTotalPrice.value).forEach(([merchantId,totalPrice])=>{
      const coupon = selectCoupons.value[Number(merchantId)]
      if(coupon && totalPrice >= coupon.full_amount) {
        totalDiscount += coupon.discount
      }
    })
    return totalDiscount
  })

  // 最终金额
  const finalPrice = computed(()=>{
    return totalPrice.value - discountPrice.value
  })

  // 自动推荐最佳优惠券
  const recommendBestCoupon = (merchantId:number,availableCoupons:any[])=>{
    console.log('1. 商家ID:', merchantId);
    console.log('2. 可用优惠券列表:', availableCoupons);
    const merchantTotal = merchantTotalPrice.value[merchantId] || 0;
    const usableCoupons = availableCoupons.filter(coupon=> merchantTotal >= coupon.full_amount && coupon.isReceived)
    if(usableCoupons.length === 0) {
      delete selectCoupons.value[merchantId]
      return
    }
    usableCoupons.sort((a,b)=>{
      if(b.discount !== a.discount) {
        return b.discount - a.discount
      }
      return a.full_amount - b.full_amount
    })
    selectCoupons.value[merchantId] = usableCoupons[0]
  }

  // 添加购物车
  const addToGoods = (goods: Omit<CartItem, 'quantity'> & {quantity?:number})=>{
    const {id,quantity=1} = goods
    const exist = cartList.value.find(i=>i.id === id)
    if(exist){
      exist.quantity += quantity
    } else {
      cartList.value.push({...goods,quantity})
    }
    joinedIds.value.add(id)
  }

  // 改变数量
  const changeQuantity = (id: CartItem['id'], quantity: number)=>{
    const item = cartList.value.find(i=>i.id === id)
    if(item) item.quantity = Math.max(1,quantity)
  }

  // 删除商品
  const deleteGoods = (id: CartItem['id'])=>{
    const idx = cartList.value.findIndex(i=>i.id === id)
    if (idx > -1) cartList.value.splice(idx,1)
    joinedIds.value.delete(id)
  }

  // 判定商品是否加入购物车
  const isJoined = (id: CartItem['id'])=>{
    return joinedIds.value.has(id)
  }

  // 自动持久化 - 只在有用户ID时保存
  watch([cartList, currentUserId], () => {
    if (currentUserId.value) {
      write(getCartKey(currentUserId.value), cartList.value)
    }
  }, { deep: true })

  watch([joinedIds, currentUserId], () => {
    if (currentUserId.value) {
      write(getJoinedKey(currentUserId.value), [...joinedIds.value])
    }
  }, { deep: true })

  watch([selectCoupons, currentUserId], () => {
    if (currentUserId.value) {
      write(getSelectedCouponsKey(currentUserId.value), selectCoupons.value)
    }
  }, { deep: true })

  // 选中的商品持久化（与用户相关）
  watch([selectedItems, currentUserId], () => {
    if (currentUserId.value) {
      write(getSelectedItemsKey(currentUserId.value), selectedItems.value)
    }
  }, {deep: true})

  // 初始化
  onMounted(()=>{
    // 尝试从localStorage获取上次登录的用户ID（需要从别处获取）
    // const lastUserId = localstorage.get('last_login_user') || ''
    // if (lastUserId) {
    //   switchUser(lastUserId)
    // }

    // 如果在Orders页面且用户已登录，确保选中商品被正确加载
    if(route.path.includes('orders') && currentUserId.value) {
      selectedItems.value = read(getSelectedItemsKey(currentUserId.value), [])
    }
  })

  // 适配直接购买
  const setBuyNowItem = (item:CartItem) =>{
    selectedItems.value = [item]
    // 保存到用户对应的key
    if (currentUserId.value) {
      write(getSelectedItemsKey(currentUserId.value), selectedItems.value)
    }
  }

  return {
    cartList,
    addToGoods,
    changeQuantity,
    deleteGoods,
    isJoined,
    totalPrice,
    discountPrice,
    finalPrice,
    selectedItems,
    itemsGroupByMerchant,
    merchantTotalPrice,
    selectCoupons,
    recommendBestCoupon,
    setBuyNowItem,
    // 新增的方法
    switchUser,
    logout,
    currentUserId
  }
})
