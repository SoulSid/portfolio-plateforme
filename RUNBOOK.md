# Runbook — exploitation de la plateforme

Ce document sert **quand quelque chose ne va pas**, ou pour les gestes récurrents.
Pour installer le projet et comprendre son architecture, voir [README.md](README.md).

**Règle d'or** : un seul serveur de développement à la fois. La quasi-totalité des
incidents rencontrés jusqu'ici vient de plusieurs serveurs partageant le dossier `.next`.

---

## 1. Gestes quotidiens

### Démarrer proprement

```powershell
cd C:\Users\DELL\Desktop\Projets\portfolio-plateforme
```

```powershell
npm run dev
```

Trois choses à vérifier dans la sortie :

| Attendu | Si absent ou différent |
|---|---|
| `▲ Next.js 15.5.22` | Vous êtes dans le mauvais dossier |
| `Local: http://localhost:3000` | Un autre serveur occupe le port — voir §3.1 |
| *pas* de ligne `Port 3000 is in use` | Idem |

Puis **attendez** `✓ Compiled / in …` avant de recharger le navigateur. La première
compilation d'une page prend 10 à 15 secondes ; les suivantes sont instantanées.

### Arrêter proprement

`Ctrl+C` dans le terminal du serveur. Si le terminal a été fermé sans arrêter le
processus :

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Toujours utiliser `localhost`

Jamais `127.0.0.1`. Le cookie de session est lié à l'hôte de `AUTH_URL` : changer d'hôte
en cours de route fait perdre la connexion à l'administration sans message d'erreur clair.

---

## 2. Publier

### Un lab ou un projet

1. `http://localhost:3000/admin` → **Labs** ou **Projets** → *Nouveau*.
2. Le slug se génère depuis le titre. Le modifier change l'URL publique — à éviter après
   publication.
3. Images : glisser-déposer dans l'éditeur, ou **Médias** puis *Copier l'URL*.
4. Bloc de code : bouton **Code**, puis choisir le langage dans le menu qui apparaît.
5. **Aperçu** ouvre la page publique du brouillon via un jeton, sans le publier.
6. Statut **Publié** → *Enregistrer*. Le site public est à jour immédiatement.

Le brouillon s'enregistre seul toutes les 20 secondes. Depuis la liste, un clic
publie ou dépublie sans ouvrir la fiche.

### Réordonner une série

**Séries** → ouvrir la série → glisser-déposer, ou flèches ↑ ↓ (accessibles au clavier).
Le numéro de jour est recalculé et enregistré immédiatement.

### Après publication, le site public n'a pas changé

Le cache est invalidé par étiquette à chaque écriture. Si l'écran est resté ouvert,
forcez un rechargement complet : `Ctrl+Shift+R`. Si c'est toujours figé, redémarrez le
serveur — en développement le cache est parfois plus tenace qu'en production.

---

## 3. Incidents

### 3.1 — `Port 3000 is in use, using 3001 instead`

**Le plus fréquent, et il en cache un autre.** Deux serveurs Next.js sur le même projet
écrivent tous les deux dans `.next` et se corrompent : le second sert des 404 sur des
pages qui existent pourtant.

Diagnostic :

```powershell
Get-NetTCPConnection -LocalPort 3000,3001 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess
```

Remède :

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

```powershell
Remove-Item -Recurse -Force .next
```

Puis `npm run dev`. Vérifiez que la ligne `Port ... in use` a disparu.

### 3.2 — `Cannot find module './331.js'`

Chemin d'erreur dans `.next\server`. Même cause : `.next` corrompu, soit par deux
serveurs, soit par un `npm run build` lancé pendant que `npm run dev` tournait.

Remède identique au §3.1. **Ne lancez jamais `build` et `dev` en même temps.**

### 3.3 — `ERR_CONNECTION_REFUSED` / « Ce site est inaccessible »

Aucun serveur n'écoute. Causes par ordre de fréquence :

