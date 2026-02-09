import { Link, NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, PenLine, UserCircle, X, BookOpen, LogIn, UserPlus } from "lucide-react"
import type { Role } from "@/types"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"

const ROLE_LABELS: Record<Role, string> = {
  READER: "Lecteur",
  AUTHOR: "Auteur",
  EDITOR: "Éditeur",
  ADMIN: "Administrateur",
}

function UserAvatar({ username, className }: { username: string; className?: string }) {
  const initial = (username || "?").charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20",
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, canCreateArticle } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate("/", { replace: true })
  }

  return (
    <div className="h-screen overflow-hidden flex bg-background">
      {/* Left Sidebar - Modern style */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar/95 backdrop-blur-xl border-r border-border/40 flex flex-col transition-transform duration-300 shadow-lg",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <Link to="/" className="flex items-center gap-3 font-semibold group/logo">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover/logo:scale-105 transition-transform">
              <span className="text-primary-foreground font-bold text-xl">B</span>
            </div>
            <span className="text-foreground font-bold text-lg tracking-tight">INSA Blog</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-5 space-y-2">
          {canCreateArticle && (
            <Link
              to="/articles/new"
              className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold hover:from-primary/95 hover:to-primary/85 hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 mb-6"
            >
              <PenLine className="h-5 w-5" />
              Nouvel article
            </Link>
          )}

          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border-l-4 border-primary shadow-sm backdrop-blur-sm"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:translate-x-1"
              )
            }
            onClick={() => setSidebarOpen(false)}
          >
            <BookOpen className="h-5 w-5" />
            Pour vous
          </NavLink>
        </nav>

        <div className="p-5 border-t border-border/30">
          {user ? (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 flex-1 px-4 py-3 rounded-xl hover:bg-secondary/60 transition-all duration-200 hover:shadow-sm">
                    <UserAvatar username={user.username} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground/80">{ROLE_LABELS[user.role]}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 border-border bg-card">
                  <div className="border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-medium text-foreground">{user.username}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex cursor-pointer items-center">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Theme Toggle - to the right of user */}
              <ThemeToggle />
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                onClick={() => setSidebarOpen(false)}
              >
                <LogIn className="h-5 w-5" />
                Connexion
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground font-semibold hover:bg-secondary/80 transition-all duration-200"
                onClick={() => setSidebarOpen(false)}
              >
                <UserPlus className="h-5 w-5" />
                S'inscrire
              </Link>
              <div className="flex justify-end pt-2">
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile menu button - floating */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden p-3 rounded-xl bg-card/90 backdrop-blur-xl border border-border/40 text-foreground hover:bg-secondary/60 shadow-xl hover:scale-105 transition-all"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Main content */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-6 text-center text-xs text-muted-foreground/70 bg-sidebar/50 backdrop-blur-sm">
          INSA Centre Val de Loire — Campus Bourges
        </footer>
      </div>
    </div>
  )
}
