// Post service - ALL Cypher queries for Post operations
import neo4j from 'neo4j-driver';
import { getSession } from '../config/neo4j.js';
import { toNativeTypes, extractNode, isEmpty } from '../utils/neo4jHelpers.js';

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * CREATE post with relationships
 * Creates a post and connects it to author, group, topics, and hashtags
 */
export async function createPost(data) {
  const session = getSession();
  try {
    const {
      id,
      title,
      description,
      imageURL,
      isDraft,
      authorId,
      groupId,
      topicIds = [],
      hashtagIds = [],
      visibility = 'public',
      device = 'web'
    } = data;

    // Create post and CREATED relationship
    let query = `
      MATCH (author:User {id: $authorId})
      CREATE (p:Post {
        id: $id,
        title: $title,
        description: $description,
        imageURL: $imageURL,
        likesCount: 0,
        isDraft: $isDraft,
        createdAt: date($createdAt)
      })
      CREATE (author)-[created:CREATED {
        publishedAt: date($publishedAt),
        device: $device,
        visibility: $visibility
      }]->(p)
    `;

    // Add POSTED_IN relationship if groupId provided
    if (groupId) {
      query += `
        WITH p, author
        MATCH (g:Group {id: $groupId})
        CREATE (p)-[postedIn:POSTED_IN {
          createdAt: date($createdAt),
          pinned: false,
          visibility: $visibility
        }]->(g)
      `;
    }

    // Add TAGGED_WITH relationships for topics
    if (topicIds.length > 0) {
      query += `
        WITH p, author
        UNWIND $topicIds AS topicId
        MATCH (t:Topic {id: topicId})
        CREATE (p)-[tagged:TAGGED_WITH {
          relevanceScore: 1.0,
          addedAt: date($createdAt),
          source: 'manual'
        }]->(t)
      `;
    }

    // Add USES relationships for hashtags
    if (hashtagIds.length > 0) {
      query += `
        WITH p, author
        UNWIND $hashtagIds AS hashtagId
        MATCH (h:Hashtag {id: hashtagId})
        CREATE (p)-[uses:USES {
          addedAt: date($createdAt),
          source: 'manual',
          frequency: 1
        }]->(h)
        SET h.usageCount = coalesce(h.usageCount, 0) + 1
      `;
    }

    query += `
      RETURN p, author.username AS authorUsername
    `;

    const now = new Date().toISOString().split('T')[0];
    const result = await session.run(query, {
      id,
      title,
      description,
      imageURL: imageURL || '',
      isDraft: isDraft || false,
      createdAt: now,
      publishedAt: now,
      authorId,
      groupId,
      topicIds,
      hashtagIds,
      visibility,
      device
    });

    if (isEmpty(result)) {
      throw new Error('Failed to create post - author not found');
    }

    const record = result.records[0];
    return {
      post: extractNode(record, 'p'),
      authorUsername: record.get('authorUsername')
    };
  } finally {
    await session.close();
  }
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * READ single post with full details
 */
export async function getPostById(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post {id: $id})
       OPTIONAL MATCH (author:User)-[:CREATED]->(p)
       OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
       OPTIONAL MATCH (p)-[:TAGGED_WITH]->(t:Topic)
       OPTIONAL MATCH (p)-[:USES]->(h:Hashtag)
       OPTIONAL MATCH (u:User)-[:LIKES]->(p)
       OPTIONAL MATCH (c:Comment)-[:ON]->(p)
       RETURN p,
              author.username AS authorUsername,
              author.id AS authorId,
              g.name AS groupName,
              g.id AS groupId,
              collect(DISTINCT {id: t.id, name: t.name}) AS topics,
              collect(DISTINCT {id: h.id, hashtag: h.hashtag}) AS hashtags,
              count(DISTINCT u) AS likesCount,
              count(DISTINCT c) AS commentsCount`,
      { id }
    );

    if (isEmpty(result)) {
      return null;
    }

    const record = result.records[0];
    return {
      ...extractNode(record, 'p'),
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername')
      },
      group: record.get('groupId') ? {
        id: record.get('groupId'),
        name: record.get('groupName')
      } : null,
      topics: record.get('topics').filter(t => t.id !== null),
      hashtags: record.get('hashtags').filter(h => h.id !== null),
      likesCount: record.get('likesCount').toNumber(),
      commentsCount: record.get('commentsCount').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * READ many posts with filters
 */
export async function getPosts(filters = {}) {
  const session = getSession();
  try {
    const {
      groupId,
      topicId,
      hashtagId,
      authorId,
      isDraft,
      visibility,
      search,
      limit = 20,
      skip = 0
    } = filters;

    let matchClause = 'MATCH (p:Post)';
    let whereClause = [];
    let params = { limit: neo4j.int(limit), skip: neo4j.int(skip) };

    if (authorId) {
      matchClause += '\nMATCH (author:User {id: $authorId})-[:CREATED]->(p)';
      params.authorId = authorId;
    }

    if (groupId) {
      matchClause += '\nMATCH (p)-[:POSTED_IN]->(g:Group {id: $groupId})';
      params.groupId = groupId;
    }

    if (topicId) {
      matchClause += '\nMATCH (p)-[:TAGGED_WITH]->(t:Topic {id: $topicId})';
      params.topicId = topicId;
    }

    if (hashtagId) {
      matchClause += '\nMATCH (p)-[:USES]->(h:Hashtag {id: $hashtagId})';
      params.hashtagId = hashtagId;
    }

    if (isDraft !== undefined) {
      whereClause.push('p.isDraft = $isDraft');
      params.isDraft = isDraft;
    }

    if (visibility) {
      whereClause.push('EXISTS((u)-[created:CREATED]->(p)) AND created.visibility = $visibility');
      params.visibility = visibility;
    }

    if (search) {
      whereClause.push('(p.title CONTAINS $search OR p.description CONTAINS $search)');
      params.search = search;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const query = `
      ${matchClause}
      ${whereString}
      OPTIONAL MATCH (author:User)-[:CREATED]->(p)
      OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
      RETURN p,
             author.username AS authorUsername,
             author.id AS authorId,
             g.name AS groupName,
             p.likesCount AS likesCount
      ORDER BY p.createdAt DESC
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
    `;

    const result = await session.run(query, params);

    return result.records.map(record => {
      const likesCount = record.get('likesCount');
      return {
        ...extractNode(record, 'p'),
        author: {
          id: record.get('authorId'),
          username: record.get('authorUsername')
        },
        groupName: record.get('groupName'),
        likesCount: likesCount ? (typeof likesCount === 'number' ? likesCount : likesCount.toNumber()) : 0
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Aggregation - Get post statistics
 */
export async function getPostStats() {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post)
       OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
       OPTIONAL MATCH (u:User)-[:LIKES]->(p)
       RETURN 
         count(DISTINCT p) AS totalPosts,
         count(DISTINCT CASE WHEN p.isDraft = true THEN p END) AS draftPosts,
         count(DISTINCT CASE WHEN p.isDraft = false THEN p END) AS publishedPosts,
         avg(p.likesCount) AS avgLikes,
         max(p.likesCount) AS maxLikes,
         count(DISTINCT g) AS groupsWithPosts,
         sum(p.likesCount) AS totalLikes`
    );

    const record = result.records[0];
    return {
      totalPosts: record.get('totalPosts').toNumber(),
      draftPosts: record.get('draftPosts').toNumber(),
      publishedPosts: record.get('publishedPosts').toNumber(),
      avgLikes: record.get('avgLikes'),
      maxLikes: record.get('maxLikes') ? record.get('maxLikes').toNumber() : 0,
      groupsWithPosts: record.get('groupsWithPosts').toNumber(),
      totalLikes: record.get('totalLikes') ? record.get('totalLikes').toNumber() : 0
    };
  } finally {
    await session.close();
  }
}

