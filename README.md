# Portfolio — plateforme éditoriale

Site personnel de Souleymane S. Sidibé : réalisations, comptes rendus d'atelier et profil
professionnel. **Tout le contenu vit en base de données** et se publie depuis `/admin`,
sans toucher au code ni redéployer.

---

## Démarrer en local

```bash
npm install
```

```bash
cp .env.example .env.local
```

Remplissez `.env.local` (voir le tableau plus bas), puis :

```bash
npm run db:push
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Le site est sur **http://localhost:3000**, l'administration sur **/admin**.

> Utilisez toujours `localhost`, jamais `127.0.0.1` : le cookie de session est lié à
> l'hôte indiqué dans `AUTH_URL`, et changer d'hôte fait perdre la connexion.

---

## Variables d'environnement

| Variable | Requis | À quoi ça sert |
|---|---|---|
| `DATABASE_URL` | oui | Chaîne Neon (*Pooled connection*) |
| `AUTH_SECRET` | oui | Clé de signature des sessions — `npx auth secret` |
| `AUTH_URL` | oui | `http://localhost:3000` en local, le domaine en production |
| `ADMIN_EMAIL` · `ADMIN_PASSWORD` · `ADMIN_NAME` | au seed | Compte administrateur créé par `db:seed` |
| `CLOUDINARY_CLOUD_NAME` · `_API_KEY` · `_API_SECRET` | images | Upload des médias |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | images | Nom du cloud, exposé au navigateur (sans risque) |
| `PREVIEW_TOKEN` | aperçu | Rend un brouillon visible via `?preview=…` |
| `NEXT_PUBLIC_SITE_URL` | SEO | URL canonique, sitemap, flux, images de partage |
| `RESEND_API_KEY` · `CONTACT_NOTIFY_EMAIL` | non | Notification e-mail des messages de contact |

`.env.local` n'est **jamais** versionné. Aucun secret ne doit entrer dans le dépôt.

Sans `RESEND_API_KEY`, le formulaire de contact fonctionne quand même : le message est
enregistré et visible dans `/admin/messages`. Seul l'e-mail d'alerte est sauté.

---

## Publier

1. `/admin` → **Labs** ou **Projets** → *Nouveau*.
2. Titre (le slug se génère tout seul), objectif ou résumé, contenu.
3. Images : glissez-les dans l'éditeur, elles partent sur Cloudinary.
4. Blocs de code : bouton **Code**, puis choisissez le langage.
5. Bouton **Aperçu** pour voir le brouillon en ligne sans le publier.
6. Statut **Publié** → enregistrez. Le site est à jour immédiatement.

Le brouillon s'enregistre tout seul toutes les 20 secondes. Depuis la liste, un seul clic
publie ou dépublie sans ouvrir la fiche.

### Séries

Une série regroupe des labs numérotés (« 20 jours — … »). Créez-la dans **Séries**,
rattachez les labs depuis leur fiche, puis réordonnez-les par glisser-déposer ou avec les
flèches. Supprimer une série **ne supprime pas** ses labs : ils sont simplement détachés.

---

## Bilingue

Le français est la langue par défaut, sans préfixe (`/labs`). L'anglais est préfixé
(`/en/labs`). Chaque contenu a des champs `… (EN)` facultatifs : **laissés vides, le
français s'affiche à la place**. Un site partiellement traduit reste donc cohérent.

---

## Deux directions visuelles

Le sélecteur en haut à droite bascule entre **1A · OCTET** (ambre, éditorial) et
**1B · BITFIELD** (vert acide, tableau de bord). Le choix est mémorisé dans le navigateur.

Techniquement : un seul balisage, deux jeux de règles CSS pilotés par `data-skin` sur
`<html>`. Il n'y a pas deux arborescences de composants à maintenir en parallèle.

---

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run db:push` | Applique le schéma Prisma à la base |
| `npm run db:seed` | Remplit la base (idempotent : relançable sans doublon) |
| `npm run db:studio` | Explorateur de base Prisma Studio |
| `npm run lint` | ESLint |

> **Ne lancez jamais `npm run build` pendant que `npm run dev` tourne** : les deux
> écrivent dans `.next` et se corrompent mutuellement. Symptôme : `Cannot find module
> './xxx.js'`. Remède : arrêter le serveur, supprimer `.next`, relancer.

---

## Architecture

```
src/
  app/
    [locale]/          front public (fr + en)
    admin/             back-office protégé
    og/                images de partage générées
    sitemap.ts robots.ts rss.xml/
  components/
    public/            en-tête, cartes, sélecteurs
    admin/             formulaires et listes du back-office
    editor/            éditeur TipTap
  lib/                 prisma, requêtes cachées, dates, cloudinary
  i18n/                locales et libellés d'interface
prisma/
  schema.prisma        modèle de données
  seed.ts              amorçage idempotent
```

**Règle structurante** : aucun texte éditorial dans le code. Seuls les libellés
d'interface (« Voir tout », « Publier ») sont en dur, dans `src/i18n/dictionary.ts`.

Vérification :

```bash
grep -rn --include="*.tsx" --include="*.ts" -e "UniGest" ./src
```

Doit renvoyer zéro résultat. Cette chaîne n'existe que dans `prisma/seed.ts`.

### Fraîcheur du contenu

Les lectures publiques passent par `unstable_cache` avec des étiquettes (`labs`,
`projects`, `series`, `settings`, `profile`). Chaque écriture dans l'admin appelle
`revalidateTag` : performance du statique, mise à jour immédiate à la publication.

> Piège connu : `unstable_cache` **sérialise** ses résultats. Une colonne `DateTime`
> revient en chaîne, pas en `Date`, alors que le type Prisma annonce `Date`. Utilisez
> toujours les helpers de `src/lib/dates.ts` pour formater une date issue du cache.

### Sécurité de l'administration

La protection de `/admin` est **entièrement portée par `src/middleware.ts`**. Comme ce
fichier fournit son propre callback à `auth()`, le rappel `authorized` de la configuration
n'est pas appliqué automatiquement. Après toute modification du middleware, revérifiez :

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin
```

Doit renvoyer **307**. Chaque Server Action revérifie aussi la session de son côté.

---

## Sauvegarde de la base

Neon permet de revenir à un instant passé (*point-in-time restore*), durée variable selon
le forfait. Pour une sauvegarde locale :

```bash
pg_dump "$DATABASE_URL" -Fc -f sauvegarde.dump
```

Restauration :

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists sauvegarde.dump
```

Faites-en une avant toute migration de schéma.

---

## Mise en production

**Non effectuée.** Le projet est prêt pour Vercel : dépôt Git, variables d'environnement
recopiées depuis `.env.local` — avec `AUTH_URL` et `NEXT_PUBLIC_SITE_URL` pointant sur le
domaine réel — et build `npm run build` sans configuration particulière.
