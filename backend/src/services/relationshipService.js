// Relationship service - ALL Cypher queries for relationship operations
import { getSession } from '../config/neo4j.js';
import { toNativeTypes, isEmpty } from '../utils/neo4jHelpers.js';

// ============================================================================
// CREATE RELATIONSHIP OPERATIONS
// ============================================================================

/**
 * CREATE relationship with properties (rubric: creación de relación con propiedades)
 * Create FOLLOWS relationship with 3+ properties
 */
export async function followUser(followerId, followedId, props = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:User {id: $followerId}), (b:User {id: $followedId})
       MERGE (a)-[r:FOLLOWS]->(b)
       ON CREATE SET 
         r.since = date($since),
         r.isCloseFriend = $isCloseFriend,
         r.interactionScore = $interactionScore
       ON MATCH SET
         r.since = date($since),
         r.isCloseFriend = $isCloseFriend,
         r.interactionScore = $interactionScore
       RETURN r, a.username AS follower, b.username AS followed`,
      {
        followerId,
        followedId,
        since: props.since || new Date().toISOString().split('T')[0],
        isCloseFriend: props.isCloseFriend || false,
        interactionScore: props.interactionScore || 0.0
      }
    );

    if (isEmpty(result)) {
      throw new Error('Users not found');
    }

    const record = result.records[0];
    return {
      relationship: toNativeTypes(record.get('r').properties),
      follower: record.get('follower'),
      followed: record.get('followed')
    };
  } finally {
    await session.close();
  }
}

/**
 * CREATE LIKES relationship with properties
 */
export async function likePost(userId, postId, props = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId}), (p:Post {id: $postId})
       MERGE (u)-[r:LIKES]->(p)
       ON CREATE SET
         r.likedAt = date($likedAt),
         r.reactionType = $reactionType,
         r.weight = $weight,
         p.likesCount = coalesce(p.likesCount, 0) + 1
       ON MATCH SET
         r.reactionType = $reactionType,
         r.weight = $weight
       RETURN r, u.username AS username, p.title AS postTitle`,
      {
        userId,
        postId,
        likedAt: props.likedAt || new Date().toISOString().split('T')[0],
        reactionType: props.reactionType || 'like',
        weight: props.weight || 1.0
      }
    );

    if (isEmpty(result)) {
      throw new Error('User or Post not found');
    }

    const record = result.records[0];
    return {
      relationship: toNativeTypes(record.get('r').properties),
      username: record.get('username'),
      postTitle: record.get('postTitle')
    };
  } finally {
    await session.close();
  }
}

/**
 * CREATE SAVED relationship
 */
export async function savePost(userId, postId, props = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId}), (p:Post {id: $postId})
       MERGE (u)-[r:SAVED]->(p)
       ON CREATE SET
         r.savedAt = date($savedAt),
         r.collectionName = $collectionName,
         r.isPrivate = $isPrivate
       RETURN r`,
      {
        userId,
        postId,
        savedAt: props.savedAt || new Date().toISOString().split('T')[0],
        collectionName: props.collectionName || 'Saved',
        isPrivate: props.isPrivate !== undefined ? props.isPrivate : true
      }
    );

    if (isEmpty(result)) {
      throw new Error('User or Post not found');
    }

    return toNativeTypes(result.records[0].get('r').properties);
  } finally {
    await session.close();
  }
}

/**
 * CREATE MEMBER_OF relationship (user joins a group)
 */
export async function joinGroup(userId, groupId, props = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId}), (g:Group {id: $groupId})
       MERGE (u)-[r:MEMBER_OF]->(g)
       ON CREATE SET
         r.joinedAt = date($joinedAt),
         r.role = $role,
         r.permissions = $permissions,
         g.membersCount = coalesce(g.membersCount, 0) + 1
       ON MATCH SET
         r.role = $role,
         r.permissions = $permissions
       RETURN r, u.username AS username, g.name AS groupName`,
      {
        userId,
        groupId,
        joinedAt: props.joinedAt || new Date().toISOString().split('T')[0],
        role: props.role || 'member',
        permissions: props.permissions || ['read', 'post']
      }
    );

    if (isEmpty(result)) {
      throw new Error('User or Group not found');
    }

    const record = result.records[0];
    return {
      relationship: toNativeTypes(record.get('r').properties),
      username: record.get('username'),
      groupName: record.get('groupName')
    };
  } finally {
    await session.close();
  }
}

/**
 * CREATE INTERESTED_IN relationship
 */
