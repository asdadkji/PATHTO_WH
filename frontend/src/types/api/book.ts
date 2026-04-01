//图书类型
// *Filter基础书籍接口（包含所有可能的字段）
export interface Books {
  id: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  edition: string;
  publish_year: number;
  original_price: string;
  price: string;
  book_condition: 'new' | 'very_good' | 'good' | 'acceptable' | 'poor';
  status: 'available' | 'sold' | 'reserved';
  category_id: number;
  book_type: string;
  subject: string;
  course_name: string | null;
  tags: string[];
  cover_image: string;
  images: string[];
  description: string;
  highlights: string;
  defects: string | null;
  transaction_methods: string[];
  location: string;
  can_deliver: number;
  delivery_fee: string;
  seller_id: number;
  merchant_id: number;
  campus_id: number;
  view_count: number;
  favorite_count: number;
  inquiry_count: number;
  is_featured: number;
  is_urgent: number;
  is_negotiable: number;
  featured_until: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  sold_at: string | null;
}
//分页类型
export interface BookPage {
  books: {
    rows: Books[];
    total: number;
  }
}

// *首页推荐模块返回基础类型
export interface Book_Recommend {
  id: number;
  title: string;
  author: string;
  price: string;
  cover_image: string;
  created_at: string;
  category_id: number;
}
// 分组书籍
export interface GroupedBook {
  [categoryId:string]:Book_Recommend[]
}

// 图书详情页类型
export interface BookDetails {
  booksAll: Books;
}

