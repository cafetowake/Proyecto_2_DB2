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
 */
export function recordsToObjects(records, key = null) {
  // TODO: Implement - map records to plain objects
}