1. Le serveur n'a pas été relancé après un arrêt.
2. Mauvais dossier (`Mon_Portfolio` au lieu de `portfolio-plateforme`).
3. Le serveur a planté au démarrage — lisez la sortie complète du terminal.

Vérification rapide :

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
```

Aucune ligne = rien n'écoute.

### 3.4 — Page blanche ou lenteur au premier chargement

Normal en développement : Next.js compile chaque page à la demande. Comptez 10 à 15 s
la première fois. Attendez `✓ Compiled` dans le terminal plutôt que de recharger en
boucle — recharger pendant la compilation peut produire une page blanche.

### 3.5 — Déconnecté de `/admin` en boucle

La connexion réussit mais `/admin` renvoie à la page de connexion.

- Vous naviguez sur `127.0.0.1` alors que `AUTH_URL` vaut `localhost`, ou l'inverse.
  **Utilisez l'hôte exact de `AUTH_URL`.**
- `AUTH_SECRET` a changé : toutes les sessions existantes sont invalidées. Reconnectez-vous.

### 3.6 — `/admin` accessible sans être connecté

**Incident de sécurité.** La protection est entièrement portée par `src/middleware.ts` :
comme ce fichier fournit son propre callback à `auth()`, le rappel `authorized` de
`auth.config.ts` n'est **pas** appliqué automatiquement.

Test, à refaire après **toute** modification du middleware :

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin
```

Doit renvoyer **307**. Si vous obtenez 200, la vérification `request.auth?.user` a été
perdue dans le middleware — restaurez-la avant toute autre chose.

### 3.7 — `d.toISOString is not a function`

`unstable_cache` sérialise ce qu'il stocke : une colonne `DateTime` revient en **chaîne**,
pas en `Date`, alors que le type Prisma annonce `Date`. TypeScript ne peut pas le détecter.

Remède : n'appelez jamais `.toISOString()` directement sur une donnée issue du cache.
Utilisez les helpers de `src/lib/dates.ts` — `ymd`, `iso`, `year`, `toDate`.

### 3.8 — L'upload d'image échoue

- Bandeau « Cloudinary n'est pas configuré » : les trois clés manquent dans `.env.local`.
  Après les avoir ajoutées, **redémarrez le serveur** — les variables ne sont lues qu'au
  démarrage.
- « Fichier trop lourd » : 8 Mo maximum.
- « Format non accepté » : JPEG, PNG, WebP, GIF, AVIF uniquement.

Vérifier que les clés sont valides :

```bash
node -e "require('dotenv').config({path:'.env.local'});const c=require('cloudinary').v2;c.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});c.api.ping().then(r=>console.log(r)).catch(e=>console.log('ECHEC',e.message))"
```

### 3.9 — Erreur de connexion à la base

Symptôme : erreur Prisma au chargement de n'importe quelle page.

- `DATABASE_URL` absente ou mal collée dans `.env.local`.
- Base Neon en veille : le free tier suspend après inactivité. La première requête la
  réveille et prend quelques secondes — réessayez.
- Chaîne non *pooled* : prenez bien la **Pooled connection** dans la console Neon.

Test direct :

```bash
npm run db:studio
```

Si Prisma Studio s'ouvre et affiche les tables, la base répond.

### 3.10 — Le site public est vide

Compteurs à `00`, listes vides. Ce n'est pas un bug : **vos contenus sont en brouillon**.
Le front public n'affiche que le statut `PUBLISHED`. Allez dans `/admin/labs` et cliquez
**Publier**.

---

## 4. Vérification de santé

Après toute modification structurelle, ou avant de livrer.

Types et style :

```bash
npx tsc --noEmit
```

```bash
npm run lint
```

Build de production — **serveur de développement arrêté** :

```bash
npm run build
```

Serveur relancé, contrôle des routes publiques :

```bash
for u in / /labs /projets /a-propos /contact /en /en/labs /sitemap.xml /rss.xml; do printf "%-16s " "$u"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000$u"; done
```

