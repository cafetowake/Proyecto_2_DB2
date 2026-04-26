// Admin service - Bulk operations, CSV loading, seeding
import { getSession } from '../config/neo4j.js';
import { toNativeTypes } from '../utils/neo4jHelpers.js';
import { faker } from '@faker-js/faker';
import crypto from 'crypto';

/**
 * SEED DATABASE WITH FAKER DATA (5000+ nodes)
 * This generates a fully connected social graph
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
    likes: 0
  };

  try {
    // 1. Create Users (1000 regular + 50 verified)
    console.log('Creating users...');
    const users = [];
    for (let i = 0; i < 1000; i++) {
      users.push({
        id: crypto.randomUUID(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        biography: faker.person.bio(),
        isActive: faker.datatype.boolean(0.9),
        interests: faker.helpers.arrayElements(
          ['technology', 'sports', 'music', 'art', 'travel', 'food', 'gaming', 'photography'],
          { min: 2, max: 5 }
        ),
        birthdate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        joinedAt: faker.date.past({ years: 3 }).toISOString().split('T')[0]
      });
    }

    const userResult = await session.run(
      `UNWIND $users AS user
       CREATE (u:User {
         id: user.id,
         username: user.username,
         email: user.email,
         biography: user.biography,
         isActive: user.isActive,
         interests: user.interests,
         birthdate: date(user.birthdate),
         joinedAt: date(user.joinedAt)
       })
       RETURN count(u) AS created`,
      { users }
    );
    summary.users = userResult.records[0].get('created').toNumber();

    // Create verified users
    const verifiedUsers = users.slice(0, 50).map(u => ({
      id: u.id,
      verifiedAt: new Date().toISOString().split('T')[0],
      badge: faker.helpers.arrayElement(['creator', 'brand', 'public_figure'])
    }));

    const verifiedResult = await session.run(
      `UNWIND $verified AS v
       MATCH (u:User {id: v.id})
       SET u:VerifiedUser,
           u.verifiedAt = date(v.verifiedAt),
           u.badge = v.badge
       RETURN count(u) AS created`,
      { verified: verifiedUsers }
    );
    summary.verifiedUsers = verifiedResult.records[0].get('created').toNumber();

    // 2. Create Topics (200)
    console.log('Creating topics...');
    const topics = [];
    for (let i = 0; i < 200; i++) {
      topics.push({
        id: crypto.randomUUID(),
        name: faker.company.buzzNoun(),
        description: faker.company.catchPhrase(),
        category: faker.helpers.arrayElement(['Technology', 'Sports', 'Entertainment', 'Science', 'Business']),
        popularityScore: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
        createdAt: faker.date.past({ years: 2 }).toISOString().split('T')[0]
      });
    }

    const topicResult = await session.run(
      `UNWIND $topics AS topic
       CREATE (t:Topic {
         id: topic.id,
         name: topic.name,
         description: topic.description,
         category: topic.category,
         popularityScore: topic.popularityScore,
         createdAt: date(topic.createdAt)
       })
       RETURN count(t) AS created`,
      { topics }
    );
    summary.topics = topicResult.records[0].get('created').toNumber();

    // 3. Create Groups (100)
    console.log('Creating groups...');
    const groups = [];
    for (let i = 0; i < 100; i++) {
      groups.push({
        id: crypto.randomUUID(),
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        isPrivate: faker.datatype.boolean(0.3),
        membersCount: 0,
        createdAt: faker.date.past({ years: 2 }).toISOString().split('T')[0]
      });
    }

    const groupResult = await session.run(
      `UNWIND $groups AS grp
       CREATE (g:Group {
         id: grp.id,
         name: grp.name,
         description: grp.description,
         isPrivate: grp.isPrivate,
         membersCount: grp.membersCount,
         createdAt: date(grp.createdAt)
       })
       RETURN count(g) AS created`,
      { groups }
    );
    summary.groups = groupResult.records[0].get('created').toNumber();

    // 4. Create Hashtags (300)
    console.log('Creating hashtags...');
    const hashtags = [];
    for (let i = 0; i < 300; i++) {
      hashtags.push({
        id: crypto.randomUUID(),
        hashtag: `#${faker.word.noun()}`,
        createdAt: faker.date.past({ years: 2 }).toISOString().split('T')[0],
        usageCount: faker.number.int({ min: 0, max: 1000 }),
        isTrending: faker.datatype.boolean(0.1)
      });
    }

    const hashtagResult = await session.run(
      `UNWIND $hashtags AS tag
       CREATE (h:Hashtag {
         id: tag.id,
         hashtag: tag.hashtag,
         createdAt: date(tag.createdAt),
         usageCount: tag.usageCount,
         isTrending: tag.isTrending
       })
       RETURN count(h) AS created`,
      { hashtags }
    );
    summary.hashtags = hashtagResult.records[0].get('created').toNumber();

    // 5. Create Posts (3000)
    console.log('Creating posts...');
    const posts = [];
    for (let i = 0; i < 3000; i++) {
      const authorId = faker.helpers.arrayElement(users).id;
      const groupId = faker.helpers.arrayElement(groups).id;

      posts.push({
        id: crypto.randomUUID(),
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraphs(2),
        imageURL: faker.datatype.boolean(0.5) ? faker.image.url() : '',
        likesCount: faker.number.int({ min: 0, max: 500 }),
        isDraft: faker.datatype.boolean(0.1),
        createdAt: faker.date.past({ years: 1 }).toISOString().split('T')[0],
        authorId,
        groupId
      });
    }

    const postResult = await session.run(
      `UNWIND $posts AS post
       MATCH (author:User {id: post.authorId}), (g:Group {id: post.groupId})
       CREATE (p:Post {
         id: post.id,
         title: post.title,
         description: post.description,
         imageURL: post.imageURL,
         likesCount: post.likesCount,
         isDraft: post.isDraft,
         createdAt: date(post.createdAt)
       })
       CREATE (author)-[:CREATED {
         publishedAt: date(post.createdAt),
         device: 'web',
         visibility: 'public'
       }]->(p)
       CREATE (p)-[:POSTED_IN {
         createdAt: date(post.createdAt),
         pinned: false,
         visibility: 'public'
       }]->(g)
       RETURN count(p) AS created`,
      { posts }
    );
    summary.posts = postResult.records[0].get('created').toNumber();

    // 6. Create FOLLOWS relationships (5000)
    console.log('Creating follow relationships...');
    const follows = [];
    for (let i = 0; i < 5000; i++) {
      const follower = faker.helpers.arrayElement(users);
      const followed = faker.helpers.arrayElement(users.filter(u => u.id !== follower.id));

      follows.push({
        followerId: follower.id,
        followedId: followed.id,
        since: faker.date.past({ years: 2 }).toISOString().split('T')[0],
        isCloseFriend: faker.datatype.boolean(0.2),
        interactionScore: faker.number.float({ min: 0, max: 1, precision: 0.01 })
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

    // 7. Create MEMBER_OF relationships (800)
    console.log('Creating group memberships...');
    const members = [];
    for (let i = 0; i < 800; i++) {
      members.push({
        userId: faker.helpers.arrayElement(users).id,
        groupId: faker.helpers.arrayElement(groups).id,
        joinedAt: faker.date.past({ years: 1 }).toISOString().split('T')[0],
        role: faker.helpers.arrayElement(['member', 'admin']),
        permissions: ['read', 'post']
      });
    }

    const memberResult = await session.run(
      `UNWIND $members AS m
       MATCH (u:User {id: m.userId}), (g:Group {id: m.groupId})
       MERGE (u)-[r:MEMBER_OF]->(g)
       SET r.joinedAt = date(m.joinedAt),
           r.role = m.role,
           r.permissions = m.permissions
       RETURN count(r) AS created`,
      { members }
    );
    summary.members = memberResult.records[0].get('created').toNumber();

    // 8. Create INTERESTED_IN relationships (1500)
    console.log('Creating user interests...');
    const interests = [];
    for (let i = 0; i < 1500; i++) {
      interests.push({
        userId: faker.helpers.arrayElement(users).id,
        topicId: faker.helpers.arrayElement(topics).id,
        since: faker.date.past({ years: 1 }).toISOString().split('T')[0],
        level: faker.number.int({ min: 1, max: 5 }),
        isPrimary: faker.datatype.boolean(0.3)
      });
    }

    const interestResult = await session.run(
      `UNWIND $interests AS i
       MATCH (u:User {id: i.userId}), (t:Topic {id: i.topicId})
       MERGE (u)-[r:INTERESTED_IN]->(t)
       SET r.since = date(i.since),
           r.level = i.level,
           r.isPrimary = i.isPrimary
       RETURN count(r) AS created`,
      { interests }
    );
    summary.interests = interestResult.records[0].get('created').toNumber();

    // 9. Create LIKES relationships (8000)
    console.log('Creating likes...');
    const likes = [];
    for (let i = 0; i < 8000; i++) {
      likes.push({
        userId: faker.helpers.arrayElement(users).id,
        postId: faker.helpers.arrayElement(posts).id,
        likedAt: faker.date.recent({ days: 180 }).toISOString().split('T')[0],
        reactionType: faker.helpers.arrayElement(['like', 'love', 'laugh', 'sad', 'angry']),
        weight: faker.number.float({ min: 0.5, max: 1.5, precision: 0.1 })
      });
    }

    const likeResult = await session.run(
      `UNWIND $likes AS l
       MATCH (u:User {id: l.userId}), (p:Post {id: l.postId})
       MERGE (u)-[r:LIKES]->(p)
       SET r.likedAt = date(l.likedAt),
           r.reactionType = l.reactionType,
           r.weight = l.weight
       RETURN count(r) AS created`,
      { likes }
    );
    summary.likes = likeResult.records[0].get('created').toNumber();

    console.log('Database seeding complete!');
    return summary;
  } finally {
    await session.close();
  }
}

/**
 * LOAD USERS FROM CSV BUFFER
 * @param {Array} records - parsed CSV records [{id, username, email, ...}, ...]
 */
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
         SET u.username = row.username,
             u.email = row.email,
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

/**
 * LOAD POSTS FROM CSV BUFFER
 */
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
         SET p.title = row.title,
             p.description = row.description,
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
           createdAt: date(row.createdAt),
           pinned: false,
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

/**
 * LOAD GROUPS FROM CSV BUFFER
 */
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
         SET g.name = row.name,
             g.description = row.description,
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

/**
 * LOAD TOPICS FROM CSV BUFFER
 */
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
         SET t.name = row.name,
             t.description = row.description,
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

/**
 * LOAD HASHTAGS FROM CSV BUFFER
 */
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
         SET h.hashtag = row.hashtag,
             h.createdAt = date(row.createdAt),
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

/**
 * LOAD FOLLOWS RELATIONSHIPS FROM CSV
 */
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

/**
 * LOAD LIKES RELATIONSHIPS FROM CSV
 */
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

/**
 * LOAD MEMBER_OF RELATIONSHIPS FROM CSV
 */
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
