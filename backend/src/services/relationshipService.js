// Relationship service - ALL Cypher queries for relationship operations
import { getSession } from '../config/neo4j.js';
import { toNativeTypes } from '../utils/neo4jHelpers.js';

// CREATE relationship with properties (rubric: creación de relación con propiedades)
export async function followUser(followerId, followedId, props) {
  // TODO: Implement - CREATE (a)-[r:FOLLOWS]->(b) with 3+ properties
}

// CREATE LIKES relationship
export async function likePost(userId, postId, props) {
  // TODO: Implement
}

// CREATE SAVED relationship
export async function savePost(userId, postId, props) {
  // TODO: Implement
}

// CREATE MEMBER_OF relationship
export async function joinGroup(userId, groupId, props) {
  // TODO: Implement
}

// UPDATE relationship property (rubric)
export async function updateFollowRelation(followerId, followedId, props) {
  // TODO: Implement - MATCH (a)-[r:FOLLOWS]->(b) SET r += $props
}

// UPDATE multiple relationships (rubric)
export async function bulkUpdateFollows(filter, props) {
  // TODO: Implement
}

// ADD property to relationship (rubric)
export async function addRelationProp(followerId, followedId, prop, value) {
  // TODO: Implement
}

// REMOVE property from relationship (rubric)
export async function removeRelationProp(followerId, followedId, propKey) {
  // TODO: Implement
}

// REMOVE property from multiple relationships (rubric)
export async function bulkRemoveRelationProp(propKey, filter) {
  // TODO: Implement
}

// DELETE single relationship (rubric)
export async function unfollow(followerId, followedId) {
  // TODO: Implement - MATCH (a)-[r:FOLLOWS]->(b) DELETE r
}

// DELETE multiple relationships (rubric)
export async function unfollowMany(followerId, followedIds) {
  // TODO: Implement
}
