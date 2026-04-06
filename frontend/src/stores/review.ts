//评论仓库
import { defineStore } from 'pinia';
import { getReview, addReview } from '@/apis/services/review';
import {computed, ref} from "vue";
import localstorage from "@/utils/localstorage.ts";
//ts
interface Review {
  id: number;
  order_id: number;
  reviewer_id: number;
  reviewed_user_id: number;
  role: 'buyer' | 'seller';
  rating: number;
  comment?: string;
  tags: string[];
  reply_content?: string;
  replied_at?: Date;
  is_anonymous: boolean;
  is_visible: boolean;
  created_at: Date;
  updated_at: Date;
  book_snapshot: {
    price:number
    title: string;
    publisher: string;
    cover_image:string
  }
}
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const useReviewStore = defineStore('review', () => {
  const reviews = ref<Review[]>(localstorage.get('reviews') || []);
  const pagination = ref<Pagination>()
  //平均评分
  const averageRating = computed(() => {
    if (reviews.value.length === 0) return 0
    const total = reviews.value.reduce((sum, review) => sum + review.rating, 0)
    return parseFloat((total / reviews.value.length).toFixed(1)) || 4
  })
  // 固定的6个标签选项
  const ALL_TAGS = [
    { name: '物流很快', value: 'delivery_fast' },
    { name: '包装完好', value: 'good_condition' },
    { name: '服务态度好', value: 'good_service' },
    { name: '书籍完好', value: 'good_complete' },
    { name: '书籍内容完整', value: 'good_book' },
    { name: '线下沟通及时', value: 'good_communication' }
  ] as const

  // 1. 统计每个标签的总使用次数
  const tagCounts = computed(() => {
    // 初始化统计对象
    const counts: Record<string, number> = {}

    // 初始化所有标签计数为0
    ALL_TAGS.forEach(tag => {
      counts[tag.value] = 0
    })

    // 遍历所有评价，累加标签使用次数
    reviews.value.forEach(review => {
      if (review.tags && Array.isArray(review.tags)) {
        review.tags.forEach(tagValue => {
          // 只统计我们定义的6个标签
          if (counts.hasOwnProperty(tagValue)) {
            counts[tagValue] = (counts[tagValue] || 0) + 1
          }
        })
      }
    })

    return counts
  })

  const getReviews = async (reviewedId:number) => {
    const res = await getReview(reviewedId)
    if(res) {
      reviews.value = res.data
      pagination.value = res.pagination
    }
  }
  const addUserReview = async (data:any) => {
    try {
      const res = await addReview(data)
      console.log('API响应:', res)
      if(res) {
        reviews.value.push(res)
        localstorage.set('review', reviews.value)
        return res
      }
    } catch (error: any) {
      console.error('评论提交错误:', error)
      throw error
    }
  }
  return {
    reviews,
    pagination,
    getReviews,
    addUserReview,
    averageRating,
    ALL_TAGS,
    tagCounts,
  }
})
