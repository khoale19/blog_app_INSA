import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import * as api from "@/lib/api"
import type { ArticleRequest } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

interface ArticleFormPageProps {
  mode: "create" | "edit"
}

export function ArticleFormPage({ mode }: ArticleFormPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canCreateArticle, canEditArticle } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState("")
  const [publishedAt, setPublishedAt] = useState("")
  const [featured, setFeatured] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isEdit = mode === "edit"
  const numId = id ? Number(id) : NaN

  // Set default publication date/time to current time when creating a new article
  useEffect(() => {
    if (!isEdit) {
      const now = new Date()
      setPublishedAt(now.toISOString().slice(0, 16))
    }
  }, [isEdit])

  useEffect(() => {
    if (isEdit && !Number.isNaN(numId)) {
      api
        .getArticleById(numId)
        .then((a) => {
          if (!canEditArticle(a.authorId ?? null)) {
            setError("Vous n'avez pas le droit de modifier cet article")
            return
          }
          setTitle(a.title)
          setContent(a.content ?? "")
          setCategory(a.category ?? "")
          setTags(a.tags ?? "")
          setFeatured(a.featured ?? false)
          setPinned(a.pinned ?? false)
          if (a.publishedAt) {
            const d = new Date(a.publishedAt)
            setPublishedAt(d.toISOString().slice(0, 16))
          }
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Échec du chargement"))
    }
  }, [isEdit, numId, canEditArticle])

  if (isEdit && !canEditArticle(null)) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Vous n'avez pas le droit de modifier des articles.
        </CardContent>
      </Card>
    )
  }
  if (!isEdit && !canCreateArticle) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Vous n'avez pas le droit de créer des articles. Connectez-vous en tant qu'Auteur, Éditeur ou Administrateur.
        </CardContent>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const payload: ArticleRequest = {
      title: title.trim(),
      content: content.trim() || undefined,
      category: category.trim() || undefined,
      tags: tags.trim() || undefined,
      featured,
      pinned,
    }
    if (publishedAt.trim()) {
      payload.publishedAt = new Date(publishedAt).toISOString()
    } else {
      payload.publishedAt = null
    }
    try {
      if (isEdit) {
        await api.updateArticle(numId, payload)
        navigate(`/articles/${numId}`, { replace: true })
      } else {
        const created = await api.createArticle(payload)
        navigate(`/articles/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{isEdit ? "Modifier l'article" : "Nouvel article"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'article"
              required
              className="border-border bg-secondary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Contenu</Label>
            <textarea
              id="content"
              className="flex min-h-[200px] w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez votre article..."
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="ex. Tech"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="java, spring, blog"
                className="border-border bg-secondary"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="publishedAt">Date de publication (optionnel, vide = brouillon)</Label>
            <Input
              id="publishedAt"
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="border-border bg-secondary"
            />
            <p className="text-xs text-muted-foreground">
              Choisir une date/heure future pour programmer la publication.
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-border bg-secondary"
              />
              <span className="text-sm text-foreground">À la une</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-border bg-secondary"
              />
              <span className="text-sm text-foreground">Épinglé</span>
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Créer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-border hover:bg-secondary"
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
