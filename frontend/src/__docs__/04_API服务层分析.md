# 04 - API 服务层分析

## 一、API 层架构

```
apis/
├── http.ts        # Axios 封装（拦截器配置）
├── index.ts       # 统一导出
└── services/      # 业务 API 模块
    ├── auth.ts       # 认证相关
    ├── book.ts       # 图书相关
    ├── order.ts      # 订单相关
    ├── user.ts       # 用户相关
    ├── admin.ts      # 管理相关
    ├── coupon.ts     # 优惠券相关
    ├── review.ts     # 评论相关
    ├── upload.ts     # 上传相关
    └── stats.ts      # 统计相关
```

---

## 二、HTTP 封装 (apis/http.ts)

### 2.1 Axios 实例配置
```typescript
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // API 基础路径
  timeout: 5000,                               // 5秒超时
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})
```

### 2.2 请求拦截器
```typescript
service.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    const url = config.url ?? ''

    // 检查白名单
    const isWhiteList = whiteListPatterns.some(pattern => pattern.test(url))

    // 非白名单添加 Token
    if (!isWhiteList) {
      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
      }
    }

    return config
  },
  error => Promise.reject(error)
)
```

#### 白名单路由
```typescript
const whiteListPatterns = [
  /^\/home$/,                           // 首页
  /^\/auth\/login$/,                     // 登录
  /^\/auth\/register$/,                  // 注册
  /^\/auth\/forget$/,                    // 忘记密码
  /^\/product\/\d+$/,                   // 商品详情
  /^\/filter$//                          // 筛选页
]
```

### 2.3 响应拦截器
```typescript
service.interceptors.response.use(
  (response) => {
    const { code, data } = response.data
    if (code === 0) {
      return data  // 成功返回 data 部分
    } else {
      return Promise.reject(response.data)  // 失败抛出
    }
  },
  (error) => Promise.reject(error)
)
```

#### 响应数据结构约定
```typescript
{
  "code": 0,      // 0 表示成功
  "data": {...}   // 成功时返回数据
}
```

---

## 三、认证服务 (services/auth.ts)

### 3.1 API 列表
| 方法 | 路径 | 说明 |
|-----|------|------|
| `login` | POST /auth/login | 用户登录 |
| `register` | POST /auth/register | 用户注册 |
| `beforeResetPwd` | POST /auth/beforeResetPwd | 重置密码前置验证 |
| `resetPwd` | POST /auth/resetPwd | 重置密码 |
| `applyForMerchant` | POST /auth/seller | 申请商家认证 |
| `isMerchant2` | GET /auth/isMerchant | 验证商家身份 |
| `getMerchantId` | GET /auth/merchantId | 获取商家ID |

### 3.2 代码示例
```typescript
export const login = (data: LoginParams): Promise<AuthToken> => {
  return service.post('/auth/login', data)
}

export const isMerchant2 = (userId: number) => {
  return service.get('/auth/isMerchant', { params: { userId } })
}
```

---

## 四、图书服务 (services/book.ts)

### 4.1 API 列表
| 方法 | 路径 | 说明 |
|-----|------|------|
| `getFilter` | GET /filter/search | 图书筛选搜索 |
| `getRecommend` | GET /filter/category | 首页分类推荐 |
| `getBookDetail` | GET /filter/showAll/{id} | 图书详情 |
| `addBook` | POST /filter/add | 商家上架图书 |
| `deleteBook` | PATCH /filter/change/{merchantId}/{bookId} | 商家下架图书 |
| `getMerchantBook` | GET /filter/merchant/{merchantId} | 商家图书列表 |

### 4.2 图书筛选参数
```typescript
interface FilterParams {
  page?: number;
  pageSize?: number;
  keyword?: string;          // 搜索关键词
  category_id?: number;     // 分类ID
  author?: string;          // 作者
  title?: string;          // 书名
  minPrice?: number;        // 最低价
  maxPrice?: number;        // 最高价
  book_condition?: string;  // 品相
  transaction_methods?: string[];  // 交易方式
  sortBy?: string;         // 排序字段
  sortOrder?: 'asc' | 'desc';  // 排序方向
}
```

---

## 五、订单服务 (services/order.ts)

### 5.1 API 列表
| 方法 | 路径 | 说明 |
|-----|------|------|
| `createUserOrder` | POST /order/create/{userId} | 创建订单 |
| `getUserOrders` | GET /order/list/{userId} | 获取用户订单列表 |
| `updateUserOrderStatus` | PUT /order/{userId}/{orderId}/status | 更新订单状态 |
| `cancelOrder` | POST /order/{userId}/{orderId}/cancel | 取消订单 |
| `processPayment` | POST /order/{userId}/{orderId}/pay | 支付订单 |
| `shipSellerOrder` | POST /order/{sellerId}/{orderId}/ship | 卖家发货 |
| `receiveOrder` | POST /order/{userId}/{orderId}/complete | 买家收货 |
| `getOrdersToDeliver` | GET /order/shipList | 配送订单列表 |
| `markAsDelivered` | POST /order/{adminId}/{orderId}/delivered | 标记已送达 |

