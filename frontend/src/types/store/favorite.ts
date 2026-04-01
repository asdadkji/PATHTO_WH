//收藏类型
export interface Favorite {
  id: number      // 商品主键
  title: string
  author: string
  price: number                // 单价（单位：元）
  cover_img: string                // 缩略图
  quantity: number             // 购买数量
  book_condition: string
}
