# Mini système de collecte de soumissions

Collecte sécurisée des informations saisies par des visiteurs, avec API Node.js/Express, persistance via Prisma et bases SQLite (développement) ou PostgreSQL (production).

## Stack principale
- Node.js 20 + Express
- Prisma ORM (`Submission`)
- SQLite (dev) / PostgreSQL (prod)
- Validation Zod
- Sécurité : Helmet, CORS (liste blanche), rate limiting, CSRF, cookie parsing, hashage IP (SHA-256 + sel)
- Journalisation Pino
- Tests Jest + Supertest
- Frontend vanilla (formulaire minimal)
- Docker & docker-compose (service Postgres)

## Prérequis
- Node.js 20+
- npm 9+
- SQLite (intégré à Prisma)
- Docker (optionnel pour la partie Postgres)

## Configuration
1. Dupliquer `.env.example` vers `.env` et ajuster les valeurs :
   ```bash
   cp .env.example .env
   ```
2. Champs importants :
   - `API_KEY` : clé pour l’accès aux endpoints protégés.
   - `IP_SALT` : chaîne aléatoire pour le hash des IP.
   - `DATABASE_URL` : `file:./dev.db` (SQLite) par défaut.
   - `DATABASE_PROVIDER` : `sqlite` en dev, `postgresql` en prod.
   - `CORS_ORIGIN` : origines autorisées (séparées par des virgules).

## Lancer en développement (SQLite)
```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```
- Le serveur écoute sur `http://localhost:${PORT}` (défaut `3000`).
- Le frontend minimal est disponible sur la racine (`/`).
- `npm run prisma:migrate` crée la base SQLite (`prisma/dev.db`).

## Tests
```bash
npm test
```
- Tests unitaires Zod.
- Tests d’intégration API (Supertest) avec base SQLite éphémère (`prisma/test.db`).

## Migrations Prisma
- Schéma : `prisma/schema.prisma`.
- Migration initiale : `prisma/migrations/20240220120000_init/migration.sql`.
- Générer le client : `npm run prisma:generate`.
- Dev (SQLite) : `npm run prisma:migrate`.
- Prod (PostgreSQL) : `DATABASE_PROVIDER=postgresql DATABASE_URL=... npm run prisma:migrate:deploy`.

## Docker & Postgres local
```bash
docker compose up --build
```
- Lance Postgres 15 + l’app Node.
- L’app exécute `prisma migrate deploy` au démarrage.
- Variables sensibles (`API_KEY`, `IP_SALT`) peuvent être passées via l’environnement local.

## API
### GET /health
- Vérifie la liveness/readiness.

### GET /csrf
- Retourne `{ csrfToken }` et dépose un cookie `csrf_token` (httpOnly) pour les requêtes mutatives.

### POST /api/submissions
- Body JSON : `{ email?: string, payload: object, consent: true }`.
- Headers : `Content-Type: application/json`, `x-csrf-token`, cookie `csrf_token` (obtenu via `/csrf`).
- Rate limit : 100 req / 15 min / IP.
- Stocke `ipHash` (SHA-256(ip+salt)) et `userAgent`.
- Réponse `201 { id }`.

### GET /api/submissions (protégé)
- Header `x-api-key` obligatoire.
- Query params : `from`, `to`, `email`, `cursor`, `limit` (≤100).
- Pagination par curseur (ordre décroissant `createdAt` + `id`).
- Réponse : `{ data: Submission[], pagination: { hasNext, nextCursor } }`.

### DELETE /api/submissions/:id (protégé)
- Headers : `x-api-key`, `x-csrf-token` + cookie.
- Réponse `204` ou `404` si non trouvé.

### DELETE /api/submissions/by-email/:email (protégé)
- Supprime toutes les entrées liées à un email.
- Réponse `{ deleted: number }`.

## Frontend (public/index.html)
- Formulaire email optionnel + textarea JSON + checkbox RGPD.
- Récupère automatiquement le token CSRF (`/csrf`).
- Affiche des toasts succès/erreur.

## Sécurité
- Helmet (headers) + CORS restreint.
- Limitation de débit spécifique aux soumissions.
- CSRF cookie + header personnalisé `x-csrf-token`.
- Hashage IP (SHA-256 + sel).
- Sanitization basique des champs string dans `payload`.
- Logs Pino (HTTP + erreurs).

## RGPD & vie privée
- Consentement explicite obligatoire (`consent === true`).
- IP jamais stockée en clair (hash + sel).
- Endpoints de suppression : par `id` ou par `email`.
- Mentionner dans la politique : droits d’accès/suppression et durée de conservation (à adapter selon vos besoins).

## Déploiement (aperçu rapide)
- **Railway** : définir `DATABASE_URL` Postgres fournie, `DATABASE_PROVIDER=postgresql`, exécuter `npm run prisma:migrate:deploy` dans un hook post-déploiement.
- **Render** : utiliser un service Web (Docker ou `npm`), config env (`API_KEY`, `IP_SALT`, `DATABASE_URL` Postgres Render), script de build `npm run build` puis `npx prisma migrate deploy && node dist/server.js`.
- **Fly.io** : builder via Dockerfile fourni, attacher une base Postgres, définir les variables env et ajouter un release command `npx prisma migrate deploy`.

## Scripts npm
- `npm run dev` : nodemon + tsx (rechargement).
- `npm run build` : compilation TypeScript.
- `npm run start` : exécution en prod (nécessite `npm run build`).
- `npm test` : Jest + Supertest.
- `npm run lint` / `npm run format` : qualité code.
- `npm run prisma:generate` : client Prisma.
- `npm run prisma:migrate` : migrations dev (SQLite).
- `npm run prisma:migrate:deploy` : migrations prod (Postgres).
- `npm run prisma:seed` : exemple d’insertion.

## Suppression & conservation
- Prévoyez un process interne pour répondre aux demandes d’effacement (DELETE `/api/submissions/by-email/:email`).
- Documentez la durée de conservation et les modalités de contact dans votre propre politique.
