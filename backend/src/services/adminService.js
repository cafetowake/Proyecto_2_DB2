// Admin service - Bulk operations, CSV loading, seeding
import { getSession } from '../config/neo4j.js';
import { toNativeTypes } from '../utils/neo4jHelpers.js';
import { faker, fakerES } from '@faker-js/faker';
import crypto from 'crypto';

// ─── Datos curados en español ────────────────────────────────────────────────

const NOMBRES_GRUPOS = [
  'Amantes del Café Guatemalteco',
  'Fotografía Urbana CDMX',
  'Programadores Hispanohablantes',
  'Viajeros de Latinoamérica',
  'Cocina Tradicional Mexicana',
  'Arte Callejero y Grafiti',
  'Emprendedores Digitales',
  'Gamers en Español',
  'Música Indie Latinoamericana',
  'Fitness y Vida Saludable',
  'Diseño Gráfico Creativo',
  'Bookclub en Castellano',
  'Ciclismo y Aventura',
  'Moda Sostenible',
  'Anime y Manga Fans',
  'Marketing Digital Hispano',
  'Fotografía de Naturaleza',
  'Startups de Guatemala',
  'Recetas Veganas y Vegetarianas',
  'Películas y Series Favoritas',
  'Historia y Cultura Maya',
  'Idiomas: Aprende y Comparte',
  'Yoga y Meditación',
  'Astronomía Aficionada',
  'Ilustración y Concept Art',
  'Criptomonedas y Finanzas',
  'Debates de Actualidad',
  'Podcasts en Español',
  'Running y Maratones',
  'Tecnología e Innovación',
  'Literatura Fantástica',
  'Jardines y Plantas de Interior',
  'Voluntariado y Causas Sociales',
  'Música Electrónica',
  'Emprendimiento Femenino',
  'Fotografía de Retratos',
  'Recetas Guatemaltecas',
  'Videojuegos Retro',
  'Arquitectura y Diseño',
  'Deportes Extremos',
  'Comunidad LGBTQ+',
  'Mascotas y Animales',
  'Noticias Tech Latinoamérica',
  'Arte Digital y NFT',
  'Salud Mental y Bienestar',
  'Freelancers Unidos',
  'Cine Independiente',
  'Makers y DIY',
  'Clima y Medio Ambiente',
  'Economía y Mercados'
];

const DESCRIPCIONES_GRUPOS = [
  'Un espacio para compartir experiencias, consejos y pasión por nuestro tema favorito.',
  'Comunidad abierta para todos los que quieren aprender y crecer juntos.',
  'Comparte tus proyectos, pide retroalimentación y conéctate con otros apasionados.',
  'Aquí celebramos nuestra cultura y compartimos lo mejor de nuestra comunidad.',
  'Grupo dedicado a explorar ideas, debatir y aprender de los demás.',
  'Un lugar seguro para crecer, compartir y hacer networking.',
  'Únete para descubrir contenido de calidad y conectar con personas afines.',
  'La comunidad hispanohablante más activa sobre este tema.',
  'Comparte tus avances, logros y retos con personas que entienden tu pasión.',
  'Aprende, inspírate y conecta con nuestra comunidad vibrante.',
];

const NOMBRES_TOPICS = [
  'Tecnología', 'Fotografía', 'Viajes', 'Gastronomía', 'Deportes',
  'Arte', 'Música', 'Cine', 'Literatura', 'Ciencia',
  'Emprendimiento', 'Salud', 'Medio Ambiente', 'Moda', 'Gaming',
  'Diseño', 'Finanzas', 'Historia', 'Astronomía', 'Idiomas',
  'Política', 'Educación', 'Fitness', 'Animales', 'Arquitectura',
  'Cocina', 'Humor', 'Filosofía', 'Religión', 'Cultura Pop',
  'Marketing', 'Programación', 'Inteligencia Artificial', 'Cripto', 'NFT',
  'Yoga', 'Meditación', 'Voluntariado', 'Sostenibilidad', 'Startups',
];

const DESCRIPCIONES_TOPICS = [
  'Todo lo relacionado con este tema apasionante.',
  'Noticias, tutoriales y debates sobre este campo.',
  'Contenido curado para entusiastas y profesionales.',
  'Explora las últimas tendencias y novedades.',
  'Recursos, comunidad y conocimiento compartido.',
];

const CATEGORIAS = ['Tecnología', 'Entretenimiento', 'Estilo de vida', 'Ciencia', 'Sociedad'];

