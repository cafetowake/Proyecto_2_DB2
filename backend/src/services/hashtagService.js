// Hashtag service - ALL Cypher queries for Hashtag operations
import { getSession } from '../config/neo4j.js';
import { toNativeTypes } from '../utils/neo4jHelpers.js';

// CREATE hashtag
export async function createHashtag(data) {
  // TODO: Implement
}

// READ single hashtag
export async function getHashtagById(id) {
  // TODO: Implement
}

// READ many hashtags (trending, etc.)
export async function getHashtags(filters) {
  // TODO: Implement - filter by isTrending, sort by usageCount
}

// READ posts using hashtag
export async function getHashtagPosts(hashtagId) {
  // TODO: Implement - MATCH (p)-[:USES]->(h)
}

// UPDATE hashtag
export async function updateHashtag(id, props) {
  // TODO: Implement
}

// DELETE hashtag
export async function deleteHashtag(id) {
  // TODO: Implement
}
