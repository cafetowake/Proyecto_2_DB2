// Topic service - ALL Cypher queries for Topic operations
import neo4j from 'neo4j-driver';
import { getSession } from '../config/neo4j.js';
import { toNativeTypes, extractNode, isEmpty } from '../utils/neo4jHelpers.js';

/**
 * CREATE topic
 */
export async function createTopic(data) {
  const session = getSession();
  try {
    const result = await session.run(
      `CREATE (t:Topic {
        id: $id,
        name: $name,
        description: $description,
        category: $category,
        popularityScore: $popularityScore,
        createdAt: date($createdAt)
      })
      RETURN t`,
      {
        id: data.id,
        name: data.name,
        description: data.description || '',
        category: data.category || 'General',
        popularityScore: data.popularityScore || 0.0,
        createdAt: data.createdAt || new Date().toISOString().split('T')[0]
      }
    );

    if (isEmpty(result)) {
      throw new Error('Failed to create topic');
    }

    return extractNode(result.records[0], 't');
  } finally {
    await session.close();
  }
}

/**
 * READ single topic
 */
export async function getTopicById(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (t:Topic {id: $id})
       OPTIONAL MATCH (u:User)-[:INTERESTED_IN]->(t)
       OPTIONAL MATCH (p:Post)-[:TAGGED_WITH]->(t)
       OPTIONAL MATCH (g:Group)-[:FOCUSES_ON]->(t)
       RETURN t,
              count(DISTINCT u) AS followersCount,
              count(DISTINCT p) AS postsCount,
              count(DISTINCT g) AS groupsCount`,
      { id }
    );

    if (isEmpty(result)) {
      return null;
    }

    const record = result.records[0];
    return {
      ...extractNode(record, 't'),
      followersCount: record.get('followersCount').toNumber(),
      postsCount: record.get('postsCount').toNumber(),
      groupsCount: record.get('groupsCount').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * READ many topics
 */
export async function getTopics(filters = {}) {
  const session = getSession();
  try {
    const { category, search, minPopularity, limit = 20, skip = 0 } = filters;

    let whereClause = [];
    let params = { limit: neo4j.int(limit), skip: neo4j.int(skip) };

    if (category) {
      whereClause.push('t.category = $category');
      params.category = category;
    }

    if (search) {
      whereClause.push('(t.name CONTAINS $search OR t.description CONTAINS $search)');
      params.search = search;
    }

    if (minPopularity !== undefined) {
      whereClause.push('t.popularityScore >= $minPopularity');
      params.minPopularity = minPopularity;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (t:Topic)
       ${whereString}
       OPTIONAL MATCH (u:User)-[:INTERESTED_IN]->(t)
       OPTIONAL MATCH (p:Post)-[:TAGGED_WITH]->(t)
       RETURN t,
              count(DISTINCT u) AS followersCount,
              count(DISTINCT p) AS postsCount
       ORDER BY t.popularityScore DESC, t.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      params
    );

    return result.records.map(record => ({
      ...extractNode(record, 't'),
      followersCount: record.get('followersCount').toNumber(),
      postsCount: record.get('postsCount').toNumber()
    }));
  } finally {
    await session.close();
  }
}

/**
 * READ posts tagged with topic
 */
export async function getTopicPosts(topicId, limit = 20, skip = 0) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post)-[r:TAGGED_WITH]->(t:Topic {id: $topicId})
       WHERE p.isDraft = false
       OPTIONAL MATCH (author:User)-[:CREATED]->(p)
       RETURN p, r,
              author.username AS authorUsername,
              author.id AS authorId
       ORDER BY r.relevanceScore DESC, p.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { topicId, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'p'),
      relevanceScore: toNativeTypes(record.get('r').properties).relevanceScore,
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
 * READ topic followers
 */
export async function getTopicFollowers(topicId, limit = 50) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User)-[r:INTERESTED_IN]->(t:Topic {id: $topicId})
       RETURN u, r, labels(u) AS labels
       ORDER BY r.level DESC, r.since DESC
       LIMIT toInteger($limit)`,
      { topicId, limit }
    );

    return result.records.map(record => ({
      user: toNativeTypes(record.get('u').properties),
      interest: toNativeTypes(record.get('r').properties),
      labels: record.get('labels')
    }));
  } finally {
    await session.close();
  }
}

/**
 * UPDATE topic
 */
export async function updateTopic(id, props) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (t:Topic {id: $id})
       SET t += $props
       RETURN t`,
      { id, props }
    );

    if (isEmpty(result)) {
      throw new Error('Topic not found');
    }

    return extractNode(result.records[0], 't');
  } finally {
    await session.close();
  }
}

/**
 * DELETE topic
 */
export async function deleteTopic(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (t:Topic {id: $id})
       DETACH DELETE t
       RETURN count(t) AS deleted`,
      { id }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}
