/**
 * Amorçage de la base — Phase 1.
 *
 * Reprend le contenu qui existait dans la version statique du site (études de
 * cas rédigées, CV) et l'insère en base. C'est le SEUL fichier du dépôt où des
 * noms de projets et du texte éditorial ont le droit d'apparaître.
 *
 * Idempotent : tout passe par `upsert` sur une clé stable (slug ou contrainte
 * unique). Deux exécutions successives laissent la base identique.
 *
 * Ce que le seed NE touche PAS sur une ligne existante, pour ne pas défaire le
 * travail fait dans l'administration : le statut et la date de publication
 * (projets, labs, séries), le niveau des compétences, la photo et les réseaux
 * sociaux. Le TEXTE, lui, est réécrit à chaque exécution : une fiche corrigée
 * depuis l'admin doit aussi l'être ici, sinon le prochain seed l'écrase.
 *
 * Mise à jour du 16/11/2026 : contenu aligné sur le CV « Data Engineer »
 * (AfricTivistes, Telsig), traductions anglaises (colonnes *En), projets
 * Archive du Journal officiel, TROUVI et Bene Vision, lien vers le CV PDF.
 *
 * Lancement : npx prisma db seed
 */
import { config } from 'dotenv';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL est absente. Renseignez-la dans .env.local avant de lancer le seed.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Statut d'un contenu amorcé — reflète l'enum Status du schéma. */
type SeedStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/* ── Tags ───────────────────────────────────────────────────────────────── */

const TAGS = [
  // Techniques
  { slug: 'python', name: 'Python', kind: 'TECH' as const },
  { slug: 'kafka', name: 'Kafka', kind: 'TECH' as const },
  { slug: 'spark', name: 'Spark', kind: 'TECH' as const },
  { slug: 'elasticsearch', name: 'Elasticsearch', kind: 'TECH' as const },
  { slug: 'graphql', name: 'GraphQL', kind: 'TECH' as const },
  { slug: 'react', name: 'React', kind: 'TECH' as const },
  { slug: 'nestjs', name: 'NestJS', kind: 'TECH' as const },
  { slug: 'prisma', name: 'Prisma', kind: 'TECH' as const },
  { slug: 'postgresql', name: 'PostgreSQL', kind: 'TECH' as const },
  { slug: 'docker', name: 'Docker', kind: 'TECH' as const },
  { slug: 'pytorch', name: 'PyTorch', kind: 'TECH' as const },
  { slug: 'asn1', name: 'ASN.1 / BER', kind: 'TECH' as const },
  { slug: 'ocr', name: 'OCR', kind: 'TECH' as const },
  { slug: 'flutter', name: 'Flutter', kind: 'TECH' as const },
  { slug: 'php', name: 'PHP', kind: 'TECH' as const },
  { slug: 'mysql', name: 'MySQL', kind: 'TECH' as const },
  // Domaines — nameEn renseigné seulement quand le nom diffère en anglais
  { slug: 'telecom', name: 'Télécom', nameEn: 'Telecom', kind: 'DOMAIN' as const },
  { slug: 'data-engineering', name: 'Data Engineering', kind: 'DOMAIN' as const },
  { slug: 'cybersecurite', name: 'Cybersécurité', nameEn: 'Cybersecurity', kind: 'DOMAIN' as const },
  { slug: 'detection-fraude', name: 'Détection de fraude', nameEn: 'Fraud detection', kind: 'DOMAIN' as const },
  { slug: 'reverse-engineering', name: 'Reverse engineering', kind: 'DOMAIN' as const },
  { slug: 'saas', name: 'SaaS', kind: 'DOMAIN' as const },
  { slug: 'ia', name: 'Intelligence artificielle', nameEn: 'Artificial intelligence', kind: 'DOMAIN' as const },
  { slug: 'donnees-publiques', name: 'Données publiques', nameEn: 'Public data', kind: 'DOMAIN' as const },
  { slug: 'marketplace', name: 'Marketplace', kind: 'DOMAIN' as const },
  { slug: 'developpement-web', name: 'Développement web', nameEn: 'Web development', kind: 'DOMAIN' as const },
] as { slug: string; name: string; nameEn?: string; kind: 'TECH' | 'DOMAIN' }[];

/* ── Projets ────────────────────────────────────────────────────────────
   Contenu repris des études de cas rédigées pour la version statique.
   Confidentialité : aucun nom de client, aucune donnée réelle, aucun
   identifiant d'abonné. Les exemples cités sont synthétiques.            */

