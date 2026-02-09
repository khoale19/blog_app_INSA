export type Role = "ADMIN" | "EDITOR" | "AUTHOR" | "READER"

export interface User {
  id: number
  username: string
  email: string
  role: Role
}

export interface UserProfile {
  id: number
  username: string
  email: string
  role: Role
  articleCount: number
}

export interface AuthResponse {
  token: string
  type: string
  id: number
  username: string
  email: string
  role: Role
}

export interface Article {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt?: string
  publishedAt?: string | null
  viewCount: number
  authorId?: number | null
  category?: string | null
  tags?: string | null
  featured: boolean
  pinned: boolean
}

export interface ArticleRequest {
  title: string
  content?: string
  category?: string
  tags?: string
  publishedAt?: string | null
  featured?: boolean
  pinned?: boolean
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

export interface ArticleListParams {
  page?: number
  size?: number
  sort?: "date" | "popularity" | "title"
  order?: "asc" | "desc"
  keyword?: string
  authorId?: number
  category?: string
  tags?: string
  dateFrom?: string
  dateTo?: string
  publishedOnly?: boolean
  featured?: boolean
  pinned?: boolean
}
