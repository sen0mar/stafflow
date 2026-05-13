export interface PaginationMeta {
  limit: number
  page: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<TItem> {
  data: TItem[]
  meta: PaginationMeta
}