const PROJECTS = [
  {
    slug: 'pipeline-fraude-irsf',
    title: 'Pipeline temps réel de détection de fraude IRSF',
    summary:
      "Détecter la fraude au partage de revenus international pendant l'appel plutôt qu'au règlement : ingestion Kafka, scoring Spark, alertes exposées en GraphQL.",
    role: 'Conception et réalisation du pipeline de bout en bout',
    featured: true,
    order: 1,
    status: 'PUBLISHED' as SeedStatus,
    tags: ['python', 'kafka', 'spark', 'elasticsearch', 'graphql', 'telecom', 'detection-fraude'],
    content: `
<h2>Contexte</h2>
<p>L'IRSF — <em>International Revenue Share Fraud</em> — consiste à générer artificiellement du trafic vers des numéros à revenus partagés. Le fraudeur perçoit sa part du reversement, l'opérateur d'origine paie la terminaison. La particularité de cette fraude est qu'elle est rentable en quelques heures : les campagnes sont courtes, intenses, puis disparaissent.</p>
<p>Le contrôle classique, lui, arrive après coup. On analyse les enregistrements d'appel une fois la période de facturation close, on identifie les destinations anormales, et on constate la perte. À ce stade, l'accord de règlement inter-opérateurs est déjà engagé : le constat n'est plus qu'un exercice comptable.</p>
<p>L'objectif de ce projet était de déplacer la détection <strong>en amont du règlement</strong>, sur le flux d'appels lui-même.</p>

<h2>Contrainte</h2>
<p><strong>La fenêtre utile est courte.</strong> Une détection qui arrive le lendemain n'a aucune valeur opérationnelle. Le système devait produire une alerte exploitable pendant que la campagne est encore active, donc travailler en continu et non par lots nocturnes.</p>
<p><strong>Le débit est irrégulier.</strong> Le trafic d'un réseau mobile n'est pas linéaire : il connaît des pointes marquées, et une campagne de fraude est précisément un pic dans le pic. Le pipeline devait absorber ces à-coups sans perdre d'enregistrement ni prendre du retard cumulatif.</p>
<p><strong>Les faux positifs coûtent cher.</strong> Une alerte est traitée par un analyste humain. Un système qui crie trop souvent est désactivé en quelques semaines. Il fallait donc un scoring nuancé, pas un simple seuil.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Collecte</strong> — normalisation des enregistrements bruts en un schéma unique (Python).</li>
  <li><strong>Kafka</strong> — mode KRaft, sans ZooKeeper. Partitionnement par destination appelée : tout le trafic vers un même préfixe atterrit sur la même partition, ce qui permet de raisonner par destination sans reshuffle coûteux.</li>
  <li><strong>Spark Structured Streaming</strong> — fenêtres glissantes par destination et par abonné, combinant des règles explicites et un score d'écart au comportement habituel. Une alerte n'est émise que lorsque plusieurs signaux concordent : c'est la réponse à la contrainte de faux positifs.</li>
  <li><strong>Elasticsearch</strong> — indexation des alertes, pour donner à l'analyste une recherche libre sur l'historique plutôt qu'un tableau figé.</li>
  <li><strong>GraphQL (Apollo) → React</strong> — console d'investigation : l'analyste ouvre une alerte, remonte au faisceau d'appels qui l'a déclenchée, et qualifie le cas.</li>
</ol>

<h2>Résultat</h2>
<p>L'apport principal est le déplacement du point de détection : la fraude est qualifiée pendant qu'elle est en cours, et non lors d'un audit postérieur. Le choix de KRaft a réduit la surface d'exploitation, et l'indexation des alertes dans Elasticsearch a transformé l'investigation en recherche plutôt qu'en extraction de rapports.</p>
`.trim(),
  },
  {
    slug: 'unigest-saas-multi-tenant',
    title: 'UniGest — plateforme SaaS multi-tenant de gestion académique',
    summary:
      "Une seule instance, plusieurs établissements, aucune fuite de données entre eux : isolation multi-tenant portée par l'architecture plutôt que par la vigilance de chaque requête.",
    role: 'Architecture et développement full-stack',
    featured: true,
    order: 2,
    status: 'PUBLISHED' as SeedStatus,
    tags: ['nestjs', 'prisma', 'postgresql', 'react', 'docker', 'saas'],
    content: `
<h2>Contexte</h2>
<p>Les établissements d'enseignement gèrent les mêmes objets — inscriptions, cohortes, évaluations, scolarité — mais chacun avec ses règles propres : barèmes différents, calendriers différents, structures de filières différentes. La réponse habituelle est une installation dédiée par établissement. Elle fonctionne, jusqu'au moment où il faut appliquer un correctif : il doit alors être déployé autant de fois qu'il y a de clients.</p>
<p>UniGest a été conçu comme une plateforme SaaS multi-tenant destinée aux établissements d'enseignement supérieur privés sénégalais : une seule application, une seule base, plusieurs établissements — chacun ne voyant que ses propres données.</p>

<h2>Contrainte</h2>
<p><strong>L'isolation est une exigence de sécurité, pas une préférence.</strong> Dans une base partagée, une requête qui oublie de filtrer par établissement expose les données d'un autre. Le risque ne pouvait pas reposer sur la discipline du développeur : il fallait que l'oubli soit structurellement impossible, ou au minimum détecté.</p>
<p><strong>Les règles varient d'un établissement à l'autre.</strong> Le modèle de données devait accepter ces variations sans multiplier les branches conditionnelles dans le code métier.</p>
<p><strong>Le déploiement devait rester simple.</strong> L'équipe visée est petite : pas d'orchestrateur complexe, pas de chaîne d'exploitation lourde à maintenir.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>React / Vite</strong> — interface de l'établissement, état géré avec Zustand.</li>
  <li><strong>NestJS</strong> — garde d'authentification JWT (hachage argon2id) qui résout l'établissement concerné et le place dans un contexte propre à la requête.</li>
  <li><strong>Couche tenant</strong> — isolation stricte via AsyncLocalStorage : le filtre d'établissement est appliqué systématiquement, au lieu d'être laissé à chaque service. C'est ce qui transforme l'isolation en propriété du système plutôt qu'en règle de bonne conduite.</li>
  <li><strong>Prisma</strong> — schéma typé et migrations versionnées : le modèle est décrit à un seul endroit, et les types remontent jusqu'au code applicatif, rendant visible à la compilation l'oubli d'un champ de tenant sur une nouvelle table.</li>
  <li><strong>PostgreSQL</strong> — base unique, clé de tenant sur les tables métier. 18 entités réparties sur 5 espaces : Super Admin, Admin, Professeur, Étudiant, Comptable.</li>
</ol>
<p>Les variations propres à chaque établissement — barèmes, calendriers, intitulés — sont stockées comme configuration rattachée au tenant, et non codées en dur. Ajouter un établissement revient à créer une configuration, pas à déployer une instance. L'ensemble est packagé avec Docker Compose et déployé sur VPS.</p>

<h2>Résultat</h2>
<p>Le gain structurel est le passage d'une installation par client à une instance unique : un correctif est déployé une fois pour tous les établissements, et l'arrivée d'un nouvel établissement est une opération de configuration.</p>
`.trim(),
  },
  {
    slug: 'analyse-cdr-ericsson-asn1',
    title: 'Analyse de fichiers CDR Ericsson (ASN.1 BER)',
    summary:
      "Rendre exploitables des enregistrements d'appel encodés en binaire : décodage ASN.1 BER en Python, contrôles de cohérence et rapports PDF automatisés.",
    role: 'Conception du décodeur et de la chaîne de rapports',
    featured: true,
    order: 3,
    status: 'PUBLISHED' as SeedStatus,
    tags: ['python', 'asn1', 'telecom', 'reverse-engineering'],
    content: `
<h2>Contexte</h2>
<p>Un commutateur ne produit pas des fichiers lisibles. Les enregistrements d'appel qu'il génère sont encodés en ASN.1 BER : une suite d'octets où chaque champ est décrit par son type, sa longueur et sa valeur. Ouvert dans un éditeur de texte, un tel fichier ne montre rien d'exploitable.</p>
<p>Or ces enregistrements sont la source de vérité pour la facturation, le Revenue Assurance et l'analyse de fraude. Tant qu'ils restent opaques, chaque question — même simple — suppose de passer par un outil propriétaire.</p>

<h2>Contrainte</h2>
<p><strong>Le format est strict, la structure ne l'est pas.</strong> L'encodage BER est normalisé, mais la composition des enregistrements varie selon la version du commutateur et les champs activés. Un décodeur figé sur une structure attendue casse au premier fichier différent.</p>
<p><strong>Les fichiers sont volumineux.</strong> Charger un fichier entier en mémoire n'est pas viable : le décodage devait être incrémental, enregistrement par enregistrement.</p>
<p><strong>Un fichier peut être tronqué.</strong> Une collecte interrompue produit un fichier partiel. Le décodeur devait s'arrêter proprement sur la zone corrompue et signaler l'incident, plutôt que de produire des valeurs fausses.</p>
<p>Aucune donnée réelle n'apparaît dans cette étude : les exemples de structure sont synthétiques.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Lecture incrémentale</strong> — le fichier est parcouru en flux, sans chargement complet en mémoire.</li>
  <li><strong>Décodeur TLV (BER)</strong> — récursif. La norme X.690 définit chaque champ comme un triplet tag–longueur–valeur : l'octet d'identification porte la classe sur ses 2 bits de poids fort, la forme sur le bit 6, et le numéro de tag sur les 5 bits restants. La longueur suit deux formes : forme courte sur un seul octet pour les valeurs de 0 à 127, forme longue au-delà. Un champ construit contient lui-même d'autres triplets, d'où la récursivité — c'est ce qui permet d'accepter des structures inconnues à l'avance.</li>
  <li><strong>Contrôles de cohérence</strong> — champs obligatoires, valeurs dans des bornes plausibles, longueurs annoncées compatibles avec les octets réellement disponibles. Ce dernier contrôle détecte la troncature et arrête le traitement au bon endroit, en consignant la position de l'anomalie.</li>
  <li><strong>Rapport PDF</strong> — synthèse du fichier traité et liste des anomalies, destiné à être lu par quelqu'un qui n'ouvrira jamais le binaire.</li>
</ol>

<h2>Résultat</h2>
<p>L'apport durable est l'autonomie : lire un enregistrement d'appel ne dépend plus d'un outil propriétaire, et une question nouvelle se traite en ajoutant un contrôle. Les contrôles de cohérence transforment un fichier corrompu en incident identifié plutôt qu'en données silencieusement fausses.</p>
`.trim(),
  },
  {
    slug: 'assistant-juridique-llama3',
    title: 'Assistant juridique intelligent — fine-tuning LLaMA 3',
    summary:
      "Développement et entraînement d'un modèle de langage spécialisé sur un corpus juridique, pour répondre à des questions de droit dans un cadre maîtrisé.",
    role: 'Conception et entraînement du modèle',
    featured: false,
    order: 4,
    status: 'DRAFT' as SeedStatus,
    tags: ['python', 'pytorch', 'ia'],
    content: `
<h2>Contexte</h2>
<p>Fine-tuning de LLaMA 3 (Meta) pour un assistant juridique intelligent.</p>
<h2>Contrainte</h2>
<p><em>À compléter depuis le back-office.</em></p>
<h2>Architecture</h2>
<p><em>À compléter depuis le back-office.</em></p>
<h2>Résultat</h2>
<p><em>À compléter depuis le back-office.</em></p>
`.trim(),
  },
  {
    slug: 'archive-journal-officiel-senegal',
    title: 'Archive numérique du Journal officiel du Sénégal (depuis 1960)',
    summary:
      "Rendre cherchables plus de soixante ans de textes officiels : collecte, OCR et structuration de plus de 23 000 documents, recherche plein texte dans PostgreSQL en moins de 35 ms.",
    role: 'Conception et réalisation de la chaîne de traitement',
    featured: true,
    order: 4,
    status: 'PUBLISHED' as SeedStatus,
    tags: ['python', 'ocr', 'postgresql', 'data-engineering', 'donnees-publiques'],
    content: `
<h2>Contexte</h2>
<p>Le Journal officiel publie depuis 1960 les lois, décrets et actes qui engagent l'État. Une grande partie de ce fonds n'existe qu'en images numérisées : on peut le lire page par page, mais pas y chercher un mot, un numéro de décret ou un nom d'institution.</p>
<p>L'objectif était de transformer ce fonds en archive interrogeable : retrouver en une requête tous les textes qui mentionnent un sujet, sur toute la période.</p>

<h2>Contrainte</h2>
<p><strong>La qualité des sources varie selon l'époque.</strong> Les numéros anciens n'ont ni la même typographie ni le même état de conservation que les récents. Un taux de reconnaissance moyen masquerait ces écarts : la qualité de l'OCR a donc été mesurée décennie par décennie, pour savoir où le texte extrait est fiable et où il faut le relire.</p>
<p><strong>Le volume.</strong> Plus de 23 000 documents : la chaîne devait être reprenable sans tout recommencer, et la recherche rester rapide sur l'ensemble du corpus.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Collecte</strong> — récupération des documents et de leurs métadonnées (date, numéro de parution).</li>
  <li><strong>OCR</strong> — extraction du texte, avec mesure de qualité par décennie.</li>
  <li><strong>Structuration</strong> — chaque document est rangé en base avec son texte et ses métadonnées.</li>
  <li><strong>PostgreSQL</strong> — index plein texte : la recherche répond en moins de 35 ms.</li>
</ol>

<h2>Résultat</h2>
<p>Un fonds jusque-là consultable seulement page par page devient une archive interrogeable sur toute la période, et l'on sait, décennie par décennie, quelle confiance accorder au texte extrait.</p>
`.trim(),
  },
  {
    // Brouillon : le contenu de TROUVI n'a pas encore été fourni en détail.
    slug: 'trouvi-marketplace-conciergerie',
    title: 'TROUVI — marketplace de conciergerie pour le marché sénégalais',
    summary:
      "Une marketplace de conciergerie pensée pour le Sénégal, avec vérification physique de la conformité des biens et services proposés.",
    role: 'Conception, modélisation des données et développement',
    featured: false,
    order: 6,
    status: 'DRAFT' as SeedStatus,
    tags: ['nestjs', 'prisma', 'flutter', 'react', 'marketplace'],
    content: `
<h2>Contexte</h2>
<p>TROUVI est un concept de marketplace de conciergerie pour le marché sénégalais. Sa particularité : une vérification physique de la conformité, pour que ce qui est proposé en ligne corresponde à ce qui est livré.</p>
<h2>Contrainte</h2>
<p><em>À compléter depuis le back-office.</em></p>
<h2>Architecture</h2>
<p>Schéma de données complet modélisé avec Prisma ; API NestJS, application mobile Flutter, interface web React.</p>
<p><em>À compléter depuis le back-office.</em></p>
<h2>Résultat</h2>
<p><em>À compléter depuis le back-office.</em></p>
`.trim(),
  },
  {
    // Brouillon : projet client. À publier seulement avec l'accord du client.
    slug: 'bene-vision-site-photographe',
    title: 'Bene Vision — site vitrine et administration pour un studio photo',
    summary:
      "Site vitrine d'un photographe et vidéaste à Dakar, avec un espace d'administration qui lui permet de gérer seul ses galeries, ses tarifs et ses textes.",
    client: 'Bene Vision',
    role: 'Design, développement et mise en ligne',
    featured: false,
    order: 7,
    status: 'DRAFT' as SeedStatus,
    tags: ['php', 'mysql', 'developpement-web'],
    content: `
<h2>Contexte</h2>
<p>Bene Vision est un photographe et vidéaste basé à Dakar. Il lui fallait un site qui mette ses images en valeur, et qu'il puisse faire vivre lui-même : ajouter une galerie après un shooting, changer un tarif, répondre aux demandes, sans passer par un développeur.</p>

<h2>Contrainte</h2>
<p><strong>Un hébergement mutualisé classique.</strong> Le site devait s'installer chez un hébergeur ordinaire, du même type que pour un WordPress : PHP et MySQL, sans serveur dédié ni chaîne de déploiement.</p>
<p><strong>Des photos très lourdes.</strong> Les originaux pèsent plusieurs dizaines de mégaoctets. Les afficher tels quels rendrait le site inutilisable sur mobile.</p>
<p><strong>Une identité visuelle forte.</strong> Le design devait s'accorder au logo du studio : une première maquette sombre et cinématographique, puis une refonte monochrome alignée sur son logo à empattements Didone.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Site public PHP</strong> — contrôleur frontal, URL propres (<code>/portfolio</code>, <code>/tarifs</code>), plan du site XML dynamique.</li>
  <li><strong>Galeries</strong> — vignettes générées automatiquement à l'envoi, grands formats optimisés, filtres par catégorie.</li>
  <li><strong>Administration</strong> — galeries (publier, mettre en avant, réordonner, choisir la couverture), catégories, tarifs, messages du formulaire de contact, textes, coordonnées et SEO.</li>
  <li><strong>Installateur guidé</strong> — crée la base, le compte administrateur et des galeries de démonstration, puis se supprime.</li>
</ol>

<h2>Résultat</h2>
<p>Le studio dispose d'un site qu'il administre seul, installable chez n'importe quel hébergeur mutualisé, avec des pages légères malgré des photos d'origine très lourdes.</p>
`.trim(),
  },
] as {
  slug: string;
  title: string;
  summary: string;
  content: string;
  client?: string;
  role: string;
  featured: boolean;
  order: number;
  status: SeedStatus;
  tags: string[];
}[];

