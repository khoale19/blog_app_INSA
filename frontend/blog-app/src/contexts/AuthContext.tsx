import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import * as api from "@/lib/api"
import type { Role, User } from "@/types"

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>
  register: (params: { username: string; email: string; password: string; role?: Role }) => Promise<void>
  logout: () => void
  updateUser: (user: Pick<User, "id" | "username" | "email" | "role">) => void
  canCreateArticle: boolean
  canEditArticle: (authorId: number | null) => boolean
  canDeleteArticle: (authorId: number | null) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function roleCanCreate(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR" || role === "AUTHOR"
}

function roleCanEditOrDeleteAny(role: Role): boolean {
  return role === "ADMIN" || role === "EDITOR"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  })

  useEffect(() => {
    const token = api.getToken()
    if (!token) {
      setState((s) => ({ ...s, token: null, user: null, isLoading: false }))
      return
    }
    const raw = localStorage.getItem("user")
    if (raw) {
      try {
        const user = JSON.parse(raw) as User
        setState((s) => ({ ...s, token, user, isLoading: false }))
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setState((s) => ({ ...s, token: null, user: null, isLoading: false }))
      }
    } else {
      setState((s) => ({ ...s, token, user: null, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password)
    const user: User = {
      id: res.id,
      username: res.username,
      email: res.email,
      role: res.role,
    }
    localStorage.setItem("token", res.token)
    localStorage.setItem("user", JSON.stringify(user))
    setState({ token: res.token, user, isLoading: false })
  }, [])

  const register = useCallback(
    async (params: { username: string; email: string; password: string; role?: Role }) => {
      const res = await api.register({
        ...params,
        role: params.role ?? "READER",
      })
      const user: User = {
        id: res.id,
        username: res.username,
        email: res.email,
        role: res.role,
      }
      localStorage.setItem("token", res.token)
      localStorage.setItem("user", JSON.stringify(user))
      setState({ token: res.token, user, isLoading: false })
    },
    []
  )

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setState({ token: null, user: null, isLoading: false })
  }, [])

  const updateUser = useCallback((user: Pick<User, "id" | "username" | "email" | "role">) => {
    setState((s) => {
      if (!s.user || s.user.id !== user.id) return s
      const next = { ...s.user, ...user }
      localStorage.setItem("user", JSON.stringify(next))
      return { ...s, user: next }
    })
  }, [])

  const canCreateArticle = useMemo(
    () => (state.user ? roleCanCreate(state.user.role) : false),
    [state.user]
  )

  const canEditArticle = useCallback(
    (authorId: number | null) => {
      if (!state.user) return false
      if (roleCanEditOrDeleteAny(state.user.role)) return true
      if (state.user.role === "AUTHOR") return authorId === state.user.id
      return false
    },
    [state.user]
  )

  const canDeleteArticle = useCallback(
    (authorId: number | null) => {
      if (!state.user) return false
      if (roleCanEditOrDeleteAny(state.user.role)) return true
      if (state.user.role === "AUTHOR") return authorId === state.user.id
      return false
    },
    [state.user]
  )

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      updateUser,
      canCreateArticle,
      canEditArticle,
      canDeleteArticle,
    }),
    [state, login, register, logout, updateUser, canCreateArticle, canEditArticle, canDeleteArticle]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
