// Group service - ALL Cypher queries for Group operations
import neo4j from 'neo4j-driver';
import { getSession } from '../config/neo4j.js';
import { toNativeTypes, extractNode, isEmpty } from '../utils/neo4jHelpers.js';

/**
 * CREATE group
 */
export async function createGroup(data) {
  const session = getSession();
  try {
    const result = await session.run(
      `CREATE (g:Group {
        id: $id,
        name: $name,
        description: $description,
        isPrivate: $isPrivate,
        membersCount: 0,
        createdAt: date($createdAt)
      })
      RETURN g`,
      {
        id: data.id,
        name: data.name,
        description: data.description || '',
        isPrivate: data.isPrivate || false,
        createdAt: data.createdAt || new Date().toISOString().split('T')[0]
      }
    );

    if (isEmpty(result)) {
      throw new Error('Failed to create group');
    }

    return extractNode(result.records[0], 'g');
  } finally {
    await session.close();
  }
}

/**
 * READ single group
 */
export async function getGroupById(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (g:Group {id: $id})
       OPTIONAL MATCH (u:User)-[:MEMBER_OF]->(g)
       OPTIONAL MATCH (p:Post)-[:POSTED_IN]->(g)
       OPTIONAL MATCH (g)-[:FOCUSES_ON]->(t:Topic)
       RETURN g,
              count(DISTINCT u) AS membersCount,
              count(DISTINCT p) AS postsCount,
              collect(DISTINCT {id: t.id, name: t.name}) AS topics`,
      { id }
    );

    if (isEmpty(result)) {
      return null;
    }

    const record = result.records[0];
    return {
      ...extractNode(record, 'g'),
      membersCount: record.get('membersCount').toNumber(),
      postsCount: record.get('postsCount').toNumber(),
      topics: record.get('topics').filter(t => t.id !== null)
    };
  } finally {
    await session.close();
  }
}

/**
 * READ many groups
 */
export async function getGroups(filters = {}) {
  const session = getSession();
  try {
    const { isPrivate, search, topicId, limit = 20, skip = 0 } = filters;

    let whereClause = [];
    let params = { limit: neo4j.int(limit), skip: neo4j.int(skip) };

    if (isPrivate !== undefined) {
      whereClause.push('g.isPrivate = $isPrivate');
      params.isPrivate = isPrivate;
    }

    if (search) {
      whereClause.push('(g.name CONTAINS $search OR g.description CONTAINS $search)');
      params.search = search;
    }

    if (topicId) {
      whereClause.push('EXISTS((g)-[:FOCUSES_ON]->(:Topic {id: $topicId}))');
      params.topicId = topicId;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (g:Group)
       ${whereString}
       OPTIONAL MATCH (u:User)-[:MEMBER_OF]->(g)
       OPTIONAL MATCH (p:Post)-[:POSTED_IN]->(g)
       RETURN g,
              count(DISTINCT u) AS membersCount,
              count(DISTINCT p) AS postsCount
       ORDER BY g.membersCount DESC, g.createdAt DESC
       SKIP $skip
       LIMIT $limit`,
      params
    );

    return result.records.map(record => ({
      ...extractNode(record, 'g'),
      membersCount: record.get('membersCount').toNumber(),
      postsCount: record.get('postsCount').toNumber()
    }));
  } finally {
    await session.close();
  }
}

/**
 * READ group members
 */
export async function getGroupMembers(groupId, limit = 50) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User)-[r:MEMBER_OF]->(g:Group {id: $groupId})
       RETURN u, r, labels(u) AS labels
       ORDER BY r.joinedAt DESC
       LIMIT $limit`,
      { groupId, limit }
    );

    return result.records.map(record => ({
      user: toNativeTypes(record.get('u').properties),
      membership: toNativeTypes(record.get('r').properties),
      labels: record.get('labels')
    }));
  } finally {
    await session.close();
  }
}

/**
 * READ group posts
 */
export async function getGroupPosts(groupId, limit = 20, skip = 0) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (p:Post)-[r:POSTED_IN]->(g:Group {id: $groupId})
       WHERE p.isDraft = false
       OPTIONAL MATCH (author:User)-[:CREATED]->(p)
       RETURN p, r,
              author.username AS authorUsername,
              author.id AS authorId
       ORDER BY r.pinned DESC, p.createdAt DESC
       SKIP $skip
       LIMIT $limit`,
      { groupId, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'p'),
      pinned: toNativeTypes(record.get('r').properties).pinned,
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
 * UPDATE group
 */
export async function updateGroup(id, props) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (g:Group {id: $id})
       SET g += $props
       RETURN g`,
      { id, props }
    );

    if (isEmpty(result)) {
      throw new Error('Group not found');
    }

    return extractNode(result.records[0], 'g');
  } finally {
    await session.close();
  }
}

/**
 * DELETE group
 */
export async function deleteGroup(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (g:Group {id: $id})
       DETACH DELETE g
       RETURN count(g) AS deleted`,
      { id }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}
