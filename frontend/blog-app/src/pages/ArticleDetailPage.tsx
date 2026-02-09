import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import * as api from "@/lib/api"
import type { Article } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { Pencil, Pin, Star, ArrowLeft, Trash2 } from "lucide-react"

function formatDate(s: string | undefined) {
  if (!s) return ""
  return new Date(s).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })
}

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canEditArticle, canDeleteArticle } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    const numId = Number(id)
    if (Number.isNaN(numId)) {
      setError("Identifiant d'article invalide")
      setLoading(false)
      return
    }
    api
      .getArticleById(numId)
      .then(setArticle)
      .catch((err) => setError(err instanceof Error ? err.message : "Article introuvable"))
      .finally(() => setLoading(false))
  }, [id])

  const canEdit = article ? canEditArticle(article.authorId ?? null) : false
  const canDelete = article ? canDeleteArticle(article.authorId ?? null) : false
  const published = article?.publishedAt && new Date(article.publishedAt) <= new Date()

  async function handleDelete() {
    if (!article || !confirm("Supprimer cet article ?")) return
    setDeleting(true)
    try {
      await api.deleteArticle(article.id)
      navigate("/", { replace: true })
    } catch {
      setDeleting(false)
    }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground">Chargement…</div>
  if (error || !article)
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || "Article introuvable"}</p>
        <Link to="/">
          <Button variant="outline" className="border-border hover:bg-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </Link>
      </div>
    )

  return (
    <article className="space-y-6">
      <Link to="/">
        <Button variant="ghost" size="sm" className="gap-1 hover:bg-secondary">
          <ArrowLeft className="h-4 w-4" />
          Retour aux articles
        </Button>
      </Link>
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{article.title}</h1>
              <div className="flex flex-wrap gap-2">
                {article.featured && (
                  <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                    <Star className="h-3 w-3" /> À la une
                  </Badge>
                )}
                {article.pinned && (
                  <Badge className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <Pin className="h-3 w-3" /> Épinglé
                  </Badge>
                )}
                {article.category && <Badge variant="outline" className="border-border">{article.category}</Badge>}
                {!published && <Badge variant="destructive">Brouillon</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Link to={`/articles/${article.id}/edit`}>
                  <Button variant="default" size="sm" className="gap-1 bg-primary hover:bg-primary/90">
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </Button>
                </Link>
              )}
              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>Créé le {formatDate(article.createdAt)}</span>
            {article.updatedAt && <span>Modifié le {formatDate(article.updatedAt)}</span>}
            {article.publishedAt && <span>Publié le {formatDate(article.publishedAt)}</span>}
            {article.viewCount != null && <span>{article.viewCount} vue(s)</span>}
            {article.tags && <span>Tags : {article.tags}</span>}
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90">
            <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{article.content || "Aucun contenu."}</p>
          </div>
        </CardContent>
      </Card>
    </article>
  )
}
