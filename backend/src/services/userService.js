// User service - ALL Cypher queries for User operations
import { getSession } from '../config/neo4j.js';
import { toNativeTypes } from '../utils/neo4jHelpers.js';

// CREATE node with 1 label (rubric: creación con 1 label)
export async function createUser(data) {
  // TODO: Implement
}

// CREATE node with 2+ labels (rubric: creación con 2+ labels)
export async function verifyUser(userId, verifiedAt, badge) {
  // TODO: Implement
}

// READ single node (rubric: consultar 1 nodo)
export async function getUserById(id) {
  // TODO: Implement
}

// READ many with filter (rubric: consultar muchos nodos con filtros)
export async function getUsers(filters) {
  // TODO: Implement
}

// Aggregation (rubric: consultas agregadas)
export async function getUserStats() {
  // TODO: Implement - COUNT, AVG, COLLECT, etc.
}

// UPDATE single node properties (rubric: actualizar propiedades)
export async function updateUser(id, props) {
  // TODO: Implement - SET u += $props
}

// UPDATE multiple nodes (rubric: actualizar múltiples nodos)
export async function bulkUpdateUsers(filter, props) {
  // TODO: Implement
}

// ADD properties to node (rubric: agregar propiedades)
export async function addUserProps(id, props) {
  // TODO: Implement
}

// REMOVE properties (rubric: eliminar propiedades de nodo)
export async function removeUserProps(id, propKeys) {
  // TODO: Implement - REMOVE u.propName
}

// DELETE single node (rubric: eliminar 1 nodo)
export async function deleteUser(id) {
  // TODO: Implement - DETACH DELETE
}

// DELETE multiple nodes (rubric: eliminar múltiples nodos)
export async function deleteUsers(ids) {
  // TODO: Implement
}