const HASHTAGS_ES = [
  '#tecnología', '#viajes', '#fotografía', '#comida', '#arte',
  '#música', '#cine', '#deportes', '#moda', '#gaming',
  '#fitness', '#naturaleza', '#cultura', '#emprendimiento', '#diseño',
  '#guatemala', '#latinoamerica', '#mexico', '#colombia', '#españa',
  '#programación', '#startup', '#IA', '#criptomonedas', '#sustentabilidad',
  '#café', '#yoga', '#meditación', '#voluntariado', '#educación',
  '#literatura', '#astronomía', '#historia', '#cocina', '#bienestar',
  '#comunidad', '#amor', '#amistad', '#familia', '#trabajo',
  '#inspiración', '#motivación', '#creatividad', '#innovación', '#futuro',
  '#noticias', '#política', '#economía', '#ciencia', '#salud',
];

const DISPOSITIVOS = ['web', 'mobile', 'api'];
const VISIBILIDADES = ['public', 'friends', 'private'];
const REACCIONES = ['like', 'love', 'laugh', 'sad', 'angry'];
const ROLES = ['member', 'admin'];
const BADGES = ['creator', 'brand', 'public_figure'];
const FUENTES = ['manual', 'auto', 'admin'];

// ─── Helper para descripción de grupo aleatoria ──────────────────────────────
const randDesc = () => DESCRIPCIONES_GRUPOS[Math.floor(Math.random() * DESCRIPCIONES_GRUPOS.length)];
const randTopicDesc = () => DESCRIPCIONES_TOPICS[Math.floor(Math.random() * DESCRIPCIONES_TOPICS.length)];

/**
 * SEED DATABASE WITH FAKER DATA (5000+ nodes)
 * Genera un grafo social completamente conectado con datos en español
 */
