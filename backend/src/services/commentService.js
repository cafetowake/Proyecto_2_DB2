// Comment service - ALL Cypher queries for Comment operations
import neo4j from 'neo4j-driver';
import { getSession } from '../config/neo4j.js';
import { toNativeTypes, extractNode, isEmpty } from '../utils/neo4jHelpers.js';

/**
 * CREATE comment on a post or reply to another comment
 */
export async function createComment(data) {
  const session = getSession();
  try {
    const {
      id,
      content,
      authorId,
      postId,
      parentCommentId = null,
      device = 'web'
    } = data;

    const now = new Date().toISOString().split('T')[0];

    let query;
    let params = {
      id,
      content,
      authorId,
      device,
      createdAt: now,
      likesCount: 0,
      repliesCount: 0,
      isEdited: false
    };

    if (parentCommentId) {
      // Reply to another comment
      query = `
        MATCH (author:User {id: $authorId}), (parent:Comment {id: $parentCommentId}), (post:Post {id: $postId})
        CREATE (c:Comment {
          id: $id,
          content: $content,
          likesCount: $likesCount,
          repliesCount: $repliesCount,
          isEdited: $isEdited,
          createdAt: date($createdAt)
        })
        CREATE (author)-[:WROTE {createdAt: date($createdAt), device: $device}]->(c)
        CREATE (c)-[:ON {createdAt: date($createdAt), isMainComment: false, relevanceScore: 1.0}]->(post)
        CREATE (c)-[:REPLY_TO {createdAt: date($createdAt), notified: true, depth: 1}]->(parent)
        SET parent.repliesCount = coalesce(parent.repliesCount, 0) + 1
        SET post.commentsCount = coalesce(post.commentsCount, 0) + 1
        RETURN c, author.username AS authorUsername
      `;
      params.parentCommentId = parentCommentId;
      params.postId = postId;
    } else {
      // Main comment on post
      query = `
        MATCH (author:User {id: $authorId}), (post:Post {id: $postId})
        CREATE (c:Comment {
          id: $id,
          content: $content,
          likesCount: $likesCount,
          repliesCount: $repliesCount,
          isEdited: $isEdited,
          createdAt: date($createdAt)
        })
        CREATE (author)-[:WROTE {createdAt: date($createdAt), device: $device}]->(c)
        CREATE (c)-[:ON {createdAt: date($createdAt), isMainComment: true, relevanceScore: 1.0}]->(post)
        SET post.commentsCount = coalesce(post.commentsCount, 0) + 1
        RETURN c, author.username AS authorUsername
      `;
      params.postId = postId;
    }

    const result = await session.run(query, params);

    if (isEmpty(result)) {
      throw new Error('Failed to create comment');
    }

    const record = result.records[0];
    return {
      ...extractNode(record, 'c'),
      author: {
        id: params.authorId,
        username: record.get('authorUsername'),
      },
      postId: params.postId ?? null,
      repliesCount: 0,
    };
  } finally {
    await session.close();
  }
}

/**
 * READ single comment
 */
export async function getCommentById(id) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Comment {id: $id})
       OPTIONAL MATCH (author:User)-[:WROTE]->(c)
       OPTIONAL MATCH (c)-[:ON]->(p:Post)
       OPTIONAL MATCH (c)-[:REPLY_TO]->(parent:Comment)
       RETURN c,
              author.username AS authorUsername,
              author.id AS authorId,
              p.id AS postId,
              parent.id AS parentCommentId,
              COUNT { (c)<-[:REPLY_TO]-() } AS repliesCount`,
      { id }
    );

    if (isEmpty(result)) {
      return null;
    }

    const record = result.records[0];
    return {
      ...extractNode(record, 'c'),
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername')
      },
      postId: record.get('postId'),
      parentCommentId: record.get('parentCommentId'),
      repliesCount: record.get('repliesCount').toNumber()
    };
  } finally {
    await session.close();
  }
}

/**
 * READ comments by post
 */
export async function getCommentsByPost(postId, filters = {}) {
  const session = getSession();
  try {
    const { limit = 20, skip = 0, mainOnly = false } = filters;

    let whereClause = mainOnly ? 'AND rel.isMainComment = true' : '';

    const result = await session.run(
      `MATCH (c:Comment)-[rel:ON]->(p:Post {id: $postId})
       WHERE NOT EXISTS((c)-[:REPLY_TO]->()) ${whereClause}
       OPTIONAL MATCH (author:User)-[:WROTE]->(c)
       RETURN c,
              author.username AS authorUsername,
              author.id AS authorId,
              COUNT { (c)<-[:REPLY_TO]-() } AS repliesCount
       ORDER BY c.createdAt DESC
       SKIP toInteger($skip)
       LIMIT toInteger($limit)`,
      { postId, skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'c'),
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername')
      },
      repliesCount: record.get('repliesCount').toNumber()
    }));
  } finally {
    await session.close();
  }
}

/**
 * READ comment replies (recursive)
 */
export async function getCommentReplies(commentId, limit = 10) {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (reply:Comment)-[:REPLY_TO]->(c:Comment {id: $commentId})
       OPTIONAL MATCH (author:User)-[:WROTE]->(reply)
       RETURN reply,
              author.username AS authorUsername,
              author.id AS authorId,
              COUNT { (reply)<-[:REPLY_TO]-() } AS repliesCount
       ORDER BY reply.createdAt ASC
       LIMIT toInteger($limit)`,
      { commentId, limit: neo4j.int(limit) }
    );

    return result.records.map(record => ({
      ...extractNode(record, 'reply'),
      author: {
        id: record.get('authorId'),
        username: record.get('authorUsername')
      },
      repliesCount: record.get('repliesCount').toNumber()
    }));
  } finally {
    await session.close();
  }
}

/**
 * UPDATE comment
 */
export async function updateComment(id, props) {
  const session = getSession();
  try {
    // Mark as edited if content is changed
    const updateProps = { ...props };
    if (updateProps.content) {
      updateProps.isEdited = true;
    }

    const result = await session.run(
      `MATCH (c:Comment {id: $id})
       SET c += $props
       RETURN c`,
      { id, props: updateProps }
    );

    if (isEmpty(result)) {
      throw new Error('Comment not found');
    }

    return extractNode(result.records[0], 'c');
  } finally {
    await session.close();
  }
}

/**
 * DELETE comment
 */
export async function deleteComment(id) {
  const session = getSession();
  try {
    // First check if comment exists
    const checkResult = await session.run(
      `MATCH (c:Comment {id: $id})
       RETURN c`,
      { id }
    );

    if (checkResult.records.length === 0) {
      return { deleted: false };
    }

    // Delete comment and update parent if exists
    await session.run(
      `MATCH (c:Comment {id: $id})
       OPTIONAL MATCH (c)-[:REPLY_TO]->(parent:Comment)
       WITH c, parent
       DETACH DELETE c
       WITH parent
       WHERE parent IS NOT NULL
       SET parent.repliesCount = CASE 
         WHEN parent.repliesCount > 0 THEN parent.repliesCount - 1 
         ELSE 0 
       END`,
      { id }
    );

    return { deleted: true };
  } finally {
    await session.close();
  }
}