export async function addInterestInTopic(userId, topicId, props = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId}), (t:Topic {id: $topicId})
       MERGE (u)-[r:INTERESTED_IN]->(t)
       ON CREATE SET
         r.since = date($since),
         r.level = $level,
         r.isPrimary = $isPrimary
       RETURN r`,
      {
        userId,
        topicId,
        since: props.since || new Date().toISOString().split('T')[0],
        level: props.level || 3,
        isPrimary: props.isPrimary || false
      }
    );

    if (isEmpty(result)) {
      throw new Error('User or Topic not found');
    }

    return toNativeTypes(result.records[0].get('r').properties);
  } finally {
    await session.close();
  }
}

/**
 * CREATE FOLLOWS_HASHTAG relationship
 */
export async function followHashtag(userId, hashtagId, props = {}) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId}), (h:Hashtag {id: $hashtagId})
       MERGE (u)-[r:FOLLOWS_HASHTAG]->(h)
       ON CREATE SET
         r.since = date($since),
         r.notificationsEnabled = $notificationsEnabled,
         r.interestLevel = $interestLevel
       RETURN r`,
      {
        userId,
        hashtagId,
        since: props.since || new Date().toISOString().split('T')[0],
        notificationsEnabled: props.notificationsEnabled || false,
        interestLevel: props.interestLevel || 3
      }
    );

    if (isEmpty(result)) {
      throw new Error('User or Hashtag not found');
    }

    return toNativeTypes(result.records[0].get('r').properties);
  } finally {
    await session.close();
  }
}

// ============================================================================
// UPDATE RELATIONSHIP OPERATIONS
// ============================================================================

/**
 * UPDATE relationship property (rubric)
 * Update properties of a FOLLOWS relationship
 */
export async function updateFollowRelation(followerId, followedId, props) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $followedId})
       SET r += $props
       RETURN r, a.username AS follower, b.username AS followed`,
      { followerId, followedId, props }
    );

    if (isEmpty(result)) {
      throw new Error('Relationship not found');
    }

    const record = result.records[0];
    return {
      relationship: toNativeTypes(record.get('r').properties),
      follower: record.get('follower'),
      followed: record.get('followed')
    };
  } finally {
    await session.close();
  }
}

/**
 * UPDATE multiple relationships (rubric)
 * Update all FOLLOWS relationships matching a filter
 */
export async function bulkUpdateFollows(filter, props) {
  const session = getSession();
  try {
    let whereClause = [];
    let params = { props };

    if (filter.followerId) {
      whereClause.push('a.id = $followerId');
      params.followerId = filter.followerId;
    }

    if (filter.followedId) {
      whereClause.push('b.id = $followedId');
      params.followedId = filter.followedId;
    }

    if (filter.isCloseFriend !== undefined) {
      whereClause.push('r.isCloseFriend = $isCloseFriend');
      params.isCloseFriend = filter.isCloseFriend;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (a:User)-[r:FOLLOWS]->(b:User)
       ${whereString}
       SET r += $props
       RETURN count(r) AS updated`,
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
 * ADD property to relationship (rubric)
 * Add a specific property to a FOLLOWS relationship
 */
export async function addRelationProp(followerId, followedId, propKey, propValue) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $followedId})
       SET r[$propKey] = $propValue
       RETURN r`,
      { followerId, followedId, propKey, propValue }
    );

    if (isEmpty(result)) {
      throw new Error('Relationship not found');
    }

    return toNativeTypes(result.records[0].get('r').properties);
  } finally {
    await session.close();
  }
}

/**
 * ADD properties to multiple relationships
 */
export async function bulkAddRelationProps(filter, props) {
  const session = getSession();
  try {
    let whereClause = [];
    let params = {};

    if (filter.followerId) {
      whereClause.push('a.id = $followerId');
      params.followerId = filter.followerId;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    const setClause = Object.keys(props)
      .map(key => `r.${key} = $props.${key}`)
      .join(', ');

    params.props = props;

    const result = await session.run(
      `MATCH (a:User)-[r:FOLLOWS]->(b:User)
       ${whereString}
       SET ${setClause}
       RETURN count(r) AS updated`,
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
// DELETE RELATIONSHIP OPERATIONS (Properties & Relationships)
// ============================================================================

/**
 * REMOVE property from relationship (rubric)
 * Remove a specific property from a FOLLOWS relationship
 */
export async function removeRelationProp(followerId, followedId, propKey) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $followedId})
       REMOVE r.${propKey}
       RETURN r`,
      { followerId, followedId }
    );

    if (isEmpty(result)) {
      throw new Error('Relationship not found');
    }

    return toNativeTypes(result.records[0].get('r').properties);
  } finally {
    await session.close();
  }
}

/**
 * REMOVE property from multiple relationships (rubric)
 * Remove a property from all FOLLOWS relationships matching a filter
 */