/* ── Projets : version anglaise ─────────────────────────────────────────
   Colonnes titleEn / summaryEn / contentEn. Une entrée absente ici laisse
   le français s'afficher sur le site anglais (repli de pick()).          */

const PROJECTS_EN: Record<string, { titleEn: string; summaryEn: string; contentEn: string }> = {
  'pipeline-fraude-irsf': {
    titleEn: 'Real-time IRSF fraud detection pipeline',
    summaryEn:
      'Detecting International Revenue Share Fraud during the call rather than at settlement: Kafka ingestion, Spark scoring, alerts served over GraphQL.',
    contentEn: `
<h2>Context</h2>
<p>IRSF — <em>International Revenue Share Fraud</em> — consists of artificially generating traffic towards premium revenue-share numbers. The fraudster collects a share of the payout while the originating operator pays for termination. What makes this fraud distinctive is how quickly it pays off: campaigns are short and intense, then disappear.</p>
<p>Traditional controls arrive too late. Call records are analysed once the billing period is closed, abnormal destinations are identified, and the loss is recorded. By then the inter-operator settlement is already committed: the finding is little more than an accounting exercise.</p>
<p>The goal of this project was to move detection <strong>ahead of settlement</strong>, onto the call stream itself.</p>

<h2>Constraints</h2>
<p><strong>The useful window is short.</strong> A detection that arrives the next day has no operational value. The system had to raise an actionable alert while the campaign is still running, so it had to work continuously rather than in nightly batches.</p>
<p><strong>Throughput is uneven.</strong> Mobile network traffic is not linear: it has sharp peaks, and a fraud campaign is precisely a peak within the peak. The pipeline had to absorb these bursts without losing records or building up lag.</p>
<p><strong>False positives are expensive.</strong> Every alert is handled by a human analyst. A system that cries wolf too often gets switched off within weeks. Scoring had to be nuanced, not a simple threshold.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Collection</strong> — raw records normalised into a single schema (Python).</li>
  <li><strong>Kafka</strong> — KRaft mode, no ZooKeeper. Partitioned by called destination: all traffic to a given prefix lands on the same partition, so the pipeline can reason per destination without a costly reshuffle.</li>
  <li><strong>Spark Structured Streaming</strong> — sliding windows per destination and per subscriber, combining explicit rules with a deviation-from-usual-behaviour score. An alert is raised only when several signals agree: that is the answer to the false-positive constraint.</li>
  <li><strong>Elasticsearch</strong> — alerts are indexed, giving analysts free-text search over the history instead of a fixed table.</li>
  <li><strong>GraphQL (Apollo) → React</strong> — investigation console: the analyst opens an alert, traces back to the call pattern that triggered it, and qualifies the case.</li>
</ol>

<h2>Outcome</h2>
<p>The main gain is where detection happens: fraud is qualified while it is ongoing, not during a later audit. Choosing KRaft reduced the operational footprint, and indexing alerts in Elasticsearch turned investigation into search rather than report extraction.</p>
`.trim(),
  },
  'unigest-saas-multi-tenant': {
    titleEn: 'UniGest — multi-tenant SaaS platform for academic management',
    summaryEn:
      'One instance, many institutions, no data leaking between them: multi-tenant isolation enforced by the architecture rather than by the care taken in each query.',
    contentEn: `
<h2>Context</h2>
<p>Educational institutions manage the same objects — enrolments, cohorts, assessments, tuition — but each with its own rules: different grading scales, different calendars, different programme structures. The usual answer is a dedicated installation per institution. It works, until a fix has to be shipped: it must then be deployed as many times as there are clients.</p>
<p>UniGest was designed as a multi-tenant SaaS platform for private higher-education institutions in Senegal: one application, one database, many institutions — each seeing only its own data.</p>

<h2>Constraints</h2>
<p><strong>Isolation is a security requirement, not a preference.</strong> In a shared database, a query that forgets to filter by institution exposes another one's data. That risk could not rest on developer discipline: forgetting had to be structurally impossible, or at least detected.</p>
<p><strong>Rules vary between institutions.</strong> The data model had to absorb these variations without multiplying conditional branches in business code.</p>
<p><strong>Deployment had to stay simple.</strong> The target team is small: no complex orchestrator, no heavy operations tooling to maintain.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>React / Vite</strong> — institution-facing interface, state managed with Zustand.</li>
  <li><strong>NestJS</strong> — JWT authentication guard (argon2id hashing) that resolves the institution and places it in a request-scoped context.</li>
  <li><strong>Tenant layer</strong> — strict isolation through AsyncLocalStorage: the institution filter is applied systematically instead of being left to each service. This is what turns isolation into a property of the system rather than a rule of good conduct.</li>
  <li><strong>Prisma</strong> — typed schema and versioned migrations: the model is described in one place and types flow up to application code, so a missing tenant field on a new table shows up at compile time.</li>
  <li><strong>PostgreSQL</strong> — single database, tenant key on business tables. 18 entities across 5 workspaces: Super Admin, Admin, Teacher, Student, Accountant.</li>
</ol>
<p>Per-institution variations — grading scales, calendars, labels — are stored as configuration attached to the tenant, not hard-coded. Onboarding an institution means creating a configuration, not deploying an instance. The whole stack is packaged with Docker Compose and deployed on a VPS.</p>

<h2>Outcome</h2>
<p>The structural gain is the move from one installation per client to a single instance: a fix is deployed once for every institution, and onboarding a new one is a configuration task.</p>
`.trim(),
  },
  'analyse-cdr-ericsson-asn1': {
    titleEn: 'Ericsson CDR file analysis (ASN.1 BER)',
    summaryEn:
      'Making binary-encoded call records usable: ASN.1 BER decoding in Python, consistency checks and automated PDF reports.',
    contentEn: `
<h2>Context</h2>
<p>A switch does not produce readable files. The call records it generates are encoded in ASN.1 BER: a sequence of bytes where each field is described by its type, its length and its value. Opened in a text editor, such a file shows nothing usable.</p>
<p>Yet these records are the source of truth for billing, Revenue Assurance and fraud analysis. As long as they stay opaque, every question — even a simple one — has to go through a proprietary tool.</p>

<h2>Constraints</h2>
<p><strong>The format is strict; the structure is not.</strong> BER encoding is standardised, but record composition varies with the switch version and the enabled fields. A decoder hard-wired to an expected structure breaks on the first different file.</p>
<p><strong>Files are large.</strong> Loading a whole file into memory is not viable: decoding had to be incremental, record by record.</p>
<p><strong>A file may be truncated.</strong> An interrupted collection produces a partial file. The decoder had to stop cleanly at the corrupted area and report the incident, rather than produce wrong values.</p>
<p>No real data appears in this case study: the structure examples are synthetic.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Incremental reading</strong> — the file is streamed, never fully loaded into memory.</li>
  <li><strong>TLV (BER) decoder</strong> — recursive. The X.690 standard defines each field as a tag–length–value triplet: the identifier octet carries the class in its 2 most significant bits, the form in bit 6, and the tag number in the remaining 5 bits. Length comes in two forms: a single-octet short form for values 0 to 127, a long form beyond that. A constructed field contains further triplets, hence the recursion — which is what lets the decoder accept structures not known in advance.</li>
  <li><strong>Consistency checks</strong> — mandatory fields, values within plausible bounds, declared lengths consistent with the bytes actually available. That last check detects truncation and stops processing at the right place, logging the position of the anomaly.</li>
  <li><strong>PDF report</strong> — a summary of the processed file and the list of anomalies, written for someone who will never open the binary.</li>
</ol>

<h2>Outcome</h2>
<p>The lasting gain is autonomy: reading a call record no longer depends on a proprietary tool, and a new question is handled by adding a check. Consistency checks turn a corrupted file into an identified incident rather than silently wrong data.</p>
`.trim(),
  },
  'assistant-juridique-llama3': {
    titleEn: 'AI legal assistant — fine-tuning LLaMA 3',
    summaryEn:
      'Developing and training a language model specialised on a legal corpus, to answer legal questions within a controlled scope.',
    contentEn: `
<h2>Context</h2>
<p>Fine-tuning LLaMA 3 (Meta) for an AI legal assistant.</p>
<h2>Constraints</h2>
<p><em>To be completed from the back office.</em></p>
<h2>Architecture</h2>
<p><em>To be completed from the back office.</em></p>
<h2>Outcome</h2>
<p><em>To be completed from the back office.</em></p>
`.trim(),
  },
  'archive-journal-officiel-senegal': {
    titleEn: "Digital archive of Senegal's Official Journal (since 1960)",
    summaryEn:
      'Making more than sixty years of official texts searchable: collection, OCR and structuring of over 23,000 documents, with full-text search in PostgreSQL under 35 ms.',
    contentEn: `
<h2>Context</h2>
<p>Since 1960, the Official Journal has published the laws, decrees and acts that bind the State. Much of this collection exists only as scanned images: it can be read page by page, but not searched for a word, a decree number or the name of an institution.</p>
<p>The goal was to turn this collection into a searchable archive: find, in a single query, every text that mentions a subject across the whole period.</p>

<h2>Constraints</h2>
<p><strong>Source quality varies by era.</strong> Older issues have neither the typography nor the state of preservation of recent ones. An average recognition rate would hide those gaps, so OCR quality was measured decade by decade, to know where the extracted text can be trusted and where it needs proofreading.</p>
<p><strong>Volume.</strong> Over 23,000 documents: the pipeline had to be resumable without starting over, and search had to stay fast across the whole corpus.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Collection</strong> — retrieval of documents and their metadata (date, issue number).</li>
  <li><strong>OCR</strong> — text extraction, with quality measured per decade.</li>
  <li><strong>Structuring</strong> — each document is stored with its text and metadata.</li>
  <li><strong>PostgreSQL</strong> — full-text index: search answers in under 35 ms.</li>
</ol>

<h2>Outcome</h2>
<p>A collection that could only be browsed page by page becomes an archive searchable across the whole period — and, decade by decade, it is clear how much confidence the extracted text deserves.</p>
`.trim(),
  },
  'trouvi-marketplace-conciergerie': {
    titleEn: 'TROUVI — concierge marketplace for the Senegalese market',
    summaryEn:
      'A concierge marketplace built for Senegal, with physical verification that the goods and services offered match what is delivered.',
    contentEn: `
<h2>Context</h2>
<p>TROUVI is a concierge marketplace concept for the Senegalese market. Its distinctive feature is physical conformity verification, so that what is offered online matches what is delivered.</p>
<h2>Constraints</h2>
<p><em>To be completed from the back office.</em></p>
<h2>Architecture</h2>
<p>Complete data schema modelled with Prisma; NestJS API, Flutter mobile app, React web interface.</p>
<p><em>To be completed from the back office.</em></p>
<h2>Outcome</h2>
<p><em>To be completed from the back office.</em></p>
`.trim(),
  },
  'bene-vision-site-photographe': {
    titleEn: 'Bene Vision — showcase site and back office for a photo studio',
    summaryEn:
      'Showcase website for a Dakar-based photographer and videographer, with a back office that lets him manage his galleries, prices and copy on his own.',
    contentEn: `
<h2>Context</h2>
<p>Bene Vision is a photographer and videographer based in Dakar. He needed a site that shows off his images and that he can keep alive himself: add a gallery after a shoot, change a price, answer enquiries — without calling a developer.</p>

<h2>Constraints</h2>
<p><strong>Ordinary shared hosting.</strong> The site had to install on a standard host, the same kind used for WordPress: PHP and MySQL, no dedicated server, no deployment pipeline.</p>
<p><strong>Very heavy photos.</strong> Originals weigh tens of megabytes each. Serving them as-is would make the site unusable on mobile.</p>
<p><strong>A strong visual identity.</strong> The design had to match the studio's logo: a first dark, cinematic mock-up, then a monochrome redesign aligned with its Didone serif logo.</p>

<h2>Architecture</h2>
<ol>
  <li><strong>Public PHP site</strong> — front controller, clean URLs (<code>/portfolio</code>, <code>/tarifs</code>), dynamic XML sitemap.</li>
  <li><strong>Galleries</strong> — thumbnails generated automatically on upload, optimised large formats, category filters.</li>
  <li><strong>Back office</strong> — galleries (publish, feature, reorder, pick the cover), categories, prices, contact-form messages, copy, contact details and SEO.</li>
  <li><strong>Guided installer</strong> — creates the database, the admin account and demo galleries, then removes itself.</li>
</ol>

<h2>Outcome</h2>
<p>The studio has a site it runs on its own, installable on any shared host, with light pages despite very heavy original photos.</p>
`.trim(),
  },
};

