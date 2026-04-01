// 集成测试 - 测试前端与后端的实际交互
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 模拟http服务
vi.mock('../apis/http', () => {
  const mockService = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
  return {
    default: mockService
  }
})

// 模拟Pinia store
vi.mock('@/stores/auth', () => {
  return {
    useAuthStore: vi.fn(() => ({
      token: 'test-token',
      isLogin: true,
      getRedirectPath: vi.fn(() => '/home')
    }))
  }
})

// 导入服务
import * as authService from '../apis/services/auth'
import * as bookService from '../apis/services/book'
import service from '../apis/http'

const mockService = service as any

describe('集成测试 - 前端与后端交互', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('认证流程集成测试', () => {
    it('应该完整模拟用户注册和登录流程', async () => {
      // 模拟注册响应
      const registerResponse = {
        token: 'test-token-123',
        user: {
          id: 1,
          username: 'testuser',
          phone: 13800138000
        }
      }
      
      // 模拟登录响应
      const loginResponse = {
        token: 'test-token-456',
        user: {
          id: 1,
          username: 'testuser',
          phone: 13800138000
        }
      }
      
      // 设置模拟响应
      mockService.post.mockImplementation((url: string, data: any) => {
        if (url === '/auth/register') {
          return Promise.resolve(registerResponse)
        } else if (url === '/auth/login') {
          return Promise.resolve(loginResponse)
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
      
      // 测试注册流程
      const registerData = {
        username: 'testuser',
        password: '123456',
        phone: 13800138000
      }
      const registerResult = await authService.register(registerData)
      expect(registerResult).toEqual(registerResponse)
      expect(mockService.post).toHaveBeenCalledWith('/auth/register', registerData)
      
      // 测试登录流程
      const loginData = {
        username: 'testuser',
        password: '123456'
      }
      const loginResult = await authService.login(loginData)
      expect(loginResult).toEqual(loginResponse)
      expect(mockService.post).toHaveBeenCalledWith('/auth/login', loginData)
    })

    it('应该测试商家申请流程', async () => {
      // 模拟商家申请响应
      const applyResponse = {
        success: true,
        message: '商家申请提交成功'
      }
      
      // 模拟商家验证响应
      const isMerchantResponse = {
        isMerchant: true
      }
      
      // 设置模拟响应
      mockService.post.mockResolvedValue(applyResponse)
      mockService.get.mockResolvedValue(isMerchantResponse)
      
      // 测试商家申请
      const userId = 1
      const realUserName = 'Test User'
      const applyResult = await authService.applyForMerchant(userId, realUserName)
      expect(applyResult).toEqual(applyResponse)
      expect(mockService.post).toHaveBeenCalledWith('/auth/seller', { userId, realUserName })
      
      // 测试商家验证
      const isMerchantResult = await authService.isMerchant2(userId)
      expect(isMerchantResult).toEqual(isMerchantResponse)
      expect(mockService.get).toHaveBeenCalledWith('/auth/isMerchant', { params: { userId } })
    })
  })

  describe('图书流程集成测试', () => {
    it('应该测试图书搜索和详情流程', async () => {
      // 模拟搜索响应
      const searchResponse = {
        data: [
          {
            id: 1,
            title: 'Book 1',
            author: 'Author 1',
            price: 29.99,
            cover_image: 'book1.jpg'
          },
          {
            id: 2,
            title: 'Book 2',
            author: 'Author 2',
            price: 19.99,
            cover_image: 'book2.jpg'
          }
        ],
        total: 2
      }
      
      // 模拟图书详情响应
      const detailResponse = {
        id: 1,
        title: 'Book 1',
        author: 'Author 1',
        price: 29.99,
        cover_image: 'book1.jpg',
        description: 'A great book',
        merchantName: 'Test Merchant',
        merchantId: 1
      }
      
      // 模拟分类响应
      const categoryResponse = {
        categories: [
          {
            id: 1,
            name: 'Fiction',
            books: [
              { id: 1, title: 'Book 1', author: 'Author 1' }
            ]
          },
          {
            id: 2,
            name: 'Non-fiction',
            books: [
              { id: 2, title: 'Book 2', author: 'Author 2' }
            ]
          }
        ]
      }
      
      // 设置模拟响应
      mockService.get.mockImplementation((url: string, config?: any) => {
        if (url === '/filter/search') {
          return Promise.resolve(searchResponse)
        } else if (url === '/filter/showAll/1') {
          return Promise.resolve(detailResponse)
        } else if (url === '/filter/category') {
          return Promise.resolve(categoryResponse)
        }
        return Promise.reject(new Error('Unknown endpoint'))
      })
      
      // 测试图书搜索
      const searchParams = { page: 1, size: 10, keyword: 'book' }
      const searchResult = await bookService.getFilter(searchParams)
      expect(searchResult).toEqual(searchResponse)
      expect(mockService.get).toHaveBeenCalledWith('/filter/search', { params: searchParams })
      
      // 测试图书详情
      const detailResult = await bookService.getBookDetail(1)
      expect(detailResult).toEqual(detailResponse)
      expect(mockService.get).toHaveBeenCalledWith('/filter/showAll/1')
      
      // 测试图书分类推荐
      const categoryResult = await bookService.getRecommend()
      expect(categoryResult).toEqual(categoryResponse)
      expect(mockService.get).toHaveBeenCalledWith('/filter/category')
    })

    it('应该测试商家图书管理流程', async () => {
      // 模拟添加图书响应
      const addBookResponse = {
        id: 3,
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        category_id: 1
      }
      
      // 模拟删除图书响应
      const deleteBookResponse = {
        success: true,
        message: '图书下架成功'
      }
      
      // 模拟商家图书列表响应
      const merchantBooksResponse = {
        data: [
          {
            id: 1,
            title: 'Book 1',
            author: 'Author 1',
            price: 29.99,
            status: 'available'
          }
        ],
        total: 1,
        page: 1,
        size: 10
      }
      
      // 设置模拟响应
      mockService.post.mockResolvedValue(addBookResponse)
      mockService.patch.mockResolvedValue(deleteBookResponse)
      mockService.get.mockResolvedValue(merchantBooksResponse)
      
      // 测试添加图书
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        category_id: 1,
        cover_image: 'newbook.jpg'
      }
      const addResult = await bookService.addBook(bookData)
      expect(addResult).toEqual(addBookResponse)
      expect(mockService.post).toHaveBeenCalledWith('/filter/add', bookData)
      
      // 测试删除图书
      const deleteResult = await bookService.deleteBook(1, 3)
      expect(deleteResult).toEqual(deleteBookResponse)
      expect(mockService.patch).toHaveBeenCalledWith('/filter/change/1/3')
      
      // 测试获取商家图书列表
      const merchantBooksResult = await bookService.getMerchantBook(1, 1, 10)
      expect(merchantBooksResult).toEqual(merchantBooksResponse)
      expect(mockService.get).toHaveBeenCalledWith('/filter/merchant/1', { params: { page: 1, size: 10 } })
    })
  })

  describe('错误处理集成测试', () => {
    it('应该处理API错误响应', async () => {
      // 模拟错误响应
      const errorResponse = {
        message: 'Invalid credentials',
        code: 401
      }
      
      // 设置模拟响应
      mockService.post.mockRejectedValue(errorResponse)
      
      // 测试错误处理
      const loginData = {
        username: 'testuser',
        password: 'wrongpassword'
      }
      
      await expect(authService.login(loginData)).rejects.toEqual(errorResponse)
      expect(mockService.post).toHaveBeenCalledWith('/auth/login', loginData)
    })

    it('应该处理网络错误', async () => {
      // 模拟网络错误
      const networkError = new Error('Network error')
      
      // 设置模拟响应
      mockService.get.mockRejectedValue(networkError)
      
      // 测试网络错误处理
      await expect(bookService.getBookDetail(1)).rejects.toThrow('Network error')
      expect(mockService.get).toHaveBeenCalledWith('/filter/showAll/1')
    })
  })
})
