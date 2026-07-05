# Déploiement sur Railway — La Fibre Africaine

Architecture : **un seul service** (Express sert l'API + la boutique compilée) + **Postgres Railway**.
Le repo doit d'abord être poussé sur GitHub (ou utiliser `railway up` depuis ce dossier).

## 1. Créer le projet

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** (ou `railway init` + `railway up` en CLI).
2. Dans le projet : **+ New** → **Database** → **PostgreSQL**.

## 2. Variables d'environnement (service web)

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | Référencer la variable du service Postgres : `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | Une longue chaîne aléatoire (ex. `openssl rand -hex 32`) |
| `SMTP_HOST` | `smtp.gmail.com` (voir §5) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | l'adresse Gmail d'envoi |
| `SMTP_PASS` | mot de passe d'application Gmail (PAS le mot de passe normal) |
| `MAIL_FROM` | `"La Fibre Africaine" <votre@gmail.com>` |

`PORT` est fourni automatiquement par Railway. `SERVE_STATIC` et `NODE_ENV` sont déjà dans le script de démarrage.

## 3. Volume pour les photos téléversées

Les uploads admin vont dans `backend/media/uploads`. Sans volume, ils disparaissent à chaque déploiement.

- Service web → **Settings** → **Volumes** → **Add Volume**
- Mount path : `/app/backend/media/uploads`

(Les photos du catalogue initial dans `backend/media/products` sont dans le repo — pas besoin de volume pour elles.)

## 4. Première mise en service

Le script de démarrage exécute `prisma db push` automatiquement (crée les tables).
Pour charger le catalogue + le compte admin initial, une seule fois :

```bash
railway run --service <nom-du-service-web> npm run db:seed --prefix backend
```

Puis se connecter sur `https://<domaine>/admin` avec `sakaricky91@gmail.com` / `LaFibre-2026!`
et **changer le mot de passe immédiatement** (Mon compte).

## 5. Courriels (avant le domaine)

En attendant lafibreafricaine.com : utiliser Gmail.
Compte Google → Sécurité → Validation en 2 étapes → **Mots de passe des applications** → créer un mot de passe pour « Mail » → c'est le `SMTP_PASS`.

Quand le domaine sera acheté : passer à [Resend](https://resend.com) (domaine vérifié, meilleure délivrabilité) — remplacer les variables SMTP par celles de Resend.

## 6. Domaine

Service web → **Settings** → **Networking** → **Custom Domain** → `lafibreafricaine.com`
(chez le registraire : CNAME vers la cible affichée par Railway).

## Rappels

- Sans variables SMTP, le site fonctionne quand même — les courriels sont simplement ignorés (visibles dans les logs).
- `railway logs` pour voir les commandes reçues / erreurs.
- Le tableau de bord admin est sur `/admin`.
