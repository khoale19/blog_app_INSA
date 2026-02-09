# Vérifier PostgreSQL et la base blogdb

Le backend a besoin d’une base PostgreSQL. La configuration par défaut est dans `src/main/resources/application.properties` :

- **Hôte** : `localhost`
- **Port** : `5432`
- **Nom de la base** : `blogdb`
- **Utilisateur** : `postgres`
- **Mot de passe** : `root`

---

## 1. Savoir si PostgreSQL est démarré

### Sous Windows (service)

1. Appuyer sur **Win + R**, taper `services.msc`, Entrée.
2. Dans la liste des services, chercher **PostgreSQL** (ou un nom du type `postgresql-x64-15`).
3. Vérifier que l’**État** est **Démarré**. Sinon, clic droit → Démarrer.

### En ligne de commande (si `psql` est installé)

Ouvrir PowerShell ou CMD et taper :

```bash
psql -U postgres -h localhost -p 5432 -c "SELECT 1"
```

- Si vous voyez une ligne avec `1` (et éventuellement une demande de mot de passe), **PostgreSQL est bien démarré**.
- Si vous avez **« connection refused »** ou **« could not connect »** : PostgreSQL ne tourne pas ou n’écoute pas sur le port 5432 → démarrer le service (voir ci‑dessus) ou vérifier l’installation de PostgreSQL.

---

## 2. Savoir si la base blogdb existe

Dans un terminal :

```bash
psql -U postgres -h localhost -p 5432 -c "\l"
```

(Entrer le mot de passe de l’utilisateur `postgres` si demandé.)

Une liste de bases s’affiche. Chercher **blogdb** dans la colonne **Name**.

- Si **blogdb** est dans la liste → la base existe, vous pouvez lancer le backend.
- Si **blogdb** n’apparaît pas → il faut la créer (étape 3).

---

## 3. Créer la base blogdb

En ligne de commande :

```bash
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE blogdb;"
```

Avec la config par défaut, le mot de passe de l’utilisateur `postgres` est souvent celui que vous avez choisi à l’installation de PostgreSQL. Dans `application.properties` il est défini à **root** ; si votre utilisateur `postgres` a un autre mot de passe, soit vous changez le mot de passe de `postgres` en `root`, soit vous modifiez `application.properties` pour mettre le bon mot de passe.

**Sans `psql`** (interface graphique) :

- **pgAdmin** : connexion au serveur → clic droit sur « Databases » → Create → Database → nom : `blogdb`.
- **DBeaver** ou autre outil : connexion à `localhost:5432` avec l’utilisateur `postgres`, puis créer une base nommée `blogdb`.

Une fois la base créée, relancer le backend : il pourra se connecter à `blogdb`.