export async function seedDatabase() {
  const session = getSession();
  const summary = {
    users: 0,
    verifiedUsers: 0,
    groups: 0,
    topics: 0,
    hashtags: 0,
    posts: 0,
    comments: 0,
    follows: 0,
    members: 0,
    interests: 0,
    likes: 0,
  };

  try {
    // ── 1. Usuarios (1000 regulares + 50 verificados) ──────────────────────
    console.log('Creando usuarios...');
    const users = [];
    for (let i = 0; i < 1000; i++) {
      const firstName = fakerES.person.firstName();
      const lastName = fakerES.person.lastName();
      users.push({
        id: crypto.randomUUID(),
        username: fakerES.internet.userName({ firstName, lastName }).toLowerCase().replace(/[^a-z0-9_.]/g, '_').slice(0, 20),
        email: fakerES.internet.email({ firstName, lastName }).toLowerCase(),
        biography: fakerES.helpers.arrayElement([
          `${firstName}, apasionado/a por la vida y la tecnología.`,
          `Explorando el mundo con curiosidad. ${fakerES.location.city()}`,
          `Creador/a de contenido | ${fakerES.person.jobTitle()}`,
          `"${fakerES.lorem.sentence({ min: 5, max: 10 })}"`,
          `${fakerES.person.jobTitle()} de día, ${fakerES.helpers.arrayElement(['fotógrafo', 'músico', 'escritor', 'viajero', 'cocinero'])} de noche.`,
        ]),
        isActive: fakerES.datatype.boolean(0.9),
        interests: fakerES.helpers.arrayElements(
          ['tecnología', 'deportes', 'música', 'arte', 'viajes', 'gastronomía', 'gaming', 'fotografía'],
          { min: 2, max: 5 }
        ),
        birthdate: fakerES.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        joinedAt: fakerES.date.past({ years: 3 }).toISOString().split('T')[0],
      });
    }

    const userResult = await session.run(
      `UNWIND $users AS user
       CREATE (u:User {
         id: user.id, username: user.username, email: user.email,
         biography: user.biography, isActive: user.isActive,
         interests: user.interests,
         birthdate: date(user.birthdate), joinedAt: date(user.joinedAt)
       })
       RETURN count(u) AS created`,
      { users }
    );
    summary.users = userResult.records[0].get('created').toNumber();

    // Usuarios verificados (primeros 50)
    const verifiedUsers = users.slice(0, 50).map(u => ({
      id: u.id,
      verifiedAt: new Date().toISOString().split('T')[0],
      badge: faker.helpers.arrayElement(BADGES),
    }));

    const verifiedResult = await session.run(
      `UNWIND $verified AS v
       MATCH (u:User {id: v.id})
       SET u:VerifiedUser, u.verifiedAt = date(v.verifiedAt), u.badge = v.badge
       RETURN count(u) AS created`,
      { verified: verifiedUsers }
    );
    summary.verifiedUsers = verifiedResult.records[0].get('created').toNumber();

    // ── 2. Topics (40 curados) ─────────────────────────────────────────────
    console.log('Creando topics...');
    const topics = NOMBRES_TOPICS.map(name => ({
      id: crypto.randomUUID(),
      name,
      description: randTopicDesc(),
      category: faker.helpers.arrayElement(CATEGORIAS),
      popularityScore: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
      createdAt: fakerES.date.past({ years: 2 }).toISOString().split('T')[0],
    }));

    const topicResult = await session.run(
      `UNWIND $topics AS topic
       CREATE (t:Topic {
         id: topic.id, name: topic.name, description: topic.description,
         category: topic.category, popularityScore: topic.popularityScore,
         createdAt: date(topic.createdAt)
       })
       RETURN count(t) AS created`,
      { topics }
    );
    summary.topics = topicResult.records[0].get('created').toNumber();

    // ── 3. Grupos (50 curados) ─────────────────────────────────────────────
    console.log('Creando grupos...');
    const groups = NOMBRES_GRUPOS.map(name => ({
      id: crypto.randomUUID(),
      name,
      description: randDesc(),
      isPrivate: faker.datatype.boolean(0.25),
      membersCount: 0,
      createdAt: fakerES.date.past({ years: 2 }).toISOString().split('T')[0],
    }));

    const groupResult = await session.run(
      `UNWIND $groups AS grp
       CREATE (g:Group {
         id: grp.id, name: grp.name, description: grp.description,
         isPrivate: grp.isPrivate, membersCount: grp.membersCount,
         createdAt: date(grp.createdAt)
       })
       RETURN count(g) AS created`,
      { groups }
    );
    summary.groups = groupResult.records[0].get('created').toNumber();

    // ── 4. Hashtags (50 curados) ───────────────────────────────────────────
    console.log('Creando hashtags...');
    const hashtags = HASHTAGS_ES.map(tag => ({
      id: crypto.randomUUID(),
      hashtag: tag,
      createdAt: fakerES.date.past({ years: 2 }).toISOString().split('T')[0],
      usageCount: faker.number.int({ min: 0, max: 5000 }),
      isTrending: faker.datatype.boolean(0.15),
    }));

    const hashtagResult = await session.run(
      `UNWIND $hashtags AS tag
       CREATE (h:Hashtag {
         id: tag.id, hashtag: tag.hashtag, createdAt: date(tag.createdAt),
         usageCount: tag.usageCount, isTrending: tag.isTrending
       })
       RETURN count(h) AS created`,
      { hashtags }
    );
    summary.hashtags = hashtagResult.records[0].get('created').toNumber();

    // ── 5. Posts (3000) ────────────────────────────────────────────────────
    console.log('Creando posts...');
    const posts = [];
    for (let i = 0; i < 3000; i++) {
      const authorId = faker.helpers.arrayElement(users).id;
      const groupId = faker.helpers.arrayElement(groups).id;
      posts.push({
        id: crypto.randomUUID(),
        title: fakerES.lorem.sentence({ min: 4, max: 10 }),
        description: fakerES.lorem.paragraphs({ min: 1, max: 3 }),
        imageURL: faker.datatype.boolean(0.5) ? faker.image.url() : '',
        likesCount: faker.number.int({ min: 0, max: 500 }),
        isDraft: faker.datatype.boolean(0.08),
        createdAt: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
        authorId,
        groupId,
      });
    }

    const postResult = await session.run(
      `UNWIND $posts AS post
       MATCH (author:User {id: post.authorId}), (g:Group {id: post.groupId})
       CREATE (p:Post {
         id: post.id, title: post.title, description: post.description,
         imageURL: post.imageURL, likesCount: post.likesCount,
         isDraft: post.isDraft, createdAt: date(post.createdAt)
       })
       CREATE (author)-[:CREATED {
         publishedAt: date(post.createdAt),
         device: 'web', visibility: 'public'
       }]->(p)
       CREATE (p)-[:POSTED_IN {
         createdAt: date(post.createdAt), pinned: false, visibility: 'public'
       }]->(g)
       RETURN count(p) AS created`,
      { posts }
    );
    summary.posts = postResult.records[0].get('created').toNumber();

    // ── 6. Comments (2000) ─────────────────────────────────────────────────
    console.log('Creando comentarios...');
    const comments = [];
    for (let i = 0; i < 2000; i++) {
      comments.push({
        id: crypto.randomUUID(),
        content: fakerES.lorem.sentences({ min: 1, max: 3 }),
        likesCount: faker.number.int({ min: 0, max: 100 }),
        repliesCount: 0,
        isEdited: faker.datatype.boolean(0.1),
        createdAt: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
        authorId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
      });
    }

    const commentResult = await session.run(
      `UNWIND $comments AS c
       MATCH (author:User {id: c.authorId}), (p:Post {id: c.postId})
       CREATE (cm:Comment {
         id: c.id, content: c.content, likesCount: c.likesCount,
         repliesCount: c.repliesCount, isEdited: c.isEdited,
         createdAt: date(c.createdAt)
       })
       CREATE (author)-[:WROTE { createdAt: date(c.createdAt), device: 'web' }]->(cm)
       CREATE (cm)-[:ON {
         createdAt: date(c.createdAt), isMainComment: true, relevanceScore: rand()
       }]->(p)
       RETURN count(cm) AS created`,
      { comments }
    );
    summary.comments = commentResult.records[0].get('created').toNumber();

    // ── 7. FOLLOWS (5000) ──────────────────────────────────────────────────
    console.log('Creando relaciones de seguimiento...');
    const follows = [];
    for (let i = 0; i < 5000; i++) {
      const follower = faker.helpers.arrayElement(users);
      const followed = faker.helpers.arrayElement(users.filter(u => u.id !== follower.id));
      follows.push({
        followerId: follower.id,
        followedId: followed.id,
        since: fakerES.date.past({ years: 2 }).toISOString().split('T')[0],
        isCloseFriend: faker.datatype.boolean(0.15),
        interactionScore: faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
      });
    }

    const followResult = await session.run(
      `UNWIND $follows AS f
       MATCH (a:User {id: f.followerId}), (b:User {id: f.followedId})
       MERGE (a)-[r:FOLLOWS]->(b)
       SET r.since = date(f.since),
           r.isCloseFriend = f.isCloseFriend,
           r.interactionScore = f.interactionScore
       RETURN count(r) AS created`,
      { follows }
    );
    summary.follows = followResult.records[0].get('created').toNumber();

    // ── 8. MEMBER_OF (1500 — garantiza grafo conexo) ───────────────────────
    console.log('Creando membresías...');

    // Primero asegurar que TODOS los usuarios tengan al menos 1 grupo (grafo conexo)
    const mandatoryMembers = users.map(u => ({
      userId: u.id,
      groupId: faker.helpers.arrayElement(groups).id,
      joinedAt: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
      role: 'member',
      permissions: ['read', 'write'],
    }));

    // Luego membresías adicionales aleatorias
    const extraMembers = [];
    for (let i = 0; i < 500; i++) {
      extraMembers.push({
        userId: faker.helpers.arrayElement(users).id,
        groupId: faker.helpers.arrayElement(groups).id,
        joinedAt: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
        role: faker.helpers.arrayElement(ROLES),
        permissions: faker.helpers.arrayElement([['read', 'write'], ['read'], ['read', 'write', 'delete_users']]),
      });
    }

    const allMembers = [...mandatoryMembers, ...extraMembers];
    const memberResult = await session.run(
      `UNWIND $members AS m
       MATCH (u:User {id: m.userId}), (g:Group {id: m.groupId})
       MERGE (u)-[r:MEMBER_OF]->(g)
       SET r.joinedAt = date(m.joinedAt), r.role = m.role, r.permissions = m.permissions
       RETURN count(r) AS created`,
      { members: allMembers }
    );
    summary.members = memberResult.records[0].get('created').toNumber();

    // ── 9. INTERESTED_IN (1500) ────────────────────────────────────────────
    console.log('Creando intereses...');
    const interests = [];
    for (let i = 0; i < 1500; i++) {
      interests.push({
        userId: faker.helpers.arrayElement(users).id,
        topicId: faker.helpers.arrayElement(topics).id,
        since: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
        level: faker.number.int({ min: 1, max: 5 }),
        isPrimary: faker.datatype.boolean(0.3),
      });
    }

    const interestResult = await session.run(
      `UNWIND $interests AS i
       MATCH (u:User {id: i.userId}), (t:Topic {id: i.topicId})
       MERGE (u)-[r:INTERESTED_IN]->(t)
       SET r.since = date(i.since), r.level = i.level, r.isPrimary = i.isPrimary
       RETURN count(r) AS created`,
      { interests }
    );
    summary.interests = interestResult.records[0].get('created').toNumber();

    // ── 10. LIKES (8000) ───────────────────────────────────────────────────
    console.log('Creando likes...');
    const likes = [];
    for (let i = 0; i < 8000; i++) {
      likes.push({
        userId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
        likedAt: fakerES.date.recent({ days: 180 }).toISOString().split('T')[0],
        reactionType: faker.helpers.arrayElement(REACCIONES),
        weight: faker.number.float({ min: 0.5, max: 1.5, fractionDigits: 2 }),
      });
    }

    const likeResult = await session.run(
      `UNWIND $likes AS l
       MATCH (u:User {id: l.userId}), (p:Post {id: l.postId})
       MERGE (u)-[r:LIKES]->(p)
       SET r.likedAt = date(l.likedAt), r.reactionType = l.reactionType, r.weight = l.weight
       RETURN count(r) AS created`,
      { likes }
    );
    summary.likes = likeResult.records[0].get('created').toNumber();

    // ── 11. FOCUSES_ON: cada grupo con al menos 1 topic ───────────────────
    console.log('Vinculando grupos con topics...');
    const groupTopics = groups.flatMap(g => {
      const numTopics = faker.number.int({ min: 1, max: 3 });
      return faker.helpers.arrayElements(topics, numTopics).map(t => ({
        groupId: g.id,
        topicId: t.id,
        since: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
        weight: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
        curatedBy: faker.helpers.arrayElement(users).username,
      }));
    });

    await session.run(
      `UNWIND $gt AS gt
       MATCH (g:Group {id: gt.groupId}), (t:Topic {id: gt.topicId})
       MERGE (g)-[r:FOCUSES_ON]->(t)
       SET r.since = date(gt.since), r.weight = gt.weight, r.curatedBy = gt.curatedBy`,
      { gt: groupTopics }
    );

    // ── 12. TAGGED_WITH: posts con topics ─────────────────────────────────
    console.log('Etiquetando posts con topics...');
    const postTopics = faker.helpers.arrayElements(posts, 1000).map(p => ({
      postId: p.id,
      topicId: faker.helpers.arrayElement(topics).id,
      relevanceScore: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
      addedAt: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
      source: faker.helpers.arrayElement(FUENTES),
    }));

    await session.run(
      `UNWIND $pt AS pt
       MATCH (p:Post {id: pt.postId}), (t:Topic {id: pt.topicId})
       MERGE (p)-[r:TAGGED_WITH]->(t)
       SET r.relevanceScore = pt.relevanceScore, r.addedAt = date(pt.addedAt), r.source = pt.source`,
      { pt: postTopics }
    );

    // ── 13. USES: posts con hashtags ───────────────────────────────────────
    console.log('Vinculando posts con hashtags...');
    const postHashtags = faker.helpers.arrayElements(posts, 1500).map(p => ({
      postId: p.id,
      hashtagId: faker.helpers.arrayElement(hashtags).id,
      addedAt: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
      source: faker.helpers.arrayElement(['manual', 'auto']),
      frequency: faker.number.int({ min: 1, max: 10 }),
    }));

    await session.run(
      `UNWIND $ph AS ph
       MATCH (p:Post {id: ph.postId}), (h:Hashtag {id: ph.hashtagId})
       MERGE (p)-[r:USES]->(h)
       SET r.addedAt = date(ph.addedAt), r.source = ph.source, r.frequency = ph.frequency`,
      { ph: postHashtags }
    );

    // ── 14. FOLLOWS_HASHTAG ────────────────────────────────────────────────
    console.log('Creando seguimiento de hashtags...');
    const userHashtags = [];
    for (let i = 0; i < 1000; i++) {
      userHashtags.push({
        userId: faker.helpers.arrayElement(users).id,
        hashtagId: faker.helpers.arrayElement(hashtags).id,
        since: fakerES.date.past({ years: 1 }).toISOString().split('T')[0],
        notificationsEnabled: faker.datatype.boolean(0.6),
        interestLevel: faker.number.int({ min: 1, max: 5 }),
      });
    }

    await session.run(
      `UNWIND $uh AS uh
       MATCH (u:User {id: uh.userId}), (h:Hashtag {id: uh.hashtagId})
       MERGE (u)-[r:FOLLOWS_HASHTAG]->(h)
       SET r.since = date(uh.since),
           r.notificationsEnabled = uh.notificationsEnabled,
           r.interestLevel = uh.interestLevel`,
      { uh: userHashtags }
    );

    console.log('Seeding completado!');
    return summary;
  } finally {
    await session.close();
  }
}

