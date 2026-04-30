// User service - ALL Cypher queries for User operations
import neo4j from 'neo4j-driver';
import { getSession } from '../config/neo4j.js';
import { toNativeTypes, extractNode, isEmpty } from '../utils/neo4jHelpers.js';

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * CREATE node with 1 label (rubric: creación con 1 label)
 * Creates a basic User node with all required properties
 */
export async function createUser(data) {
  const session = getSession();
  try {
    const result = await session.run(
      `CREATE (u:User {
        id: $id,
        username: $username,
        email: $email,
        biography: $biography,
        isActive: $isActive,
        interests: $interests,
        birthdate: date($birthdate),
        joinedAt: date($joinedAt)
      })
      RETURN u`,
      {
        id: data.id,
        username: data.username,
        email: data.email,
        biography: data.biography || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        interests: data.interests || [],
        birthdate: data.birthdate,
        joinedAt: data.joinedAt || new Date().toISOString().split('T')[0]
      }
    );

    if (isEmpty(result)) {
      throw new Error('Failed to create user');
    }

    return extractNode(result.records[0], 'u');
  } finally {
    await session.close();
  }
}

/**
 * CREATE node with 2+ labels (rubric: creación con 2+ labels)
 * Adds VerifiedUser label to existing user with verification properties
 */