/**
 * Get posts liked by a user
 */
export async function getLikedPostsByUser(userId, limit = 20, skip = 0) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:LIKES]->(p:Post)
       OPTIONAL MATCH (author:User)-[:CREATED]->(p)
       OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
       RETURN p, r,
              author.id AS authorId,
              author.username AS authorUsername,
              author.badge AS authorBadge,
              g.name AS groupName
       ORDER BY r.likedAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { userId, limit: neo4j.int(limit), skip: neo4j.int(skip) }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'p'),
      likedByMe: true,
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername'),
        badge: record.get('authorBadge'),
      },
      group: record.get('groupName') ? { name: record.get('groupName') } : null,
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get saved posts by a user
 */
export async function getSavedPostsByUser(userId, collectionName = null, limit = 20, skip = 0) {
  const session = getSession();
  try {
    let whereClause = '';
    const params = { userId, limit: neo4j.int(limit), skip: neo4j.int(skip) };

    if (collectionName) {
      whereClause = 'AND r.collectionName = $collectionName';
      params.collectionName = collectionName;
    }

    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:SAVED]->(p:Post)
       WHERE 1=1 ${whereClause}
       OPTIONAL MATCH (author:User)-[:CREATED]->(p)
       OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
       RETURN p, r,
              author.id AS authorId,
              author.username AS authorUsername,
              author.badge AS authorBadge,
              g.name AS groupName
       ORDER BY r.savedAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      params
    );

    return result.records.map(record => ({
      ...extractNode(record, 'p'),
      savedByMe: true,
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername'),
        badge: record.get('authorBadge'),
      },
      group: record.get('groupName') ? { name: record.get('groupName') } : null,
    }));
  } finally {
    await session.close();
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * UPDATE post properties
 */
export async function updatePost(id, props) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post {id: $id})
       SET p += $props
       RETURN p`,
      { id, props }
    );

    if (isEmpty(result)) {
      throw new Error('Post not found');
    }

    return extractNode(result.records[0], 'p');
  } finally {
    await session.close();
  }
}

/**
 * UPDATE many posts
 */
export async function bulkUpdatePosts(filter, props) {
  const session = getSession();
  try {
    let whereClause = [];
    let params = { props };

    if (filter.authorId) {
      whereClause.push('EXISTS((author:User {id: $authorId})-[:CREATED]->(p))');
      params.authorId = filter.authorId;
    }

    if (filter.groupId) {
      whereClause.push('EXISTS((p)-[:POSTED_IN]->(:Group {id: $groupId}))');
      params.groupId = filter.groupId;
    }

    if (filter.isDraft !== undefined) {
      whereClause.push('p.isDraft = $isDraft');
      params.isDraft = filter.isDraft;
    }

    if (filter.ids && filter.ids.length > 0) {
      whereClause.push('p.id IN $ids');
      params.ids = filter.ids;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (p:Post)
       ${whereString}
       SET p += $props
       RETURN count(p) AS updated`,
      params
    );

    return {
      updated: result.records[0].get('updated').toNumber()
    };
  } finally {
    await session.close();
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * DELETE single post
 */
export async function deletePost(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post {id: $id})
       DETACH DELETE p
       RETURN count(p) AS deleted`,
      { id }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}

/**
 * DELETE many posts
 */
export async function deletePosts(ids) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post)
       WHERE p.id IN $ids
       DETACH DELETE p
       RETURN count(p) AS deleted`,
      { ids }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * Get feed for a user (posts from users they follow)
 */
export async function getFeedForUser(userId, limit = 20, skip = 0) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:FOLLOWS]->(author:User)-[:CREATED]->(p:Post)
       WHERE p.isDraft = false
       OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
       RETURN p,
              author.username AS authorUsername,
              author.id AS authorId,
              g.name AS groupName,
              p.likesCount AS likesCount
       ORDER BY p.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { userId, limit, skip }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'p'),
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername')
      },
      groupName: record.get('groupName'),
      likesCount: record.get('likesCount') ? record.get('likesCount').toNumber() : 0
    }));
  } finally {
    await session.close();
  }
}