/* ── Séries de labs ─────────────────────────────────────────────────────
   Reprise du parcours « Analyse binaire & reverse engineering, niveaux 0
   à 4 » décrit dans le CV. Les labs sont en brouillon : leur rédaction se
   fera depuis le back-office, ce qui est précisément son rôle.           */

const SERIES = {
  slug: 'reverse-engineering-binaire',
  title: 'Reverse engineering binaire — niveaux 0 à 4',
  description:
    "Parcours structuré d'analyse binaire : lecture de données hexadécimales, encodage et décodage XOR, déchiffrement AES-CBC, extraction de données cachées dans des images, puis passage à Ghidra et radare2 sur des cas CTF.",
  titleEn: 'Binary reverse engineering — levels 0 to 4',
  descriptionEn:
    'A structured binary-analysis track: reading hexadecimal data, XOR encoding and decoding, AES-CBC decryption, extracting data hidden in images, then moving on to Ghidra and radare2 on CTF challenges.',
  status: 'DRAFT' as SeedStatus,
};

const LABS = [
  {
    slug: 'lecture-hexadecimale-et-xor',
    title: 'Lecture hexadécimale et décodage XOR',
    objective:
      "Savoir lire un dump hexadécimal sans outil d'aide, et retrouver une clé XOR à un octet par analyse fréquentielle.",
    dayNumber: 1,
    difficulty: 2,
    status: 'DRAFT' as SeedStatus,
    tags: ['reverse-engineering', 'python', 'cybersecurite'],
    content: `
<h2>Démarche</h2>
<p><em>À rédiger depuis le back-office : les commandes utilisées, les captures, les étapes.</em></p>
<h2>Résultat</h2>
<p><em>À rédiger.</em></p>
`.trim(),
    takeaway: null,
  },
  {
    slug: 'aes-cbc-et-steganographie',
    title: 'Déchiffrement AES-CBC et stéganographie PNG/JPEG',
    objective:
      "Déchiffrer un bloc AES-CBC à partir de la clé et du vecteur d'initialisation, puis extraire une charge cachée dans les octets d'une image PNG ou JPEG.",
    dayNumber: 2,
    difficulty: 3,
    status: 'DRAFT' as SeedStatus,
    tags: ['reverse-engineering', 'python', 'cybersecurite'],
    content: `
<h2>Démarche</h2>
<p><em>À rédiger depuis le back-office : les commandes utilisées, les captures, les étapes.</em></p>
<h2>Résultat</h2>
<p><em>À rédiger.</em></p>
`.trim(),
    takeaway: null,
  },
];

