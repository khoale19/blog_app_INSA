import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import * as api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import type { Role } from "@/types"
import { useState } from "react"

const ROLE_LABELS: Record<Role, string> = {
  READER: "Lecteur",
  AUTHOR: "Auteur",
  EDITOR: "Éditeur",
  ADMIN: "Administrateur",
}

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const [editUsername, setEditUsername] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const { data: profile, isLoading, error: queryError } = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
    enabled: !!user,
  })

  const mutation = useMutation({
    mutationFn: (params: api.UpdateProfileParams) => api.updateProfile(params),
    onSuccess: (updated) => {
      updateUser(updated)
      queryClient.setQueryData(["profile"], updated)
      setEditUsername("")
      setEditEmail("")
      setCurrentPassword("")
      setNewPassword("")
      setSuccess("Profil mis à jour.")
      setError("")
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour")
      setSuccess("")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const params: api.UpdateProfileParams = {}
    if (editUsername.trim()) params.username = editUsername.trim()
    if (editEmail.trim()) params.email = editEmail.trim()
    if (newPassword) {
      params.currentPassword = currentPassword
      params.newPassword = newPassword
    }
    if (Object.keys(params).length === 0) {
      setError("Modifiez au moins un champ.")
      return
    }
    mutation.mutate(params)
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-muted-foreground">Connectez-vous pour accéder à votre profil.</p>
        <Button asChild className="mt-4 bg-primary hover:bg-primary/90">
          <Link to="/login">Connexion</Link>
        </Button>
      </div>
    )
  }

  if (isLoading || queryError) {
    return (
      <div className="py-16 text-center">
        {isLoading && (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Chargement du profil…</p>
          </>
        )}
        {queryError && (
          <p className="text-destructive">{queryError instanceof Error ? queryError.message : "Erreur"}</p>
        )}
      </div>
    )
  }

  const p = profile!

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-serif text-2xl font-normal text-foreground">Mon profil</h1>

      {/* En-tête profil + stats type daily.dev (icône + chiffre) */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-white">
              {(p.username || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">{p.username}</CardTitle>
              <CardDescription className="text-muted-foreground">{ROLE_LABELS[p.role]}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ligne de stats type daily.dev */}
          <div className="flex flex-wrap items-center gap-6 rounded-xl bg-secondary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{p.articleCount}</p>
                <p className="text-xs text-muted-foreground">article{p.articleCount !== 1 ? "s" : ""} publié{p.articleCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {p.articleCount > 0 && (
              <Button asChild variant="outline" size="sm" className="border-border hover:bg-secondary">
                <Link to={`/?authorId=${p.id}`}>Voir tous mes articles</Link>
              </Button>
            )}
          </div>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Nom d'utilisateur</dt>
              <dd className="font-medium text-foreground">{p.username}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Adresse e-mail</dt>
              <dd className="font-medium text-foreground">{p.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Modifier mes informations</CardTitle>
          <CardDescription className="text-muted-foreground">Changez votre nom d'utilisateur, e-mail ou mot de passe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
            {success && (
              <div className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-400">{success}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Nouveau nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder={p.username}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Nouvelle adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder={p.email}
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel (pour changer le mot de passe)</Label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="border-border bg-secondary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="border-border bg-secondary"
              />
            </div>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {mutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
