// Topic service - ALL Cypher queries for Topic operations
import { getSession } from '../config/neo4j.js';
import { toNativeTypes } from '../utils/neo4jHelpers.js';

// CREATE topic
export async function createTopic(data) {
  // TODO: Implement
}

// READ single topic
export async function getTopicById(id) {
  // TODO: Implement
}

// READ many topics
export async function getTopics(filters) {
  // TODO: Implement
}

// READ posts tagged with topic
export async function getTopicPosts(topicId) {
  // TODO: Implement - MATCH (p)-[:TAGGED_WITH]->(t)
}

// UPDATE topic
export async function updateTopic(id, props) {
  // TODO: Implement
}

// DELETE topic
export async function deleteTopic(id) {
  // TODO: Implement
}