/* ── Labs : version anglaise ─────────────────────────────────────────── */

const LABS_EN: Record<string, { titleEn: string; summaryEn: string; contentEn: string }> = {
  'lecture-hexadecimale-et-xor': {
    titleEn: 'Reading hex dumps and decoding XOR',
    summaryEn:
      'Learning to read a hexadecimal dump without helper tools, and recovering a single-byte XOR key through frequency analysis.',
    contentEn: `
<h2>Approach</h2>
<p><em>To be written from the back office: commands used, screenshots, steps.</em></p>
<h2>Outcome</h2>
<p><em>To be written.</em></p>
`.trim(),
  },
  'aes-cbc-et-steganographie': {
    titleEn: 'AES-CBC decryption and PNG/JPEG steganography',
    summaryEn:
      'Decrypting an AES-CBC block from the key and initialisation vector, then extracting a payload hidden in the bytes of a PNG or JPEG image.',
    contentEn: `
<h2>Approach</h2>
<p><em>To be written from the back office: commands used, screenshots, steps.</em></p>
<h2>Outcome</h2>
<p><em>To be written.</em></p>
`.trim(),
  },
};

/* ── CV : expériences, formation, compétences ───────────────────────────
   Repris du CV « Data Engineer » de novembre 2026. Les données personnelles
   de tiers (référents), l'adresse et le téléphone en sont volontairement
   absents.

   Les descriptions sont du TEXTE BRUT, une ligne par point : la page À propos
   les affiche avec `whitespace-pre-line`, sans interpréter de HTML. (Les
   versions précédentes contenaient des balises <ul><li> qui s'affichaient
   telles quelles à l'écran.)                                              */

const EXPERIENCES = [
  {
    company: 'AfricTivistes',
    role: 'Data Engineer, spécialiste IA',
    roleEn: 'Data Engineer, AI specialist',
    location: 'Dakar, Sénégal',
    startDate: new Date('2026-09-01'),
    endDate: null,
    order: 1,
    description: [
      "• Sahel Dashboard – Observatoire citoyen (Burkina Faso, Mali, Niger, Guinée) : conception de la chaîne de données d'une plateforme sécurisée de documentation des violations des droits humains — collecte des signalements, nettoyage et normalisation des exports en Python, référentiel de classification (9 familles, 33 types), règles de rétention et de publication anonymisée des agrégats, site public bilingue FR/EN",
      '• JOKKOO : architecture du moteur de données d\'une plateforme citoyenne multicanale (web, mobile, SMS, WhatsApp) — modélisation, pipelines et contrats d\'API (Supabase/PostgreSQL, NocoDB)',
      '• Visualisation automatisée de rapports : extraction des données de rapports PDF vers une plateforme web multilingue, avec détection et signalement des anomalies',
      "• Base de profils pays : outil Python de consolidation des ratifications de traités de l'UA (CADHP, CADEG, Malabo) par région",
      '• Dépôts Git versionnés, pull requests relues en revue de code, documentation des règles de gestion',
    ].join('\n'),
    descriptionEn: [
      '• Sahel Dashboard – Citizen observatory (Burkina Faso, Mali, Niger, Guinea): designed the data pipeline of a secure platform documenting human-rights violations — report collection, Python cleaning and normalisation of exports, classification framework (9 families, 33 types), retention rules and anonymised publication of aggregates, bilingual FR/EN public site',
      '• JOKKOO: data-engine architecture for a multichannel civic platform (web, mobile, SMS, WhatsApp) — modelling, pipelines and API contracts (Supabase/PostgreSQL, NocoDB)',
      '• Automated report visualisation: extracting data from PDF reports into a multilingual web platform, with anomaly detection and flagging',
      '• Country profile database: Python tool consolidating ratifications of AU treaties (ACHPR, ACDEG, Malabo) by region',
      '• Versioned Git repositories, pull requests reviewed in code review, documented business rules',
    ].join('\n'),
  },
  {
    company: 'Telsig',
    role: 'Ingénieur Data – détection de fraude télécom (IRSF)',
    roleEn: 'Data Engineer – telecom fraud detection (IRSF)',
    location: 'Dakar, Sénégal',
    startDate: new Date('2025-12-01'),
    endDate: new Date('2026-02-28'),
    order: 2,
    description: [
      '• Conception d\'un pipeline de traitement de données CDR temps réel : Kafka (mode KRaft), Spark Batch et Structured Streaming',
      '• Indexation et visualisation des données avec Elasticsearch et Kibana',
      '• Modélisation de la fraude avec PyTorch et suivi des expériences via MLflow',
      "• Analyse critique de la performance du modèle (identification d'une fuite de données derrière un AUC de 1.0) et mise en place de bonnes pratiques de validation",
    ].join('\n'),
    descriptionEn: [
      '• Designed a real-time CDR processing pipeline: Kafka (KRaft mode), Spark Batch and Structured Streaming',
      '• Indexed and visualised the data with Elasticsearch and Kibana',
      '• Modelled fraud with PyTorch and tracked experiments with MLflow',
      '• Critical review of model performance (traced an AUC of 1.0 to data leakage) and introduced sound validation practices',
    ].join('\n'),
  },
  {
    company: 'GALIMATECH',
    role: 'Consultant Cybersécurité',
    roleEn: 'Cybersecurity Consultant',
    location: 'Dakar, Sénégal',
    startDate: new Date('2022-05-01'),
    endDate: new Date('2024-11-30'),
    order: 3,
    description: [
      '• Infogérance pour des entreprises basées en France, depuis Dakar (environnements multi-clients)',
      '• Gestion d\'infrastructures cloud (OVH, VPS) et administration Windows Server (Active Directory)',
      '• Supervision et centralisation des journaux (Nagios, Zabbix, AlienVault)',
      '• Élaboration de PCA/PRA et rédaction de politiques de sécurité conformes ISO 27001/27002',
    ].join('\n'),
    descriptionEn: [
      '• Managed IT services for France-based companies, from Dakar (multi-client environments)',
      '• Cloud infrastructure management (OVH, VPS) and Windows Server administration (Active Directory)',
      '• Monitoring and log centralisation (Nagios, Zabbix, AlienVault)',
      '• Business continuity and disaster recovery plans; security policies aligned with ISO 27001/27002',
    ].join('\n'),
  },
  {
    company: 'DTS Bamako',
    role: 'Administrateur Systèmes & Réseaux',
    roleEn: 'Systems & Network Administrator',
    location: 'Bamako, Mali',
    startDate: new Date('2021-08-01'),
    endDate: new Date('2022-04-30'),
    order: 4,
    description: [
      '• Configuration, déploiement et sécurisation des réseaux (LAN, WAN, VLAN, Wi-Fi) et des firewalls',
      '• Supervision des équipements (Cisco Nexus 9300), gestion des sauvegardes et des incidents',
    ].join('\n'),
    descriptionEn: [
      '• Configured, deployed and secured networks (LAN, WAN, VLAN, Wi-Fi) and firewalls',
      '• Equipment monitoring (Cisco Nexus 9300), backup and incident management',
    ].join('\n'),
  },
  {
    company: 'ONFP',
    role: 'Formateur',
    roleEn: 'Trainer',
    location: 'Sénégal',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    order: 5,
    description: [
      '• Conception et animation des sessions, production des supports, accompagnement des apprenants',
      '• Développement Web CMS — Saint-Louis (2025)',
      '• Médiation Numérique — Matam (2024)',
    ].join('\n'),
    descriptionEn: [
      '• Designed and delivered sessions, produced course materials, supported learners',
      '• Web development with CMS — Saint-Louis (2025)',
      '• Digital inclusion — Matam (2024)',
    ].join('\n'),
  },
];

