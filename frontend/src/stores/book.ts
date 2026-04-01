//图书仓库
import { defineStore } from 'pinia'
import {ref} from 'vue'
import { getFilter, getBookDetail, getRecommend,addBook,deleteBook,getMerchantBook } from '@/apis/services/book.ts'
import type{Book} from '@/types/store/book.ts'
import type { Books } from '@/types/api'
//ts
export const useBookStore = defineStore('book', () => {
  //首页推荐模块
  let homeBookRecommend = ref<any>({})
  const getRecommendBook = async () => {
    const res = await getRecommend()
    homeBookRecommend.value = res.grouped || []
  }
  //图书详情页数据
  let bookData = ref<any>(null)
  const getBookDetailById = async (id: number) => {
    const res = await getBookDetail(id)
    bookData.value = res.booksAll
  }
  //筛选页
  let bookFilter = ref<Books[]>([])
  let totalF = ref(0)
  const getFilterData = async (data: any) => {
    try {
      const res = await getFilter(data)
      bookFilter.value = res.books.rows
      totalF.value = res.books.total
    } catch (e:any) {
      console.log(e)
    }
  }
  //商家上架图书
  const listBook = async (data: any) => {
    try {
      const res = await addBook(data)
      return res
    } catch (e:any) {
      console.log(e)
    }
  }
  //商家下架图书
  const deleteBookById = async (merchantId:number,bookId: number) => {
    try {
      const res = await deleteBook(merchantId, bookId)
      return res
    } catch (e:any) {
      console.log(e)
    }
  }
  //商家图书信息
  const merchantBook = ref([])
  const total = ref()
  const getMerchantBookList = async (merchantId:number,page=1,size=20,filter?:{status?:string,author?:string,title?:string,category_id?:number}) => {
    try {
      const res = await getMerchantBook(merchantId, page, size, filter)
      merchantBook.value = res.rows
      total.value = res.total
    } catch (e:any) {
      console.log(e)
    }
  }

  return {
    homeBookRecommend,
    getRecommendBook,
    bookData,
    getBookDetailById,
    bookFilter,
    getFilterData,
    listBook,
    deleteBookById,
    merchantBook,
    getMerchantBookList,
    total,
    totalF
  }
})
