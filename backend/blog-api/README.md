# Backend Blog API

## Lancer le backend (sans PostgreSQL)

Par défaut le backend utilise **H2** (base en mémoire). Aucune installation de base de données requise.

```bash
# Windows PowerShell
cd backend\blog-api
.\mvnw.cmd spring-boot:run
```

API : **http://localhost:8083**

## Données de test (mock)

Au premier démarrage, des **utilisateurs et articles de test** sont créés automatiquement.

### Comptes pour se connecter (frontend)

| Utilisateur | E-mail | Mot de passe | Rôle |
|-------------|--------|--------------|------|
| **test** | test@email.com | 123456 | Auteur |
| **mockuser** | mockuser@example.com | mock123 | Auteur |

- **test** : utilise ce compte pour te connecter et tester la création / modification / suppression d’articles.
- **mockuser** : ce compte a déjà **22 articles** pour tester la liste, la pagination, le tri, la recherche et les filtres.

### Ce que tu peux tester avec les données mock

- **Pagination** : plusieurs pages d’articles.
- **Tri** : par date, popularité (vues), titre.
- **Recherche** : mot-clé dans titre ou contenu (ex. « démo », « tester »).
- **Filtres** : catégorie (Tech, Science, Voyage, Culture, Sport), tags (java, react, voyage, etc.).
- **À la une / Épinglé** : quelques articles mis en avant.
- **Brouillons et programmation** : articles non publiés ou programmés pour plus tard.

En résumé : lance le backend, puis le frontend, connecte-toi avec **test** / **123456**, et parcours les articles pour tout tester.

## PostgreSQL (optionnel)

Pour utiliser PostgreSQL au lieu de H2, voir [POSTGRES.md](POSTGRES.md) et lancer avec le profil `prod` :
`-Dspring.profiles.active=prod`
