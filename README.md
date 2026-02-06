# INSA Blog — Projet option

Application blog avec backend Spring Boot et frontend React (TypeScript, Tailwind, shadcn).

## Prérequis

- **Java 17** (backend)
- **Maven** (ou utiliser le wrapper `mvnw` / `mvnw.cmd` dans `backend/blog-api`)
- **Node.js 18+** et **npm** (frontend)
- **PostgreSQL** : optionnel. Par défaut le backend utilise **H2** (aucune installation de base requise). Voir [backend/blog-api/POSTGRES.md](backend/blog-api/POSTGRES.md) pour PostgreSQL (profil `prod`).

## Lancer l’application

### 1. Backend uniquement

```bash
cd backend/blog-api
./mvnw spring-boot:run
```

Sous Windows (PowerShell ou CMD) :

```bash
cd backend\blog-api
.\mvnw.cmd spring-boot:run
```

> **PowerShell** : il faut le préfixe `.\` pour exécuter un script du répertoire courant (`.\mvnw.cmd`).

- API : **http://localhost:8083**
- Les endpoints sont sous `/auth` (login, register) et `/articles`.
- **Données de test :** voir [backend/blog-api/README.md](backend/blog-api/README.md) — comptes **test** / **123456** et **mockuser** / **mock123**, plus 22 articles pour tester toutes les fonctionnalités.

### 2. Frontend uniquement

```bash
cd frontend/blog-app
npm install
npm run dev
```

- Interface : **http://localhost:5173**
- En dev, les appels vers `/api` sont redirigés vers le backend (port 8083). Le backend doit donc être démarré pour que le frontend fonctionne correctement.

### 3. Backend + frontend (recommandé pour tester l’app)

Ouvrir **deux terminaux**.

**Terminal 1 — Backend :**

```bash
cd backend/blog-api
./mvnw spring-boot:run
```
(sous Windows PowerShell : `.\mvnw.cmd spring-boot:run`)

**Terminal 2 — Frontend :**

```bash
cd frontend/blog-app
npm run dev
```

Puis ouvrir **http://localhost:5173** dans le navigateur.

### 4. Tout lancer depuis la racine (optionnel)

À la racine du projet (`Projet_option`) :

```bash
npm run backend
```
ou
```bash
npm run frontend
```
ou
```bash
npm run dev
```
(voir section « Scripts à la racine » ci‑dessous)

---

## Vérifier que l’app fonctionne

1. **Backend seul**  
   - Aucune base à installer par défaut (H2). Lancer le backend : au démarrage, Spring Boot charge les données mock (port 8083).  
   - Test rapide : `GET http://localhost:8083/articles` → liste d’articles en JSON.

2. **Frontend seul**  
   - Sans backend, la page s’affiche mais les appels API (articles, auth) échouent. Il faut lancer le backend pour une app complète.

3. **Backend + frontend**  
   - Backend sur 8083, frontend sur 5173.  
   - Aller sur http://localhost:5173, se connecter avec **test** / **123456** (voir section Données de test), puis tester liste, recherche, filtres, création d’articles.

---

## Scripts à la racine (optionnel)

À la racine du projet, après `npm install` (pour installer `concurrently`) :

| Commande            | Effet |
|---------------------|--------|
| `npm run backend`   | Lance le backend (nécessite **Maven** dans le PATH). |
| `npm run frontend`  | Lance le frontend (Vite). |
| `npm run dev`       | Lance **backend + frontend** en parallèle (nécessite Maven dans le PATH). |

**Si Maven n’est pas dans le PATH**, utilisez la méthode « deux terminaux » avec `mvnw` / `mvnw.cmd` dans `backend/blog-api` (voir section 3).
