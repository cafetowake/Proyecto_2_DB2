// Comment service - ALL Cypher queries for Comment operations
import { getSession } from '../config/neo4j.js';
import { toNativeTypes } from '../utils/neo4jHelpers.js';

// CREATE comment
export async function createComment(data) {
  // TODO: Implement - Create comment + WROTE + ON or REPLY_TO
}

// READ single comment
export async function getCommentById(id) {
  // TODO: Implement
}

// READ comments by post
export async function getCommentsByPost(postId, filters) {
  // TODO: Implement
}

// READ comment replies (recursive)
export async function getCommentReplies(commentId) {
  // TODO: Implement
}

// UPDATE comment
export async function updateComment(id, props) {
  // TODO: Implement
}

// DELETE comment
export async function deleteComment(id) {
  // TODO: Implement
}
