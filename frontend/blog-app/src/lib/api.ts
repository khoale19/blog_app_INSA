import type { Article, ArticleRequest, AuthResponse, UserProfile } from "@/types"

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

const API_BASE = "/api"

function getToken(): string | null {
  return localStorage.getItem("token")
}

function getAuthHeaders(): HeadersInit {
  const token = getToken()
  const headers: HeadersInit = { "Content-Type": "application/json" }
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  return headers
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) search.set(k, String(v))
  }
  const q = search.toString()
  return q ? `?${q}` : ""
}

// Auth
export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Échec de la connexion")
  }
  return res.json()
}

export async function register(params: {
  username: string
  email: string
  password: string
  role?: string
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  const text = await res.text()
  if (!res.ok) {
    let message = text || "Échec de l'inscription"
    try {
      const json = JSON.parse(text)
      if (json.message) message = json.message
      else if (Array.isArray(json.errors)) message = json.errors.map((e: { defaultMessage?: string }) => e.defaultMessage).filter(Boolean).join(", ")
    } catch {
      // body is plain text (e.g. backend error message)
    }
    throw new Error(message)
  }
  return text ? JSON.parse(text) : ({} as AuthResponse)
}

// Articles
export interface ArticleListOptions {
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

export async function getCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/articles/categories`)
  if (!res.ok) return []
  return res.json()
}

export async function getArticles(params: ArticleListOptions = {}): Promise<Page<Article>> {
  const query = buildQuery({
    page: params.page ?? 0,
    size: params.size ?? 10,
    sort: params.sort ?? "date",
    order: params.order ?? "desc",
    keyword: params.keyword,
    authorId: params.authorId,
    category: params.category,
    tags: params.tags,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    publishedOnly: params.publishedOnly ?? true,
    featured: params.featured,
    pinned: params.pinned,
  })
  const res = await fetch(`${API_BASE}/articles${query}`)
  if (!res.ok) throw new Error("Impossible de charger les articles")
  return res.json()
}

export async function getArticleById(id: number): Promise<Article> {
  const res = await fetch(`${API_BASE}/articles/${id}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error("Article introuvable")
    throw new Error("Impossible de charger l'article")
  }
  return res.json()
}

export async function createArticle(data: ArticleRequest): Promise<Article> {
  const res = await fetch(`${API_BASE}/articles`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Impossible de créer l'article")
  }
  return res.json()
}

export async function updateArticle(id: number, data: ArticleRequest): Promise<Article> {
  const res = await fetch(`${API_BASE}/articles/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Impossible de modifier l'article")
  }
  return res.json()
}

export async function deleteArticle(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/articles/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Impossible de supprimer l'article")
  }
}

// Profil utilisateur
export interface UpdateProfileParams {
  username?: string
  email?: string
  currentPassword?: string
  newPassword?: string
}

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me`, { headers: getAuthHeaders() })
  if (!res.ok) {
    if (res.status === 401) throw new Error("Non authentifié")
    throw new Error("Impossible de charger le profil")
  }
  return res.json()
}

export async function updateProfile(params: UpdateProfileParams): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/users/me`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || "Impossible de modifier le profil")
  }
  return res.json()
}

export { getToken }
