import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as authService from '../apis/services/auth'
import service from '../apis/http'

// 模拟axios服务
vi.mock('../apis/http', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn()
    }
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

const mockService = service as any

describe('API Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Auth Service', () => {
    it('should call login API', async () => {
      const loginData = { username: 'test', password: '123456' }
      const mockResponse = { token: 'test-token', user: { id: 1, username: 'test' } }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.login(loginData)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/login', loginData)
      expect(result).toEqual(mockResponse)
    })

    it('should call register API', async () => {
      const registerData = { username: 'test', password: '123456', phone: 13800138000 }
      const mockResponse = { token: 'test-token', user: { id: 1, username: 'test' } }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.register(registerData)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/register', registerData)
      expect(result).toEqual(mockResponse)
    })

    it('should call beforeResetPwd API', async () => {
      const username = 'test'
      const phone = 13800138000
      const mockResponse = { success: true }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.beforeResetPwd(username, phone)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/beforeResetPwd', { username, phone })
      expect(result).toEqual(mockResponse)
    })

    it('should call resetPwd API', async () => {
      const resetData = { username: 'test', newPwd: 'newpassword' }
      const mockResponse = { token: 'test-token', user: { id: 1, username: 'test' } }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.resetPwd(resetData)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/resetPwd', resetData)
      expect(result).toEqual(mockResponse)
    })

    it('should call applyForMerchant API', async () => {
      const userId = 1
      const realUserName = 'Test User'
      const mockResponse = { success: true }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await authService.applyForMerchant(userId, realUserName)
      
      expect(mockService.post).toHaveBeenCalledWith('/auth/seller', { userId, realUserName })
      expect(result).toEqual(mockResponse)
    })

    it('should call isMerchant2 API', async () => {
      const userId = 1
      const mockResponse = { isMerchant: true }
      
      mockService.get.mockResolvedValue(mockResponse)
      
      const result = await authService.isMerchant2(userId)
      
      expect(mockService.get).toHaveBeenCalledWith('/auth/isMerchant', { params: { userId } })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('API Error Handling', () => {
    it('should handle API error', async () => {
      const errorResponse = { message: 'Invalid credentials' }
      mockService.post.mockRejectedValue(errorResponse)
      
      await expect(authService.login({ username: 'test', password: '123' })).rejects.toEqual(errorResponse)
    })

    it('should handle network error', async () => {
      const networkError = new Error('Network error')
      mockService.post.mockRejectedValue(networkError)
      
      await expect(authService.login({ username: 'test', password: '123' })).rejects.toThrow('Network error')
    })
  })
})
