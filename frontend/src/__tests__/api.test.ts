// API Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟http服务
vi.mock('../apis/http', () => {
  const mockAxios = {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
  return {
    default: mockAxios
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
import service from '../apis/http'

const mockService = service as any

describe('Auth API Service', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call login API with correct parameters', async () => {
      const loginData = { username: 'test', password: '123456' }
      const mockResponse = { token: 'test-token', user: { id: 1, username: 'test' } }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.login(loginData)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/login', loginData)
      expect(result).toEqual(mockResponse)
    })

    it('should handle login error', async () => {
      const loginData = { username: 'test', password: '123456' }
      const error = new Error('Invalid credentials')
      
      mockService.post.mockRejectedValue(error)
      
      await expect(authService.login(loginData)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('register', () => {
    it('should call register API with correct parameters', async () => {
      const registerData = { username: 'test', password: '123456', phone: 13800138000 }
      const mockResponse = { token: 'test-token', user: { id: 1, username: 'test' } }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.register(registerData)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/register', registerData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('beforeResetPwd', () => {
    it('should call beforeResetPwd API with correct parameters', async () => {
      const username = 'test'
      const phone = 13800138000
      const mockResponse = { success: true }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.beforeResetPwd(username, phone)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/beforeResetPwd', { username, phone })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('resetPwd', () => {
    it('should call resetPwd API with correct parameters', async () => {
      const resetData = { username: 'test', newPwd: 'newpassword' }
      const mockResponse = { token: 'test-token', user: { id: 1, username: 'test' } }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.resetPwd(resetData)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/resetPwd', resetData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('applyForMerchant', () => {
    it('should call applyForMerchant API with correct parameters', async () => {
      const userId = 1
      const realUserName = 'Test User'
      const mockResponse = { success: true }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.applyForMerchant(userId, realUserName)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/seller', { userId, realUserName })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('isMerchant2', () => {
    it('should call isMerchant2 API with correct parameters', async () => {
      const userId = 1
      const mockResponse = { isMerchant: true }
      
      mockService.get.mockResolvedValue(mockResponse)
      
      const result = await authService.isMerchant2(userId)
      
      expect(mockService.get).toHaveBeenCalledWith('/auth/isMerchant', { params: { userId } })
      expect(result).toEqual(mockResponse)
    })
  })
})
