//图书相关api
import service from '@/apis/http.ts'
import type { GroupedBook, BookDetails, BookPage } from '@/types/api/book.ts'
//图书条件筛选+搜索框筛选+分类筛选
export const getFilter = (data: any):Promise<BookPage> => {
  return service.get('/filter/search', { params: data })
}
//首页推荐模块
export const getRecommend = ():Promise<GroupedBook> => {
  return service.get('/filter/category')
}
//图书详情页数据
export const getBookDetail = (id: number):Promise<BookDetails> => {
  return service.get(`/filter/showAll/${id}`)
}
//商家上架图书
export const addBook = (data: any):Promise<any> => {
  return service.post('/filter/add', data)
}
//商家下架图书
export const deleteBook = (merchantId: number, bookId: number):Promise<any> => {
  return service.patch(`/filter/change/${merchantId}/${bookId}`)
}
//商家查看图书
export const getMerchantBook = (merchantId: number,page:number,size:number,filter?:{status?:string,author?:string,title?:string,category_id?:number}):Promise<any> => {
  return service.get(`/filter/merchant/${merchantId}`,{params:{page,size,...filter}})
}