/**
 * READ posts from followed users AND joined groups (combined "Siguiendo" feed)
 * Deduplicates posts that match both conditions
 */
export async function getFollowingFeed(userId, limit = 20, skip = 0) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})
       CALL {
         WITH u
         MATCH (u)-[:FOLLOWS]->(author:User)-[:CREATED]->(p:Post)
         WHERE p.isDraft = false
         OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
         WITH u, p, author, g
         WHERE g IS NULL
            OR g.isPrivate = false
            OR EXISTS { MATCH (u)-[:MEMBER_OF]->(g) }
         RETURN p, author, g
         UNION
         WITH u
         MATCH (u)-[:FOLLOWS_HASHTAG]->(:Hashtag)<-[:USES]-(p:Post)
         WHERE p.isDraft = false
         MATCH (author:User)-[:CREATED]->(p)
         OPTIONAL MATCH (p)-[:POSTED_IN]->(g:Group)
         WITH u, p, author, g
         WHERE g IS NULL
            OR g.isPrivate = false
            OR EXISTS { MATCH (u)-[:MEMBER_OF]->(g) }
         RETURN p, author, g
       }
       WITH DISTINCT p, author, g
       ORDER BY p.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)
       RETURN p,
              author.id AS authorId,
              author.username AS authorUsername,
              author.badge AS authorBadge,
              g.name AS groupName`,
      { userId, limit, skip }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'p'),
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername'),
        badge: record.get('authorBadge'),
      },
      groupName: record.get('groupName'),
    }));
  } finally {
    await session.close();
  }
}