Tout doit renvoyer **200**.

> Lancez cette boucle une seconde fois. Au premier passage, les pages jamais visitées se
> compilent à la demande et peuvent dépasser le délai de `curl` : vous verrez `000`, ce qui
> n'est pas une panne. C'est le second passage qui fait foi.

Puis la protection de l'administration :

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin
```

Doit renvoyer **307**. Enfin, la règle structurante du projet — aucun contenu éditorial
dans le code :

```bash
grep -rn --include="*.tsx" --include="*.ts" -e "UniGest" ./src
```

Doit ne rien renvoyer.

---

## 5. Base de données

### Sauvegarder

À faire **avant toute migration de schéma**.

```bash
pg_dump "$DATABASE_URL" -Fc -f sauvegarde.dump
```

### Restaurer

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists sauvegarde.dump
```

Neon offre aussi une restauration à un instant passé (*point-in-time restore*) depuis sa
console — durée de rétention variable selon le forfait.

### Modifier le schéma

1. Sauvegarder (ci-dessus).
2. Éditer `prisma/schema.prisma`.
3. `npm run db:push`
4. `npm run db:generate`
5. Redémarrer le serveur.

`db:push` applique sans créer de migration versionnée. Pour un historique de migrations,
passez à `prisma migrate dev`.

### Réamorcer

```bash
npm run db:seed
```

Idempotent : relançable sans créer de doublon. Il **n'efface pas** ce que vous avez créé
depuis l'administration.

---

## 6. Secrets

Tout vit dans `.env.local`, jamais versionné. `.env.example` documente les variables sans
aucune valeur.

### Changer le mot de passe administrateur

Il n'y a pas d'écran dédié. Modifiez `ADMIN_PASSWORD` dans `.env.local` puis :

```bash
npm run db:seed
```

Le seed remet à jour le hachage du compte existant.

### Renouveler la clé de session

```bash
npx auth secret
```

Reportez la valeur dans `AUTH_SECRET`. **Toutes les sessions ouvertes sont invalidées** :
il faudra vous reconnecter.

### Si un secret a fuité

1. Le révoquer à la source : régénérer la clé API Cloudinary, réinitialiser le mot de
   passe Neon, générer un nouveau `AUTH_SECRET`.
2. Mettre `.env.local` à jour.
3. Vérifier qu'il n'est jamais entré dans l'historique git :

```bash
git log --all -p -S "fragment_du_secret" | head
```

Aucun résultat = le dépôt est propre.

---

## 7. Avant la mise en production

Non effectuée à ce jour. Liste de contrôle le jour venu :

- [ ] `npm run build` passe sans erreur ni warning, serveur de dev arrêté
- [ ] `AUTH_URL` et `NEXT_PUBLIC_SITE_URL` pointent sur le domaine réel, pas `localhost`
- [ ] `AUTH_SECRET` **différent** de celui du poste de développement
- [ ] Toutes les variables de `.env.example` renseignées côté hébergeur
- [ ] `curl https://DOMAINE/admin` renvoie 307
- [ ] `/sitemap.xml` et `/rss.xml` répondent et ne listent que du contenu publié
- [ ] Une sauvegarde de la base a été prise
- [ ] Un lab de test publié depuis un téléphone apparaît en ligne

---

## 8. Repères

| Élément | Emplacement |
|---|---|
| Protection de l'administration | `src/middleware.ts` |
| Sessions et connexion | `src/auth.ts`, `src/auth.config.ts` |
| Modèle de données | `prisma/schema.prisma` |
| Lectures publiques et cache | `src/lib/queries.ts` |
| Formatage de dates | `src/lib/dates.ts` |
| Libellés d'interface FR/EN | `src/i18n/dictionary.ts` |
| Habillages OCTET / BITFIELD | `src/app/globals.css`, attribut `data-skin` |
| Maquette d'origine | `docs/maquette-publique.html` |