export async function verifyUser(userId, verifiedAt, badge) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})
       SET u:VerifiedUser
       SET u.verifiedAt = date($verifiedAt),
           u.badge = $badge
       RETURN u`,
      {
        userId,
        verifiedAt: verifiedAt || new Date().toISOString().split('T')[0],
        badge: badge || 'creator'
      }
    );

    if (isEmpty(result)) {
      throw new Error('User not found');
    }

    return extractNode(result.records[0], 'u');
  } finally {
    await session.close();
  }
}

/**
 * Create verified user directly with 2 labels
 */
export async function createVerifiedUser(data) {
  const session = getSession();
  try {
    const result = await session.run(
      `CREATE (u:User:VerifiedUser {
        id: $id,
        username: $username,
        email: $email,
        biography: $biography,
        isActive: $isActive,
        interests: $interests,
        birthdate: date($birthdate),
        joinedAt: date($joinedAt),
        verifiedAt: date($verifiedAt),
        badge: $badge
      })
      RETURN u`,
      {
        id: data.id,
        username: data.username,
        email: data.email,
        biography: data.biography || '',
        isActive: data.isActive !== undefined ? data.isActive : true,
        interests: data.interests || [],
        birthdate: data.birthdate,
        joinedAt: data.joinedAt || new Date().toISOString().split('T')[0],
        verifiedAt: data.verifiedAt || new Date().toISOString().split('T')[0],
        badge: data.badge || 'creator'
      }
    );

    if (isEmpty(result)) {
      throw new Error('Failed to create verified user');
    }

    return extractNode(result.records[0], 'u');
  } finally {
    await session.close();
  }
}

// ============================================================================
// READ OPERATIONS
// ============================================================================

/**
 * READ single node (rubric: consultar 1 nodo)
 * Get user by ID with optional filters
 */
export async function getUserById(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $id})
       RETURN u,
              labels(u) AS labels,
              COUNT { (u)-[:FOLLOWS]->() } AS followingCount,
              COUNT { (u)<-[:FOLLOWS]-() } AS followersCount,
              COUNT { (u)-[:CREATED]->(:Post) } AS postCount`,
      { id }
    );

    if (isEmpty(result)) {
      return null;
    }

    const record = result.records[0];
    return {
      ...extractNode(record, 'u'),
      labels: record.get('labels'),
      followingCount: record.get('followingCount').toNumber(),
      followersCount: record.get('followersCount').toNumber(),
      postCount: record.get('postCount').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * READ many with filter (rubric: consultar muchos nodos con filtros)
 * Get multiple users with various filters
 */
export async function getUsers(filters = {}) {
  const session = getSession();
  try {
    const {
      isActive,
      badge,
      verified,
      interests,
      search,
      limit = 20,
      skip = 0
    } = filters;

    let whereClause = [];
    let params = { 
      limit: neo4j.int(limit), 
      skip: neo4j.int(skip) 
    };

    if (isActive !== undefined) {
      whereClause.push('u.isActive = $isActive');
      params.isActive = isActive;
    }

    if (badge) {
      whereClause.push('u.badge = $badge');
      params.badge = badge;
    }

    if (verified) {
      whereClause.push('u:VerifiedUser');
    }

    if (interests && interests.length > 0) {
      whereClause.push('ANY(interest IN $interests WHERE interest IN u.interests)');
      params.interests = interests;
    }

    if (search) {
      whereClause.push('(u.username CONTAINS $search OR u.email CONTAINS $search)');
      params.search = search;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (u:User)
       ${whereString}
       RETURN u,
              labels(u) AS labels,
              COUNT { (u)-[:FOLLOWS]->() } AS followingCount,
              COUNT { (u)<-[:FOLLOWS]-() } AS followersCount,
              COUNT { (u)-[:CREATED]->(:Post) } AS postCount
       ORDER BY u.joinedAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      params
    );

    return result.records.map(record => ({
      ...extractNode(record, 'u'),
      labels: record.get('labels'),
      followingCount: record.get('followingCount').toNumber(),
      followersCount: record.get('followersCount').toNumber(),
      postCount: record.get('postCount').toNumber()
    }));
  } finally {
    await session.close();
  }
}

/**
 * Aggregation (rubric: consultas agregadas)
 * Get aggregated statistics about users
 */
export async function getUserStats() {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User)
       OPTIONAL MATCH (u)-[:FOLLOWS]->(following)
       OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower)
       OPTIONAL MATCH (u)-[:CREATED]->(p:Post)
       WITH u,
            count(DISTINCT following) as followingCount,
            count(DISTINCT follower) as followerCount,
            count(DISTINCT p) as postCount
       RETURN 
         count(DISTINCT u) AS totalUsers,
         count(DISTINCT CASE WHEN u:VerifiedUser THEN u END) AS verifiedUsers,
         count(DISTINCT CASE WHEN u.isActive = true THEN u END) AS activeUsers,
         avg(followingCount) AS avgFollowing,
         avg(followerCount) AS avgFollowers,
         sum(postCount) AS totalPosts,
         avg(postCount) AS avgPostsPerUser,
         collect(DISTINCT u.badge) AS badges,
         max(followingCount) AS maxFollowing,
         max(followerCount) AS maxFollowers`
    );

    const record = result.records[0];
    return {
      totalUsers: record.get('totalUsers').toNumber(),
      verifiedUsers: record.get('verifiedUsers').toNumber(),
      activeUsers: record.get('activeUsers').toNumber(),
      avgFollowing: record.get('avgFollowing'),
      avgFollowers: record.get('avgFollowers'),
      totalPosts: record.get('totalPosts').toNumber(),
      avgPostsPerUser: record.get('avgPostsPerUser'),
      badges: record.get('badges').filter(b => b !== null),
      maxFollowing: record.get('maxFollowing').toNumber(),
      maxFollowers: record.get('maxFollowers').toNumber()
    };
  } finally {
    await session.close();
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * UPDATE single node properties (rubric: actualizar propiedades)
 * Update properties of a single user using SET +=
 */
export async function updateUser(id, props) {
  const session = getSession();
  try {
    // Convert dates to proper format if present
    const updateProps = { ...props };
    if (updateProps.birthdate) {
      updateProps.birthdate = updateProps.birthdate;
    }

    const result = await session.run(
      `MATCH (u:User {id: $id})
       SET u += $props
       RETURN u`,
      { id, props: updateProps }
    );

    if (isEmpty(result)) {
      throw new Error('User not found');
    }

    return extractNode(result.records[0], 'u');
  } finally {
    await session.close();
  }
}

/**
 * UPDATE multiple nodes (rubric: actualizar múltiples nodos)
 * Update properties on multiple users matching a filter
 */
export async function bulkUpdateUsers(filter, props) {
  const session = getSession();
  try {
    let whereClause = [];
    let params = { props };

    if (filter.isActive !== undefined) {
      whereClause.push('u.isActive = $isActive');
      params.isActive = filter.isActive;
    }

    if (filter.badge) {
      whereClause.push('u.badge = $badge');
      params.badge = filter.badge;
    }

    if (filter.ids && filter.ids.length > 0) {
      whereClause.push('u.id IN $ids');
      params.ids = filter.ids;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (u:User)
       ${whereString}
       SET u += $props
       RETURN count(u) AS updated`,
      params
    );

    return {
      updated: result.records[0].get('updated').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * ADD properties to node (rubric: agregar propiedades)
 * Add new properties to a user without replacing existing ones
 */
export async function addUserProps(id, props) {
  const session = getSession();
  try {
    const setClauses = Object.keys(props).map(key => `u.${key} = $props.${key}`).join(', ');
    
    const result = await session.run(
      `MATCH (u:User {id: $id})
       SET ${setClauses}
       RETURN u`,
      { id, props }
    );

    if (isEmpty(result)) {
      throw new Error('User not found');
    }

    return extractNode(result.records[0], 'u');
  } finally {
    await session.close();
  }
}

// ============================================================================
// DELETE OPERATIONS (Properties & Nodes)
// ============================================================================

/**
 * REMOVE properties (rubric: eliminar propiedades de nodo)
 * Remove specific properties from a user
 */
export async function removeUserProps(id, propKeys) {
  const session = getSession();
  try {
    const removeClause = propKeys.map(key => `u.${key}`).join(', ');
    
    const result = await session.run(
      `MATCH (u:User {id: $id})
       REMOVE ${removeClause}
       RETURN u`,
      { id }
    );

    if (isEmpty(result)) {
      throw new Error('User not found');
    }

    return extractNode(result.records[0], 'u');
  } finally {
    await session.close();
  }
}

/**
 * Remove properties from multiple users
 */
export async function bulkRemoveUserProps(propKeys, filter = {}) {
  const session = getSession();
  try {
    let whereClause = [];
    let params = {};

    if (filter.ids && filter.ids.length > 0) {
      whereClause.push('u.id IN $ids');
      params.ids = filter.ids;
    }

    if (filter.badge) {
      whereClause.push('u.badge = $badge');
      params.badge = filter.badge;
    }

    if (filter.isActive !== undefined) {
      whereClause.push('u.isActive = $isActive');
      params.isActive = filter.isActive;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    
    // Build REMOVE clause
    let removeClauses = [];
    for (const key of propKeys) {
      removeClauses.push(`u.${key}`);
    }
    const removeClause = removeClauses.join(', ');

    const result = await session.run(
      `MATCH (u:User)
       ${whereString}
       REMOVE ${removeClause}
       RETURN count(u) AS updated`,
      params
    );

    return {
      updated: result.records[0].get('updated').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * DELETE single node (rubric: eliminar 1 nodo)
 * Delete a user and all their relationships using DETACH DELETE
 */
export async function deleteUser(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $id})
       DETACH DELETE u
       RETURN count(u) AS deleted`,
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
 * DELETE multiple nodes (rubric: eliminar múltiples nodos)
 * Delete multiple users by IDs
 */
export async function deleteUsers(ids) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User)
       WHERE u.id IN $ids
       DETACH DELETE u
       RETURN count(u) AS deleted`,
      { ids }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber()
    };
  } finally {
    await session.close();
  }
}