export async function bulkRemoveRelationProp(propKey, filter = {}) {
  const session = getSession();
  try {
    let whereClause = [];
    let params = {};

    if (filter.followerId) {
      whereClause.push('a.id = $followerId');
      params.followerId = filter.followerId;
    }

    if (filter.followedId) {
      whereClause.push('b.id = $followedId');
      params.followedId = filter.followedId;
    }

    const whereString = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await session.run(
      `MATCH (a:User)-[r:FOLLOWS]->(b:User)
       ${whereString}
       REMOVE r.${propKey}
       RETURN count(r) AS updated`,
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
 * DELETE single relationship (rubric)
 * Unfollow a user (delete FOLLOWS relationship)
 */
export async function unfollow(followerId, followedId) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User {id: $followedId})
       DELETE r
       RETURN count(r) AS deleted`,
      { followerId, followedId }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}

/**
 * DELETE multiple relationships (rubric)
 * Unfollow many users at once
 */
export async function unfollowMany(followerId, followedIds) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (a:User {id: $followerId})-[r:FOLLOWS]->(b:User)
       WHERE b.id IN $followedIds
       DELETE r
       RETURN count(r) AS deleted`,
      { followerId, followedIds }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * Unlike a post (delete LIKES relationship)
 */
export async function unlikePost(userId, postId) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:LIKES]->(p:Post {id: $postId})
       DELETE r
       WITH p
       SET p.likesCount = CASE 
         WHEN p.likesCount > 0 THEN p.likesCount - 1 
         ELSE 0 
       END
       RETURN count(r) AS deleted`,
      { userId, postId }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}

/**
 * Unsave a post (delete SAVED relationship)
 */
export async function unsavePost(userId, postId) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:SAVED]->(p:Post {id: $postId})
       DELETE r
       RETURN count(r) AS deleted`,
      { userId, postId }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}

/**
 * Leave a group (delete MEMBER_OF relationship)
 */
export async function leaveGroup(userId, groupId) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:MEMBER_OF]->(g:Group {id: $groupId})
       DELETE r
       WITH g
       SET g.membersCount = CASE 
         WHEN g.membersCount > 0 THEN g.membersCount - 1 
         ELSE 0 
       END
       RETURN count(r) AS deleted`,
      { userId, groupId }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber() > 0
    };
  } finally {
    await session.close();
  }
}

// ============================================================================
// QUERY / READ RELATIONSHIP OPERATIONS
// ============================================================================

/**
 * Get all users a user follows
 */
export async function getFollowing(userId, limit = 20) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:FOLLOWS]->(other:User)
       RETURN other, r, labels(other) AS labels
       ORDER BY r.interactionScore DESC, r.since DESC
       LIMIT toInteger($limit)`,
      { userId, limit }
    );

    return result.records.map(record => ({
      user: toNativeTypes(record.get('other').properties),
      relationship: toNativeTypes(record.get('r').properties),
      labels: record.get('labels')
    }));
  } finally {
    await session.close();
  }
}

/**
 * Get all followers of a user
 */
export async function getFollowers(userId, limit = 20) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (other:User)-[r:FOLLOWS]->(u:User {id: $userId})
       RETURN other, r, labels(other) AS labels
       ORDER BY r.interactionScore DESC, r.since DESC
       LIMIT toInteger($limit)`,
      { userId, limit }
    );

    return result.records.map(record => ({
      user: toNativeTypes(record.get('other').properties),
      relationship: toNativeTypes(record.get('r').properties),
      labels: record.get('labels')
    }));
  } finally {
    await session.close();
  }
}

/**
 * Remove INTERESTED_IN relationship (user unfollows a topic)
 */
export async function removeInterestInTopic(userId, topicId) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:INTERESTED_IN]->(t:Topic {id: $topicId})
       DELETE r
       RETURN count(r) AS deleted`,
      { userId, topicId }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * GET hashtags that a user follows
 */
export async function getFollowedHashtags(userId) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:FOLLOWS_HASHTAG]->(h:Hashtag)
       RETURN h, r`,
      { userId }
    );
    return result.records.map(record => ({
      ...toNativeTypes(record.get('h').properties),
    }));
  } finally {
    await session.close();
  }
}

/**
 * Unfollow hashtag (delete FOLLOWS_HASHTAG relationship)
 */
export async function unfollowHashtag(userId, hashtagId) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[r:FOLLOWS_HASHTAG]->(h:Hashtag {id: $hashtagId})
       DELETE r
       RETURN count(r) AS deleted`,
      { userId, hashtagId }
    );

    return {
      deleted: result.records[0].get('deleted').toNumber()
    };
  } finally {
    await session.close();
  }
}
