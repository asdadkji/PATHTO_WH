// Book API Service Tests
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
import * as bookService from '../apis/services/book'
import service from '../apis/http'

const mockService = service as any

describe('Book API Service', () => {
  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks()
  })

  describe('getFilter', () => {
    it('should call getFilter API with correct parameters', async () => {
      const data = { page: 1, size: 10, category: 'fiction' }
      const mockResponse = {
        data: [
          { id: 1, title: 'Book 1', author: 'Author 1' },
          { id: 2, title: 'Book 2', author: 'Author 2' }
        ],
        total: 2
      }
      
      mockService.get.mockResolvedValue(mockResponse)
      
      const result = await bookService.getFilter(data)
      
      expect(mockService.get).toHaveBeenCalledWith('/filter/search', { params: data })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getBookDetail', () => {
    it('should call getBookDetail API with correct parameters', async () => {
      const bookId = 1
      const mockResponse = { id: 1, title: 'Book 1', author: 'Author 1' }
      
      mockService.get.mockResolvedValue(mockResponse)
      
      const result = await bookService.getBookDetail(bookId)
      
      expect(mockService.get).toHaveBeenCalledWith(`/filter/showAll/${bookId}`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getRecommend', () => {
    it('should call getRecommend API', async () => {
      const mockResponse = {
        categories: [
          { id: 1, name: 'Fiction', books: [] },
          { id: 2, name: 'Non-fiction', books: [] }
        ]
      }
      
      mockService.get.mockResolvedValue(mockResponse)
      
      const result = await bookService.getRecommend()
      
      expect(mockService.get).toHaveBeenCalledWith('/filter/category')
      expect(result).toEqual(mockResponse)
    })
  })

  describe('addBook', () => {
    it('should call addBook API with correct parameters', async () => {
      const bookData = {
        title: 'New Book',
        author: 'New Author',
        price: 29.99,
        category_id: 1
      }
      const mockResponse = { id: 3, ...bookData }
      
      mockService.post.mockResolvedValue(mockResponse)
      
      const result = await bookService.addBook(bookData)
      
      expect(mockService.post).toHaveBeenCalledWith('/filter/add', bookData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteBook', () => {
    it('should call deleteBook API with correct parameters', async () => {
      const merchantId = 1
      const bookId = 1
      const mockResponse = { success: true }
      
      mockService.patch.mockResolvedValue(mockResponse)
      
      const result = await bookService.deleteBook(merchantId, bookId)
      
      expect(mockService.patch).toHaveBeenCalledWith(`/filter/change/${merchantId}/${bookId}`)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getMerchantBook', () => {
    it('should call getMerchantBook API with correct parameters', async () => {
      const merchantId = 1
      const page = 1
      const size = 10
      const filter = { status: 'available' }
      const mockResponse = {
        data: [
          { id: 1, title: 'Book 1', author: 'Author 1' },
          { id: 2, title: 'Book 2', author: 'Author 2' }
        ],
        total: 2
      }
      
      mockService.get.mockResolvedValue(mockResponse)
      
      const result = await bookService.getMerchantBook(merchantId, page, size, filter)
      
      expect(mockService.get).toHaveBeenCalledWith(`/filter/merchant/${merchantId}`, { params: { page, size, ...filter } })
      expect(result).toEqual(mockResponse)
    })
  })
})
