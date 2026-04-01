//图书仓库类型
export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  description: string;
  cover_img: string;
  publish_year: string;
  publisher: string;
  original_price: number;
  book_type: string;
  create_at: string;
  book_condition: string;
  edition: string;
  merchant_id: number;
  seller_id: number;
}
