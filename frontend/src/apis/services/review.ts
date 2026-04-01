//评论请求
import service from '@/apis/http.ts'
export const getReview = (reviewedId:number):Promise<any> => {
  return service.get(`/review/getReviews/${reviewedId}`)
}
export const addReview = (data:any):Promise<any> => {
  return service.post('/review/createReview', data)
}