### 5.2 订单状态更新
```typescript
export const updateUserOrderStatus = (
  userId: number,
  orderId: number,
  userRole: string,
  status: string,
  reason?: string,
  data?: string
): Promise<any> => {
  return service.put(
    `/order/${userId}/${orderId}/status`,
    { status, reason, data },
    { params: { userRole } }
  )
}
```

### 5.3 配送订单查询
```typescript
export const getOrdersToDeliver = (
  userRole: string,
  orderData: {
    page: number;
    pageSize: number;
    tracking_company?: string;
    start_date?: Date;
    end_date?: Date;
    buyer_name?: string;
    buyer_phone?: number;
  }
): Promise<any> => {
  return service.get('/order/shipList', { params: { userRole, ...orderData } })
}
```

---

## 六、用户服务 (services/user.ts)

### 6.1 API 列表
| 方法 | 路径 | 说明 |
|-----|------|------|
| `getUserInfo` | GET /user/profile/{userId} | 获取用户信息 |
| `changeUserInfo` | PUT /user/profile/{userId}/change | 修改用户信息 |

---

## 七、管理服务 (services/admin.ts)

### 7.1 用户管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| `getUserCountApi` | GET /admin/userCount | 获取用户总数 |
| `getUserSexApi` | GET /admin/userGender | 获取性别占比 |
| `getAdminListApi` | GET /admin/adminList | 获取管理员列表 |
| `setAdminApi` | PATCH /admin/setAdmin | 赋予管理员权限 |
| `cancelAdminApi` | PATCH /admin/cancelAdmin | 取消管理员权限 |

### 7.2 商家管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| `getShopListApi` | GET /admin/sellerList | 获取商家列表 |
| `freezeShopApi` | PATCH /admin/freezeSeller | 冻结商家 |
| `unfreezeShopApi` | PATCH /admin/unfreezeSeller | 解冻商家 |

### 7.3 买家管理
| 方法 | 路径 | 说明 |
|-----|------|------|
| `getBuyerListApi` | GET /admin/buyerList | 获取买家列表 |
| `getBuyerDetailApi` | GET /admin/buyerDetail | 获取买家详情 |
| `deleteBuyerApi` | PATCH /admin/deleteBuyer | 注销买家账号 |
| `banBuyerApi` | PATCH /admin/banBuyer | 封禁买家 |
| `unbanBuyerApi` | PATCH /admin/unbanBuyer | 解封买家 |

### 7.4 订单与配送
| 方法 | 路径 | 说明 |
|-----|------|------|
| `getOrdersToDeliverApi` | GET /admin/deliveredBooks | 获取已送达订单 |
| `markAsDelivered` | POST /order/{adminId}/{orderId}/delivered | 标记已送达 |

---

## 八、其他服务文件

### 8.1 优惠券服务 (services/coupon.ts)
- `getCouponInfo` - 获取用户优惠券
- `getMerchantCoupon` - 获取商家优惠券
- `updateCoupon` - 更新优惠券状态
- `createCoupon` - 创建优惠券
- `disableCoupon` / `enableCoupon` - 停用/启用优惠券

### 8.2 评论服务 (services/review.ts)
- `getReview` - 获取评论列表
- `addReview` - 添加评论

### 8.3 上传服务 (services/upload.ts)
- 文件上传相关 API

### 8.4 统计服务 (services/stats.ts)
- 数据统计相关 API

---

## 九、API 调用模式

### 9.1 标准调用流程
```typescript
// 在 Store 中调用
const fetchData = async () => {
  try {
    const res = await someApiMethod(params)
    // 处理响应数据
    return res
  } catch (error) {
    // 处理错误
    throw error
  }
}
```

### 9.2 在组件中使用
```typescript
// 方式1：直接调用
const res = await login({ username, password })

// 方式2：通过 Store 调用
const bookStore = useBookStore()
await bookStore.getRecommendBook()
```

---

## 十、API 层与 Store 交互

```
Component (视图)
    ↓ 调用
Store (状态管理)
    ↓ 调用
API Service (HTTP 请求)
    ↓ 发送
Backend (Node.js/Express)
```

### 10.1 典型模式
```typescript
// Store 中封装业务逻辑
export const useBookStore = defineStore('book', () => {
  const bookFilter = ref([])

  const getFilterData = async (data: any) => {
    try {
      const res = await getFilter(data)  // 调用 API
      bookFilter.value = res.books.rows  // 更新状态
      return res
    } catch (e) {
      console.log(e)
    }
  }

  return { bookFilter, getFilterData }
})
```

---

## 十一、错误处理规范

### 11.1 API 层错误
```typescript
// http.ts 响应拦截器
(error) => {
  return Promise.reject(error)  // 统一抛出
}
```

### 11.2 Store 层错误
```typescript
// 捕获并处理错误
try {
  const res = await someApi()
  // 成功处理
} catch (e) {
  console.error('操作失败:', e)
  throw e  // 继续抛出或处理
}
```

### 11.3 组件层错误
```typescript
// 使用 try-catch 或 .catch
try {
  await orderStore.createOrder(params)
  ElMessage.success('创建成功')
} catch {
  ElMessage.error('创建失败')
}
```