// ─── Las funciones de carga CSV permanecen igual ─────────────────────────────

export async function loadUsersFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MERGE (u:User {id: row.id})
         SET u.username = row.username, u.email = row.email,
             u.biography = row.biography,
             u.isActive = toBoolean(row.isActive),
             u.interests = split(row.interests, '|'),
             u.birthdate = date(row.birthdate),
             u.joinedAt = date(row.joinedAt)
         RETURN count(u) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadPostsFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MATCH (author:User {id: row.authorId})
         MERGE (p:Post {id: row.id})
         SET p.title = row.title, p.description = row.description,
             p.imageURL = row.imageURL,
             p.likesCount = toInteger(row.likesCount),
             p.isDraft = toBoolean(row.isDraft),
             p.createdAt = date(row.createdAt)
         MERGE (author)-[:CREATED {
           publishedAt: date(row.createdAt),
           device: coalesce(row.device, 'web'),
           visibility: coalesce(row.visibility, 'public')
         }]->(p)
         WITH p, row
         WHERE row.groupId IS NOT NULL
         MATCH (g:Group {id: row.groupId})
         MERGE (p)-[:POSTED_IN {
           createdAt: date(row.createdAt), pinned: false,
           visibility: coalesce(row.visibility, 'public')
         }]->(g)
         RETURN count(p) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadGroupsFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MERGE (g:Group {id: row.id})
         SET g.name = row.name, g.description = row.description,
             g.isPrivate = toBoolean(row.isPrivate),
             g.membersCount = toInteger(row.membersCount),
             g.createdAt = date(row.createdAt)
         RETURN count(g) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadTopicsFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MERGE (t:Topic {id: row.id})
         SET t.name = row.name, t.description = row.description,
             t.category = row.category,
             t.popularityScore = toFloat(row.popularityScore),
             t.createdAt = date(row.createdAt)
         RETURN count(t) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadHashtagsFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MERGE (h:Hashtag {id: row.id})
         SET h.hashtag = row.hashtag, h.createdAt = date(row.createdAt),
             h.usageCount = toInteger(row.usageCount),
             h.isTrending = toBoolean(row.isTrending)
         RETURN count(h) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadFollowsFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MATCH (a:User {id: row.followerId}), (b:User {id: row.followedId})
         MERGE (a)-[r:FOLLOWS]->(b)
         SET r.since = date(row.since),
             r.isCloseFriend = toBoolean(row.isCloseFriend),
             r.interactionScore = toFloat(row.interactionScore)
         RETURN count(r) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadLikesFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MATCH (u:User {id: row.userId}), (p:Post {id: row.postId})
         MERGE (u)-[r:LIKES]->(p)
         SET r.likedAt = date(row.likedAt),
             r.reactionType = row.reactionType,
             r.weight = toFloat(row.weight)
         RETURN count(r) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadMembersFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MATCH (u:User {id: row.userId}), (g:Group {id: row.groupId})
         MERGE (u)-[r:MEMBER_OF]->(g)
         SET r.joinedAt = date(row.joinedAt),
             r.role = row.role,
             r.permissions = split(row.permissions, '|')
         RETURN count(r) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadFollowsHashtagFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MATCH (u:User {id: row.userId}), (h:Hashtag {id: row.hashtagId})
         MERGE (u)-[r:FOLLOWS_HASHTAG]->(h)
         SET r.since = date(row.since),
             r.notificationsEnabled = toBoolean(row.notificationsEnabled),
             r.interestLevel = toInteger(row.interestLevel)
         RETURN count(r) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}

export async function loadTaggedWithFromCSV(records) {
  const session = getSession();
  try {
    let created = 0;
    const batchSize = 500;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const result = await session.run(
        `UNWIND $batch AS row
         MATCH (p:Post {id: row.postId}), (t:Topic {id: row.topicId})
         MERGE (p)-[r:TAGGED_WITH]->(t)
         SET r.relevanceScore = toFloat(row.relevanceScore),
             r.addedAt = date(row.addedAt),
             r.source = row.source
         RETURN count(r) AS created`,
        { batch }
      );
      created += result.records[0].get('created').toNumber();
    }
    return { created, total: records.length };
  } finally {
    await session.close();
  }
}