const EDUCATION = [
  {
    school: 'ESMT — École Supérieure Multinationale des Télécommunications, Dakar',
    degree: "Master en Ingénierie des Systèmes d'Information",
    degreeEn: 'Master of Engineering in Information Systems',
    field: 'Option : Sécurité des Systèmes',
    fieldEn: 'Major: Systems Security',
    startDate: null,
    endDate: new Date('2021-12-31'),
    order: 1,
    description: null,
  },
  {
    school: 'ESMT Dakar',
    degree: 'Licence Professionnelle en Télécommunications & Informatique',
    degreeEn: "Professional Bachelor's in Telecommunications & IT",
    field: null,
    fieldEn: null,
    startDate: null,
    endDate: new Date('2019-12-31'),
    order: 2,
    description: null,
  },
  {
    school: 'LMDB Bamako',
    degree: 'Baccalauréat Sciences Expérimentales',
    degreeEn: 'Baccalaureate in Experimental Sciences',
    field: null,
    fieldEn: null,
    startDate: null,
    endDate: new Date('2015-12-31'),
    order: 3,
    description: null,
  },
];

/**
 * Compétences. Le niveau (1 à 5) n'est indiqué nulle part dans les CV : je ne
 * l'invente pas. Une compétence NOUVELLE démarre à 3 ; une compétence déjà en
 * base garde le niveau réglé depuis le back-office.
 *
 * Le seed n'efface jamais une compétence : en retirer une se fait depuis l'admin.
 */
const DEFAULT_LEVEL = 3;

const SKILL_GROUPS: Record<string, string[]> = {
  'Data Engineering': [
    'Kafka (KRaft)',
    'Spark (Batch & Structured Streaming)',
    'Elasticsearch',
    'Kibana',
    'MLflow',
    'Power BI',
    'SQL',
    'Jupyter',
  ],
  'Pipelines & qualité des données': [
    'ETL/ELT',
    'Nettoyage et normalisation',
    "Détection d'anomalies",
    'Anonymisation',
    'Documentation des flux',
  ],
  'Bases de données': ['PostgreSQL', 'Supabase', 'NocoDB'],
  'Intelligence artificielle': [
    'Deep learning',
    'Fine-tuning (LLaMA 3)',
    'PyTorch',
    'RAG (bases)',
  ],
  Développement: [
    'Node.js',
    'NestJS',
    'Prisma',
    'React/Vite',
    'Laravel/FilamentPHP',
    'Python',
    'Git/GitHub',
  ],
  'Cloud & virtualisation': ['Azure', 'AWS', 'OVH', 'Hetzner', 'VMware', 'VirtualBox'],
  Conteneurs: ['Docker', 'Docker Compose', 'Kubernetes'],
  Cybersécurité: [
    'FortiGate',
    'pfSense',
    'IPTables',
    'ISO 27001/27002',
    'PCA/PRA',
    'Pentesting (TryHackMe, HackTheBox)',
  ],
  'Reverse engineering': [
    'Analyse binaire',
    'Décodage hexadécimal',
    'XOR',
    'AES-CBC',
    'Stéganographie (PNG/JPEG)',
    'Ghidra / radare2',
  ],
  'Supervision & SIEM': ['Nagios', 'Zabbix', 'OSSIM (AlienVault)'],
  'Systèmes & administration': ['Windows Server (Active Directory)', 'Linux (Ubuntu, Kali)'],
  Réseaux: ['LAN/WAN/WLAN', 'VLAN', 'DHCP', 'DNS', 'VPN IPsec', 'MikroTik', 'Cisco Nexus'],
  'Gouvernance IT': ['ITIL', 'COBIT'],
};

/** Intitulé anglais de chaque catégorie de compétences. */
const SKILL_CATEGORY_EN: Record<string, string> = {
  'Data Engineering': 'Data Engineering',
  'Pipelines & qualité des données': 'Pipelines & data quality',
  'Bases de données': 'Databases',
  'Intelligence artificielle': 'Artificial intelligence',
  Développement: 'Development',
  'Cloud & virtualisation': 'Cloud & virtualisation',
  Conteneurs: 'Containers',
  Cybersécurité: 'Cybersecurity',
  'Reverse engineering': 'Reverse engineering',
  'Supervision & SIEM': 'Monitoring & SIEM',
  'Systèmes & administration': 'Systems administration',
  Réseaux: 'Networking',
  'Gouvernance IT': 'IT governance',
};

/** Ordre d'affichage des catégories : le profil data d'abord. */
const CATEGORY_ORDER = Object.keys(SKILL_GROUPS);

/**
 * Texte de la carte affichée au clic sur une compétence (FR, EN).
 * Chaque description dit ce qu'est l'outil, puis — seulement quand le CV
 * l'atteste — où il a été utilisé. Modifiable ensuite depuis /admin/skills.
 */
