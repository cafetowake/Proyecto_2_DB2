// Neo4j driver singleton
import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } = process.env;

if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) {
  throw new Error('Missing required Neo4j environment variables: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD');
}

// Create driver instance with AuraDB configuration
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000 // 2 minutes
  }
);

// Verify connectivity on startup
try {
  await driver.verifyConnectivity();
  console.log('Connected to Neo4j AuraDB:', process.env.AURA_INSTANCENAME || 'Unknown');
} catch (error) {
  console.error('Failed to connect to Neo4j:', error.message);
  throw error;
}

// Export session getter with optional database selection
export const getSession = (database = NEO4J_DATABASE || 'neo4j') => {
  return driver.session({ database });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nClosing Neo4j connection...');
  await driver.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nClosing Neo4j connection...');
  await driver.close();
  process.exit(0);
});

// Export driver
export default driver;
