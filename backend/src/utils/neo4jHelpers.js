// Neo4j type conversion utilities
import neo4j from 'neo4j-driver';

/**
 * Convert Neo4j native types to JavaScript types
 * @param {Object} obj - Neo4j node/relationship properties
 * @returns {Object} - Plain JavaScript object
 */
export function toNativeTypes(obj) {
  if (!obj) return obj;
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (neo4j.isInt(value)) {
      // Convert Neo4j Integer to number
      result[key] = value.toNumber();
    } else if (value instanceof neo4j.types.Date) {
      // Convert Neo4j Date to ISO string
      result[key] = value.toString();
    } else if (value instanceof neo4j.types.DateTime) {
      // Convert Neo4j DateTime to ISO string
      result[key] = value.toString();
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Convert array of Neo4j records to native JavaScript objects
 * @param {Array} records - Array of Neo4j records
 * @param {String} key - Optional key to extract from each record
 * @returns {Array} - Array of plain JavaScript objects
 */
export function recordsToObjects(records, key = null) {
  if (!records || records.length === 0) return [];
  
  return records.map(record => {
    if (key) {
      const value = record.get(key);
      if (value && value.properties) {
        return toNativeTypes(value.properties);
      }
      return value;
    }
    return toNativeTypes(record.toObject());
  });
}

/**
 * Extract single node from record
 */
export function extractNode(record, key = 'n') {
  if (!record) return null;
  const node = record.get(key);
  if (!node) return null;
  return toNativeTypes(node.properties);
}

/**
 * Extract single relationship from record
 */
export function extractRelationship(record, key = 'r') {
  if (!record) return null;
  const rel = record.get(key);
  if (!rel) return null;
  return {
    type: rel.type,
    properties: toNativeTypes(rel.properties)
  };
}

/**
 * Check if result is empty
 */
export function isEmpty(result) {
  return !result || !result.records || result.records.length === 0;
}
