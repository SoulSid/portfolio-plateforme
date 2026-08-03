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
  // Domaines
  { slug: 'telecom', name: 'Télécom', kind: 'DOMAIN' as const },
  { slug: 'data-engineering', name: 'Data Engineering', kind: 'DOMAIN' as const },
  { slug: 'cybersecurite', name: 'Cybersécurité', kind: 'DOMAIN' as const },
  { slug: 'detection-fraude', name: 'Détection de fraude', kind: 'DOMAIN' as const },
  { slug: 'reverse-engineering', name: 'Reverse engineering', kind: 'DOMAIN' as const },
  { slug: 'saas', name: 'SaaS', kind: 'DOMAIN' as const },
  { slug: 'ia', name: 'Intelligence artificielle', kind: 'DOMAIN' as const },
];

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
];

/* ── Séries de labs ─────────────────────────────────────────────────────
   Reprise du parcours « Analyse binaire & reverse engineering, niveaux 0
   à 4 » décrit dans le CV. Les labs sont en brouillon : leur rédaction se
   fera depuis le back-office, ce qui est précisément son rôle.           */

const SERIES = {
  slug: 'reverse-engineering-binaire',
  title: 'Reverse engineering binaire — niveaux 0 à 4',
  description:
    "Parcours structuré d'analyse binaire : lecture de données hexadécimales, encodage et décodage XOR, déchiffrement AES-CBC, extraction de données cachées dans des images, puis passage à Ghidra et radare2 sur des cas CTF.",
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

/* ── CV : expériences, formation, compétences ───────────────────────────
   Repris des CV fournis par l'auteur. Les données personnelles de tiers
   (référents), l'adresse et le téléphone en sont volontairement absents. */

const EXPERIENCES = [
  {
    company: 'GALIMATECH',
    role: 'Consultant Cybersécurité',
    location: 'Dakar, Sénégal',
    startDate: new Date('2022-05-01'),
    endDate: new Date('2026-02-28'),
    order: 1,
    description: `
<ul>
  <li>Administration des systèmes Windows Server (Active Directory)</li>
  <li>Mise en place de solutions de supervision (Nagios, Zabbix, AlienVault)</li>
  <li>Gestion d'infrastructures cloud (OVH, VPS)</li>
  <li>Élaboration et implémentation de PCA/PRA</li>
  <li>Rédaction de politiques de sécurité conformes ISO 27001/27002</li>
</ul>`.trim(),
  },
  {
    company: 'DTS Bamako',
    role: 'Administrateur Systèmes & Réseaux',
    location: 'Bamako, Mali',
    startDate: new Date('2021-08-01'),
    endDate: new Date('2022-04-30'),
    order: 2,
    description: `
<ul>
  <li>Administration des postes utilisateurs et gestion des accès</li>
  <li>Configuration et gestion des réseaux (LAN, WAN, VLAN, Wi-Fi)</li>
  <li>Déploiement et sécurisation des infrastructures réseau</li>
  <li>Gestion des sauvegardes et des firewalls</li>
  <li>Supervision des équipements (Cisco Nexus 9300)</li>
  <li>Gestion des incidents et coordination avec les prestataires</li>
</ul>`.trim(),
  },
  {
    company: 'ONFP',
    role: 'Formateur',
    location: 'Sénégal',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    order: 3,
    description: `
<ul>
  <li>Développement Web CMS — Saint-Louis (2025)</li>
  <li>Médiation Numérique — Matam (2024)</li>
</ul>`.trim(),
  },
];

const EDUCATION = [
  {
    school: 'ESMT — École Supérieure Multinationale des Télécommunications, Dakar',
    degree: "Master en Ingénierie des Systèmes d'Information",
    field: 'Option : Sécurité des Systèmes',
    startDate: null,
    endDate: null,
    order: 1,
    description: null,
  },
  {
    school: 'ESMT Dakar',
    degree: 'Licence Professionnelle en Télécommunications & Informatique',
    field: null,
    startDate: null,
    endDate: new Date('2019-12-31'),
    order: 2,
    description: null,
  },
  {
    school: 'LMDB Bamako',
    degree: 'Baccalauréat Sciences Expérimentales',
    field: null,
    startDate: null,
    endDate: new Date('2015-12-31'),
    order: 3,
    description: null,
  },
];

/**
 * Compétences. Le niveau (1 à 5) n'est indiqué nulle part dans les CV : je ne
 * l'invente pas, toutes les entrées démarrent à 3 et sont à ajuster depuis le
 * back-office.
 */
const DEFAULT_LEVEL = 3;

const SKILL_GROUPS: Record<string, string[]> = {
  'Systèmes & administration': ['Windows Server (Active Directory)', 'Linux (Ubuntu, Kali)'],
  Réseaux: ['LAN/WAN/WLAN', 'VLAN', 'DHCP', 'DNS', 'VPN IPsec', 'MikroTik', 'Cisco Nexus'],
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
  'Data Engineering': [
    'Kafka (KRaft)',
    'Spark (Batch & Structured Streaming)',
    'Elasticsearch',
    'Kibana',
    'MLflow',
    'Power BI',
  ],
  'Cloud & virtualisation': ['Azure', 'AWS', 'VMware', 'VirtualBox'],
  Conteneurs: ['Docker', 'Docker Compose', 'Kubernetes'],
  Développement: [
    'Node.js',
    'NestJS',
    'Prisma',
    'React/Vite',
    'Laravel/FilamentPHP',
    'Python',
    'Git/GitHub',
  ],
  'Intelligence artificielle': [
    'Deep learning',
    'Fine-tuning (LLaMA 3)',
    'PyTorch',
    'RAG (bases)',
  ],
  'Gouvernance IT': ['ITIL', 'COBIT'],
};

/* ── Exécution ──────────────────────────────────────────────────────────── */

async function main() {
  console.log('Amorçage…');

  // Tags
  for (const tag of TAGS) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: { name: tag.name, kind: tag.kind },
      create: tag,
    });
  }
  console.log(`  tags           ${TAGS.length}`);

  // Projets
  for (const project of PROJECTS) {
    const { tags, status, ...data } = project;
    const publishedAt = status === 'PUBLISHED' ? new Date('2026-08-01') : null;
    const tagConnect = tags.map((slug) => ({ slug }));

    await prisma.project.upsert({
      where: { slug: project.slug },
      update: { ...data, status, publishedAt, tags: { set: tagConnect } },
      create: { ...data, status, publishedAt, tags: { connect: tagConnect } },
    });
  }
  console.log(`  projets        ${PROJECTS.length}`);

  // Série + labs
  const series = await prisma.labSeries.upsert({
    where: { slug: SERIES.slug },
    update: { title: SERIES.title, description: SERIES.description, status: SERIES.status },
    create: SERIES,
  });

  for (const lab of LABS) {
    const { tags, status, ...data } = lab;
    const publishedAt = status === 'PUBLISHED' ? new Date('2026-08-01') : null;
    const tagConnect = tags.map((slug) => ({ slug }));

    await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: { ...data, status, publishedAt, seriesId: series.id, tags: { set: tagConnect } },
      create: { ...data, status, publishedAt, seriesId: series.id, tags: { connect: tagConnect } },
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

  // Compétences
  let skillCount = 0;
  for (const [category, names] of Object.entries(SKILL_GROUPS)) {
    for (const [index, name] of names.entries()) {
      await prisma.skill.upsert({
        where: { category_name: { category, name } },
        update: { level: DEFAULT_LEVEL, order: index },
        create: { category, name, level: DEFAULT_LEVEL, order: index },
      });
      skillCount += 1;
    }
  }
  console.log(`  compétences    ${skillCount}`);

  // Réglages du site
  const settings = {
    fullName: 'Souleymane S. Sidibé',
    tagline: "Ingénieur Systèmes d'Information — data, réseaux & cybersécurité, Dakar",
    bio: `
<p>Ingénieur en Systèmes d'Information spécialisé en réseaux, cybersécurité et administration des infrastructures IT, avec une expertise étendue en data engineering (pipelines Kafka/Spark, traitement de données CDR/IMS télécoms) et en développement full-stack.</p>
<p>Doté d'un sens aigu de l'analyse et orienté résultats, je conçois et mets en œuvre des solutions performantes et conformes aux standards internationaux (ISO 27001/27002, ITIL, COBIT). Passionné par l'innovation, je m'investis dans les technologies émergentes : intelligence artificielle, data engineering temps réel et cloud computing.</p>
<p>Aucun contenu publié ici ne comporte de nom de client, de donnée réelle ni d'identifiant d'abonné. Les exemples de code et de trames sont synthétiques et signalés comme tels.</p>
`.trim(),
    email: 'souleymanesidibe1995@gmail.com',
    location: 'Dakar, Sénégal',
    // À renseigner depuis /admin/parametres quand les URL seront connues.
    socials: { linkedin: null, github: null },
    seoTitle: "Souleymane S. Sidibé — Ingénieur Systèmes d'Information",
    seoDesc:
      'Projets et labs en data engineering télécom, détection de fraude, cybersécurité et développement full-stack, depuis Dakar.',
  };

  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: settings,
    create: { id: 'singleton', ...settings },
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