const SKILL_DESCRIPTIONS: Record<string, [string, string]> = {
  // Data Engineering
  'Kafka (KRaft)': [
    "Plateforme de streaming d'événements, ici en mode KRaft (sans ZooKeeper). Colonne vertébrale du pipeline temps réel de détection de fraude IRSF chez Telsig, partitionné par destination appelée.",
    'Event-streaming platform, run here in KRaft mode (no ZooKeeper). Backbone of the real-time IRSF fraud detection pipeline at Telsig, partitioned by called destination.',
  ],
  'Spark (Batch & Structured Streaming)': [
    'Moteur de calcul distribué, en traitement par lots comme en flux continu. Utilisé chez Telsig pour le scoring des enregistrements d\'appel sur fenêtres glissantes.',
    'Distributed compute engine, for both batch and continuous streaming. Used at Telsig to score call records over sliding windows.',
  ],
  Elasticsearch: [
    "Moteur de recherche et d'indexation. Les alertes de fraude y sont indexées pour permettre une recherche libre sur l'historique plutôt qu'un tableau figé.",
    'Search and indexing engine. Fraud alerts are indexed in it, enabling free-text search over history instead of a fixed table.',
  ],
  Kibana: [
    'Interface de visualisation au-dessus d\'Elasticsearch. Utilisée chez Telsig pour explorer et visualiser les données du pipeline CDR.',
    'Visualisation layer on top of Elasticsearch. Used at Telsig to explore and visualise CDR pipeline data.',
  ],
  MLflow: [
    "Suivi des expériences de machine learning : paramètres, métriques, modèles. Utilisé pour comparer les modèles de détection de fraude et repérer une fuite de données derrière un AUC de 1.0.",
    'Machine-learning experiment tracking: parameters, metrics, models. Used to compare fraud detection models and trace an AUC of 1.0 back to data leakage.',
  ],
  'Power BI': [
    'Outil de tableaux de bord et de reporting de Microsoft, pour mettre des indicateurs à disposition de publics non techniques.',
    "Microsoft's dashboarding and reporting tool, for putting indicators in front of non-technical audiences.",
  ],
  SQL: [
    'Le langage de base de tout travail de données : modélisation, requêtes analytiques, contrôles qualité directement en base.',
    'The foundation of all data work: modelling, analytical queries, quality checks run directly in the database.',
  ],
  Jupyter: [
    "Notebooks pour explorer des données et livrer une analyse reproductible. Livrable de la base de profils pays chez AfricTivistes, aux côtés des fichiers Excel.",
    'Notebooks for exploring data and delivering reproducible analysis. A deliverable of the country profile database at AfricTivistes, alongside Excel files.',
  ],

  // Pipelines & qualité des données
  'ETL/ELT': [
    'Extraire, transformer, charger — dans un ordre ou dans l\'autre. Conception de chaînes batch et temps réel sur des sources hétérogènes : CDR télécoms, signalements citoyens, rapports PDF.',
    'Extract, transform, load — in either order. Designing batch and real-time pipelines over heterogeneous sources: telecom CDRs, citizen reports, PDF reports.',
  ],
  'Nettoyage et normalisation': [
    "Rendre une donnée brute exploitable : formats unifiés, doublons, valeurs aberrantes. Outil Python de nettoyage des exports de signalements pour le Sahel Dashboard.",
    'Making raw data usable: unified formats, duplicates, outliers. Python tool cleaning report exports for the Sahel Dashboard.',
  ],
  "Détection d'anomalies": [
    "Repérer ce qui s'écarte du comportement attendu : trafic frauduleux sur un réseau télécom, incohérences dans des rapports extraits automatiquement.",
    'Spotting what departs from expected behaviour: fraudulent traffic on a telecom network, inconsistencies in automatically extracted reports.',
  ],
  Anonymisation: [
    "Publier des chiffres sans exposer les personnes : agrégation mensuelle, seuils de discrétion statistique. Appliqué aux agrégats publics d'une plateforme de documentation des droits humains.",
    'Publishing figures without exposing people: monthly aggregation, statistical disclosure thresholds. Applied to the public aggregates of a human-rights documentation platform.',
  ],
  'Documentation des flux': [
    "Écrire où va la donnée, ce qu'elle devient et selon quelles règles : référentiels de classification, règles de rétention, règles de gestion versionnées avec le code.",
    'Writing down where data goes, what it becomes and under which rules: classification frameworks, retention rules, business rules versioned with the code.',
  ],

  // Bases de données
  PostgreSQL: [
    "Base relationnelle de référence. Recherche plein texte en moins de 35 ms sur plus de 23 000 documents du Journal officiel ; base unique multi-tenant d'UniGest ; base de ce site.",
    "The reference relational database. Full-text search in under 35 ms across 23,000+ Official Journal documents; UniGest's single multi-tenant database; this site's database.",
  ],
  Supabase: [
    'PostgreSQL hébergé, avec API, authentification et stockage. Socle du moteur de données de JOKKOO, qui alimente le Sahel Dashboard.',
    'Hosted PostgreSQL with API, authentication and storage. Foundation of the JOKKOO data engine, which feeds the Sahel Dashboard.',
  ],
  NocoDB: [
    "Interface type tableur au-dessus d'une base SQL, pour que des équipes non techniques saisissent et consultent les données. Utilisé sur JOKKOO.",
    'Spreadsheet-style interface over a SQL database, letting non-technical teams enter and browse data. Used on JOKKOO.',
  ],

  // Intelligence artificielle
  'Deep learning': [
    'Réseaux de neurones profonds, de la modélisation de la fraude télécom au fine-tuning de grands modèles de langage.',
    'Deep neural networks, from telecom fraud modelling to fine-tuning large language models.',
  ],
  'Fine-tuning (LLaMA 3)': [
    "Spécialiser un grand modèle de langage sur un corpus précis. Entraînement de LLaMA 3 (Meta) pour un assistant juridique intelligent.",
    'Specialising a large language model on a specific corpus. Trained LLaMA 3 (Meta) for an AI legal assistant.',
  ],
  PyTorch: [
    "Framework de deep learning. Modélisation de la fraude chez Telsig et entraînement du modèle de l'assistant juridique.",
    "Deep learning framework. Fraud modelling at Telsig and training of the legal assistant's model.",
  ],
  'RAG (bases)': [
    "Retrieval-Augmented Generation : faire répondre un modèle de langage à partir de documents retrouvés plutôt que de sa seule mémoire. Niveau : les bases.",
    'Retrieval-Augmented Generation: having a language model answer from retrieved documents rather than from memory alone. Level: fundamentals.',
  ],

  // Développement
  'Node.js': [
    'Environnement JavaScript côté serveur, socle des API NestJS et de ce site.',
    'Server-side JavaScript runtime, underlying the NestJS APIs and this site.',
  ],
  NestJS: [
    "Framework Node.js structuré en modules. API d'UniGest (TypeScript, isolation multi-tenant stricte) et de TROUVI.",
    "Modular Node.js framework. Powers the UniGest API (TypeScript, strict multi-tenant isolation) and TROUVI's.",
  ],
  Prisma: [
    "ORM TypeScript : le schéma de données est décrit à un seul endroit et ses types remontent jusqu'au code. 18 entités modélisées pour UniGest ; utilisé aussi pour TROUVI et ce site.",
    'TypeScript ORM: the data schema lives in one place and its types flow up to the code. 18 entities modelled for UniGest; also used for TROUVI and this site.',
  ],
  'React/Vite': [
    "Bibliothèque d'interfaces web et son outil de build rapide. Interface d'UniGest et console d'investigation des alertes de fraude.",
    'Web UI library and its fast build tool. UniGest interface and the fraud-alert investigation console.',
  ],
  'Laravel/FilamentPHP': [
    "Framework PHP et sa boîte à outils d'administration, pour livrer vite un back-office complet.",
    'PHP framework and its admin toolkit, for shipping a complete back office quickly.',
  ],
  Python: [
    "Langage principal de mes pipelines : décodage ASN.1 BER, nettoyage de données, consolidation de traités de l'UA, OCR du Journal officiel.",
    'Main language of my pipelines: ASN.1 BER decoding, data cleaning, AU treaty consolidation, Official Journal OCR.',
  ],
  'Git/GitHub': [
    "Versionnement et travail en équipe : dépôts sur l'organisation GitHub d'AfricTivistes, pull requests relues en revue de code.",
    "Version control and teamwork: repositories in AfricTivistes' GitHub organisation, pull requests reviewed in code review.",
  ],

  // Cloud & virtualisation
  Azure: ['Cloud de Microsoft : machines virtuelles, réseau, identité.', "Microsoft's cloud: virtual machines, networking, identity."],
  AWS: ["Cloud d'Amazon : calcul, stockage et réseau à la demande.", "Amazon's cloud: on-demand compute, storage and networking."],
  OVH: [
    "Hébergeur cloud européen. Gestion d'infrastructures OVH et de VPS chez GALIMATECH ; déploiement d'UniGest.",
    'European cloud provider. Managed OVH infrastructure and VPSs at GALIMATECH; UniGest deployment.',
  ],
  Hetzner: [
    'Hébergeur de serveurs et VPS. Cible de déploiement d\'UniGest avec Docker Compose.',
    'Server and VPS provider. A deployment target for UniGest with Docker Compose.',
  ],
  VMware: ["Virtualisation de serveurs pour les environnements d'entreprise.", 'Server virtualisation for enterprise environments.'],
  VirtualBox: [
    'Virtualisation sur poste de travail : laboratoires de test, environnements isolés.',
    'Desktop virtualisation: test labs, isolated environments.',
  ],

  // Conteneurs
  Docker: [
    "Conteneurs : une application et ses dépendances dans une image qui tourne pareil partout.",
    'Containers: an application and its dependencies packaged in an image that runs the same everywhere.',
  ],
  'Docker Compose': [
    "Décrire et lancer plusieurs conteneurs ensemble. UniGest est packagé ainsi et déployé sur VPS, sans orchestrateur lourd.",
    'Describing and running several containers together. UniGest is packaged this way and deployed on a VPS, with no heavy orchestrator.',
  ],
  Kubernetes: [
    'Orchestration de conteneurs à grande échelle : déploiement, mise à l\'échelle, redémarrage automatique.',
    'Container orchestration at scale: deployment, scaling, automatic restarts.',
  ],

  // Cybersécurité
  FortiGate: ['Pare-feu nouvelle génération de Fortinet.', "Fortinet's next-generation firewall."],
  pfSense: ['Pare-feu et routeur open source.', 'Open-source firewall and router.'],
  IPTables: ['Filtrage de paquets du noyau Linux.', 'Linux kernel packet filtering.'],
  'ISO 27001/27002': [
    "Normes de management de la sécurité de l'information. Rédaction de politiques de sécurité conformes chez GALIMATECH ; la même culture guide la conception des pipelines : contrôles, traçabilité, anonymisation.",
    'Information security management standards. Wrote compliant security policies at GALIMATECH; the same mindset drives pipeline design: controls, traceability, anonymisation.',
  ],
  'PCA/PRA': [
    "Plans de continuité et de reprise d'activité : comment le service continue, et comment il repart, après un incident. Élaborés chez GALIMATECH.",
    'Business continuity and disaster recovery plans: how the service keeps running, and how it comes back, after an incident. Built at GALIMATECH.',
  ],
  'Pentesting (TryHackMe, HackTheBox)': [
    "Tests d'intrusion pratiqués sur les plateformes d'entraînement TryHackMe et HackTheBox.",
    'Penetration testing practised on the TryHackMe and HackTheBox training platforms.',
  ],

  // Reverse engineering
  'Analyse binaire': [
    "Comprendre un fichier ou un programme à partir de ses octets. Parcours structuré du niveau 0 au niveau 4, documenté dans la série de labs.",
    'Understanding a file or program from its bytes. A structured track from level 0 to level 4, documented in the lab series.',
  ],
  'Décodage hexadécimal': [
    "Lire un dump hexadécimal sans outil d'aide. Indispensable pour les formats binaires comme les CDR en ASN.1 BER.",
    'Reading a hex dump without helper tools. Essential for binary formats such as ASN.1 BER call records.',
  ],
  XOR: [
    "Chiffrement par OU exclusif, très courant dans les CTF. Retrouver une clé à un octet par analyse fréquentielle.",
    'Exclusive-or encryption, very common in CTFs. Recovering a single-byte key through frequency analysis.',
  ],
  'AES-CBC': [
    "Chiffrement par blocs AES en mode CBC. Déchiffrer un bloc à partir de la clé et du vecteur d'initialisation.",
    'AES block cipher in CBC mode. Decrypting a block from the key and the initialisation vector.',
  ],
  'Stéganographie (PNG/JPEG)': [
    "Données cachées dans les octets d'une image. Extraire une charge dissimulée dans un PNG ou un JPEG.",
    "Data hidden in an image's bytes. Extracting a payload concealed in a PNG or JPEG.",
  ],
  'Ghidra / radare2': [
    'Outils de rétro-ingénierie : désassemblage et décompilation de binaires, sur des cas CTF.',
    'Reverse engineering tools: disassembling and decompiling binaries, on CTF challenges.',
  ],

  // Supervision & SIEM
  Nagios: [
    "Supervision de l'état des serveurs et des services. Mis en place chez GALIMATECH.",
    'Monitoring of server and service health. Deployed at GALIMATECH.',
  ],
  Zabbix: [
    'Supervision et métriques d\'infrastructure. Mis en place chez GALIMATECH.',
    'Infrastructure monitoring and metrics. Deployed at GALIMATECH.',
  ],
  'OSSIM (AlienVault)': [
    'SIEM open source : centralisation et corrélation des journaux de sécurité. Mis en place chez GALIMATECH.',
    'Open-source SIEM: centralising and correlating security logs. Deployed at GALIMATECH.',
  ],

  // Systèmes
  'Windows Server (Active Directory)': [
    "Serveurs Windows et annuaire Active Directory : comptes, groupes, droits. Administrés chez GALIMATECH.",
    'Windows servers and the Active Directory directory: accounts, groups, permissions. Administered at GALIMATECH.',
  ],
  'Linux (Ubuntu, Kali)': [
    'Ubuntu pour les serveurs, Kali pour les tests de sécurité.',
    'Ubuntu for servers, Kali for security testing.',
  ],

  // Réseaux
  'LAN/WAN/WLAN': [
    'Réseaux locaux, étendus et sans fil. Configurés, déployés et sécurisés chez DTS Bamako.',
    'Local, wide-area and wireless networks. Configured, deployed and secured at DTS Bamako.',
  ],
  VLAN: [
    'Segmentation logique d\'un réseau pour isoler les flux. Configurée chez DTS Bamako.',
    'Logical network segmentation to isolate traffic. Configured at DTS Bamako.',
  ],
  DHCP: ['Attribution automatique des adresses IP sur un réseau.', 'Automatic IP address assignment on a network.'],
  DNS: ['Résolution des noms de domaine en adresses IP.', 'Resolving domain names to IP addresses.'],
  'VPN IPsec': [
    'Tunnels chiffrés entre sites ou vers des postes distants.',
    'Encrypted tunnels between sites or to remote workstations.',
  ],
  MikroTik: ['Routeurs et équipements réseau MikroTik (RouterOS).', 'MikroTik routers and network gear (RouterOS).'],
  'Cisco Nexus': [
    'Commutateurs de centre de données Cisco. Supervision de Cisco Nexus 9300 chez DTS Bamako.',
    'Cisco data-centre switches. Monitored Cisco Nexus 9300 units at DTS Bamako.',
  ],

  // Gouvernance
  ITIL: [
    'Référentiel de bonnes pratiques de gestion des services informatiques : incidents, changements, niveaux de service.',
    'IT service management best-practice framework: incidents, changes, service levels.',
  ],
  COBIT: [
    "Référentiel de gouvernance des systèmes d'information : aligner l'informatique sur les objectifs de l'organisation.",
    "Information systems governance framework: aligning IT with the organisation's goals.",
  ],
};

