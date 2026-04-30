// Hashtag service - ALL Cypher queries for Hashtag operations
import neo4j from 'neo4j-driver';
import { getSession } from '../config/neo4j.js';
import { toNativeTypes, extractNode, isEmpty } from '../utils/neo4jHelpers.js';

/**
 * CREATE hashtag
 */
export async function createHashtag(data) {
  const session = getSession();
  try {
    const result = await session.run(
      `CREATE (h:Hashtag {
        id: $id,
        hashtag: $hashtag,
        createdAt: date($createdAt),
        usageCount: $usageCount,
        isTrending: $isTrending
      })
      RETURN h`,
      {
        id: data.id,
        hashtag: data.hashtag,
        createdAt: data.createdAt || new Date().toISOString().split('T')[0],
        usageCount: data.usageCount || 0,
        isTrending: data.isTrending || false
      }
    );

    if (isEmpty(result)) {
      throw new Error('Failed to create hashtag');
    }

    return extractNode(result.records[0], 'h');
  } finally {
    await session.close();
  }
}

/**
 * READ single hashtag
 */
export async function getHashtagById(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (h:Hashtag {id: $id})
       OPTIONAL MATCH (p:Post)-[:USES]->(h)
       OPTIONAL MATCH (u:User)-[:FOLLOWS_HASHTAG]->(h)
       RETURN h,
              count(DISTINCT p) AS postsCount,
              count(DISTINCT u) AS followersCount`,
      { id }
    );

    if (isEmpty(result)) {
      return null;
    }

    const record = result.records[0];
    return {
      ...extractNode(record, 'h'),
      postsCount: record.get('postsCount').toNumber(),
      followersCount: record.get('followersCount').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * READ hashtag by text (for MERGE operations)
 */
export async function getHashtagByText(hashtag) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (h:Hashtag {hashtag: $hashtag})
       RETURN h`,
      { hashtag }
    );

    if (isEmpty(result)) {
      return null;
    }

    return extractNode(result.records[0], 'h');
  } finally {
    await session.close();
  }
}

/**
 * READ many hashtags (trending, etc.)
 */
export async function getHashtags(filters = {}) {
  const session = getSession();
  try {
    const { isTrending, search, minUsage, limit = 20, skip = 0 } = filters;

    let whereClause = [];
    let params = { limit: neo4j.int(limit), skip: neo4j.int(skip) };

    if (isTrending !== undefined) {
      whereClause.push('h.isTrending = $isTrending');
      params.isTrending = isTrending;
    }

    if (search) {
      whereClause.push('h.hashtag CONTAINS $search');
      params.search = search;
    }

    if (minUsage !== undefined) {
      whereClause.push('h.usageCount >= $minUsage');
      params.minUsage = minUsage;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (h:Hashtag)
       ${whereString}
       OPTIONAL MATCH (p:Post)-[:USES]->(h)
       OPTIONAL MATCH (u:User)-[:FOLLOWS_HASHTAG]->(h)
       RETURN h,
              count(DISTINCT p) AS postsCount,
              count(DISTINCT u) AS followersCount
       ORDER BY h.usageCount DESC, h.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      params
    );

    return result.records.map(record => ({
      ...extractNode(record, 'h'),
      postsCount: record.get('postsCount').toNumber(),
      followersCount: record.get('followersCount').toNumber()
    }));
  } finally {
    await session.close();
  }
}

/**
 * READ trending hashtags
 */
export async function getTrendingHashtags(limit = 10) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (h:Hashtag)
       WHERE h.isTrending = true
       OPTIONAL MATCH (p:Post)-[:USES]->(h)
       RETURN h, count(p) AS postsCount
       ORDER BY h.usageCount DESC
       LIMIT toInteger($limit)`,
      { limit: neo4j.int(limit) }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'h'),
      postsCount: record.get('postsCount').toNumber()
    }));
  } finally {
    await session.close();
  }
}

/**
 * READ posts using hashtag
 */
export async function getHashtagPosts(hashtagId, limit = 20, skip = 0) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post)-[r:USES]->(h:Hashtag {id: $hashtagId})
       WHERE p.isDraft = false
       OPTIONAL MATCH (author:User)-[:CREATED]->(p)
       RETURN p, r,
              author.username AS authorUsername,
              author.id AS authorId
       ORDER BY r.addedAt DESC, p.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { hashtagId, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'p'),
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername')
      }
    }));
  } finally {
    await session.close();
  }
}

/**
 * UPDATE hashtag
 */
export async function updateHashtag(id, props) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (h:Hashtag {id: $id})
       SET h += $props
       RETURN h`,
      { id, props }
    );

    if (isEmpty(result)) {
      throw new Error('Hashtag not found');
    }

    return extractNode(result.records[0], 'h');
  } finally {
    await session.close();
  }
}

/**
 * MERGE or increment hashtag (for auto-creation from posts)
 */
export async function mergeHashtag(hashtag) {
  const session = getSession();
  try {
    const result = await session.run(
      `MERGE (h:Hashtag {hashtag: $hashtag})
       ON CREATE SET
         h.id = randomUUID(),
         h.createdAt = date(),
         h.usageCount = 0,
         h.isTrending = false
       RETURN h`,
      { hashtag }
    );

    return extractNode(result.records[0], 'h');
  } finally {
    await session.close();
  }
}

/**
 * DELETE hashtag
 */
export async function deleteHashtag(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (h:Hashtag {id: $id})
       DETACH DELETE h
       RETURN count(h) AS deleted`,
      { id }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}
