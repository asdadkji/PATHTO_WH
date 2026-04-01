//统一响应类型
export interface HttpResponse<T = any> {
  code: number;
  data: T;
  message?: string;
}