/* ── Exécution ──────────────────────────────────────────────────────────── */

async function main() {
  console.log('Amorçage…');

  // Tags
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, nameEn: tag.nameEn ?? null, kind: tag.kind },
      create: tag,
    });
  }
  console.log(`  tags           ${TAGS.length}`);

  // Projets — le statut n'est posé qu'à la création : une publication faite
  // depuis l'admin n'est jamais annulée par un nouveau seed.
  for (const project of PROJECTS) {
    const { tags, status, ...data } = project;
    const en = PROJECTS_EN[project.slug] ?? {};
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;
    const tagConnect = tags.map((slug) => ({ slug }));

    await prisma.project.upsert({
      where: { slug: project.slug },
      update: { ...data, ...en, tags: { set: tagConnect } },
      create: { ...data, ...en, status, publishedAt, tags: { connect: tagConnect } },
    });
  }
  console.log(`  projets        ${PROJECTS.length}`);

  // Série + labs — même règle pour le statut.
  const { status: seriesStatus, ...seriesData } = SERIES;
  const series = await prisma.labSeries.upsert({
    where: { slug: SERIES.slug },
    update: seriesData,
    create: { ...seriesData, status: seriesStatus },
  });

  for (const lab of LABS) {
    const { tags, status, ...data } = lab;
    const en = LABS_EN[lab.slug] ?? {};
    const publishedAt = status === 'PUBLISHED' ? new Date() : null;
    const tagConnect = tags.map((slug) => ({ slug }));

    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: { ...data, ...en, seriesId: series.id, tags: { set: tagConnect } },
      create: {
        ...data,
        ...en,
        status,
        publishedAt,
        seriesId: series.id,
        tags: { connect: tagConnect },
      },
    });
  }
  console.log(`  series 1 · labs ${LABS.length}`);

  // Expériences
  for (const xp of EXPERIENCES) {
    await prisma.experience.upsert({
      where: {
        company_role_startDate: {
          company: xp.company,
          role: xp.role,
          startDate: xp.startDate,
        },
      },
      update: xp,
      create: xp,
    });
  }
  console.log(`  expériences    ${EXPERIENCES.length}`);

  // Formation
  for (const edu of EDUCATION) {
    await prisma.education.upsert({
      where: { school_degree: { school: edu.school, degree: edu.degree } },
      update: edu,
      create: edu,
    });
  }
  console.log(`  formations     ${EDUCATION.length}`);

  // Compétences — le niveau n'est posé qu'à la création. L'ordre suit
  // CATEGORY_ORDER : la page À propos regroupe par catégorie dans l'ordre
  // où elles apparaissent, et trie sur `order`.
  let skillCount = 0;
  for (const [categoryIndex, category] of CATEGORY_ORDER.entries()) {
    const categoryEn = SKILL_CATEGORY_EN[category] ?? null;
    for (const [index, name] of SKILL_GROUPS[category].entries()) {
      const order = categoryIndex * 100 + index;
      const [description, descriptionEn] = SKILL_DESCRIPTIONS[name] ?? [null, null];
      await prisma.skill.upsert({
        where: { category_name: { category, name } },
        update: { categoryEn, order, description, descriptionEn },
        create: { category, categoryEn, name, level: DEFAULT_LEVEL, order, description, descriptionEn },
      });
      skillCount += 1;
    }
  }
  console.log(`  compétences    ${skillCount}`);

  // Réglages du site. La photo (avatarUrl) et les réseaux sociaux se règlent
  // depuis /admin/parametres : ils ne sont posés qu'à la création.
  const settings = {
    fullName: 'Souleymane S. Sidibé',
    tagline: 'Data Engineer — pipelines ETL/ELT, streaming et gouvernance des données, Dakar',
    taglineEn: 'Data Engineer — ETL/ELT pipelines, streaming and data governance, Dakar',
    bio: `
<p>Data Engineer chez AfricTivistes et ingénieur en Systèmes d'Information (Master ESMT), avec cinq ans d'expérience IT. Je conçois et mets en production des pipelines de données batch et temps réel (Python, SQL, Kafka, Spark) sur des sources complexes : enregistrements d'appel télécoms, corpus documentaires, signalements citoyens et rapports PDF.</p>
<p>Ma culture sécurité (ISO 27001/27002) se retrouve dans la façon dont je construis ces pipelines : contrôles qualité, anonymisation, traçabilité, documentation. Formateur pour l'ONFP, j'aime aussi transmettre ces pratiques aux équipes.</p>
<p>Aucun contenu publié ici ne comporte de nom de client, de donnée réelle ni d'identifiant d'abonné. Les exemples de code et de trames sont synthétiques et signalés comme tels.</p>
`.trim(),
    bioEn: `
<p>Data Engineer at AfricTivistes and Information Systems engineer (Master's, ESMT), with five years of IT experience. I design and ship batch and real-time data pipelines (Python, SQL, Kafka, Spark) on demanding sources: telecom call records, document corpora, citizen reports and PDF reports.</p>
<p>My security background (ISO 27001/27002) shapes how I build those pipelines: quality checks, anonymisation, traceability, documentation. As a trainer for ONFP, I also enjoy passing these practices on to teams.</p>
<p>Nothing published here contains client names, real data or subscriber identifiers. Code and record examples are synthetic and labelled as such.</p>
`.trim(),
    // CV public : version sans les coordonnées des référents (données de
    // tiers). Fichier servi depuis public/cv/.
    cvUrl: '/cv/CV_Souleymane_SIDIBE_Data_Engineer.pdf',
    email: 'souleymanesidibe1995@gmail.com',
    location: 'Dakar, Sénégal',
    seoTitle: 'Souleymane S. Sidibé — Data Engineer',
    seoDesc:
      'Pipelines de données batch et temps réel, data engineering télécom, détection de fraude et cybersécurité, depuis Dakar.',
    seoTitleEn: 'Souleymane S. Sidibé — Data Engineer',
    seoDescEn:
      'Batch and real-time data pipelines, telecom data engineering, fraud detection and cybersecurity, from Dakar.',
  };

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: settings,
    create: { id: 'singleton', ...settings, socials: { linkedin: null, github: null } },
  });
  console.log('  réglages       1');

  // Compte administrateur (utilisé à partir de la Phase 2)
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, name: process.env.ADMIN_NAME ?? 'Administrateur' },
      create: { email, passwordHash, name: process.env.ADMIN_NAME ?? 'Administrateur' },
    });
    console.log('  admin          1');
  } else {
    console.log('  admin          ignoré (ADMIN_EMAIL / ADMIN_PASSWORD absents de .env.local)');
  }

  console.log('Terminé.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
