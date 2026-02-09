import { Link } from "react-router-dom"
import type { Article } from "@/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { Pencil, Pin, Star, Trash2, Clock, Eye, Calendar, FileText } from "lucide-react"
import { useState } from "react"
import * as api from "@/lib/api"
import { cn } from "@/lib/utils"

interface ArticleCardProps {
  article: Article
}

function formatDate(s: string | undefined) {
  if (!s) return ""
  const d = new Date(s)
  return d.toLocaleDateString("fr-FR", { dateStyle: "medium" })
}

/** Estimation: ~200 mots/min en français */
function getReadTimeMinutes(content: string | undefined): number {
  if (!content || !content.trim()) return 0
  const words = content.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function isPublished(article: Article): boolean {
  if (!article.publishedAt) return false
  return new Date(article.publishedAt) <= new Date()
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { canEditArticle, canDeleteArticle } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const canEdit = canEditArticle(article.authorId ?? null)
  const canDelete = canDeleteArticle(article.authorId ?? null)
  const published = isPublished(article)
  const readTime = getReadTimeMinutes(article.content)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Supprimer cet article ?")) return
    setDeleting(true)
    try {
      await api.deleteArticle(article.id)
      window.location.reload()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <Card className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card hover:bg-card-hover hover:border-border/60 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 backdrop-blur-sm">
      <Link to={`/articles/${article.id}`} className="flex h-full w-full flex-col">
        <div className="flex h-full flex-col gap-5 p-6">
          {/* Title - fixed height */}
          <div className="flex items-start justify-between gap-3 min-h-[3rem]">
            <h2 className="text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1 tracking-tight">
              {article.title}
            </h2>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.preventDefault()}>
              {canEdit && (
                <Link to={`/articles/${article.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Category badges - fixed height */}
          <div className="flex flex-wrap gap-2 min-h-[1.75rem]">
            {article.featured && (
              <Badge className="gap-1.5 bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                <Star className="h-3 w-3" /> À la une
              </Badge>
            )}
            {article.pinned && (
              <Badge className="gap-1.5 bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                <Pin className="h-3 w-3" /> Épinglé
              </Badge>
            )}
            {article.category && (
              <Badge variant="outline" className="border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-secondary/50 text-xs font-medium px-3 py-1.5 rounded-lg transition-all">
                {article.category}
              </Badge>
            )}
            {!published && (
              <Badge variant="destructive" className="text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">Brouillon</Badge>
            )}
          </div>

          {/* Content - fixed height */}
          <p className="text-sm leading-relaxed text-muted-foreground/80 line-clamp-2 min-h-[2.75rem]">
            {article.content || "Aucun contenu"}
          </p>

          {/* Metrics row - aligned at bottom */}
          <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-2 pt-5 text-xs text-muted-foreground/70 border-t border-border/20">
            <span className="flex items-center gap-1.5 transition-colors group-hover:text-foreground/80">
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {formatDate(article.createdAt)}
            </span>
            {readTime > 0 && (
              <span className="flex items-center gap-1.5 transition-colors group-hover:text-foreground/80">
                <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {readTime} min
              </span>
            )}
            {article.viewCount != null && article.viewCount > 0 && (
              <span className="flex items-center gap-1.5 transition-colors group-hover:text-foreground/80">
                <Eye className="h-3.5 w-3.5 shrink-0 opacity-70" />
                {article.viewCount}
              </span>
            )}
            {article.tags && (
              <span className="truncate text-muted-foreground/70 transition-colors group-hover:text-primary/70">#{article.tags.split(',')[0]}</span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  )
}
