#!/usr/bin/env node

/**
 * Test Neo4j AuraDB connection
 * Usage: node scripts/testConnection.js
 */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE } = process.env;

console.log('Testing Neo4j AuraDB Connection...\n');
console.log('Configuration:');
console.log(`  URI: ${NEO4J_URI}`);
console.log(`  Username: ${NEO4J_USERNAME}`);
console.log(`  Database: ${NEO4J_DATABASE || 'neo4j (default)'}\n`);

const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD)
);

async function testConnection() {
  let session;
  
  try {
    // Test 1: Verify connectivity
    console.log('Test 1: Verifying connectivity...');
    await driver.verifyConnectivity();
    console.log('Connection successful!\n');
    
    // Test 2: Run simple query
    console.log('Test 2: Running test query...');
    session = driver.session({ database: NEO4J_DATABASE || 'neo4j' });
    
    const result = await session.run('RETURN 1 AS number, "Hello Neo4j!" AS message');
    const record = result.records[0];
    console.log('Query successful!');
    console.log(`   Number: ${record.get('number')}`);
    console.log(`   Message: ${record.get('message')}\n`);
    
    // Test 3: Get database info
    console.log('Test 3: Fetching database info...');
    const infoResult = await session.run(`
      CALL dbms.components() YIELD name, versions, edition
      RETURN name, versions[0] AS version, edition
    `);
    
    if (infoResult.records.length > 0) {
      const info = infoResult.records[0];
      console.log('Database info:');
      console.log(`   Name: ${info.get('name')}`);
      console.log(`   Version: ${info.get('version')}`);
      console.log(`   Edition: ${info.get('edition')}\n`);
    }
    
    // Test 4: Count existing nodes
    console.log('Test 4: Counting existing nodes...');
    const countResult = await session.run('MATCH (n) RETURN count(n) AS nodeCount');
    const nodeCount = countResult.records[0].get('nodeCount').toNumber();
    console.log(`Total nodes in database: ${nodeCount}\n`);
    
    console.log('All tests passed! Your Neo4j connection is ready.\n');
    
  } catch (error) {
    console.error('Connection test failed!');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.code === 'ServiceUnavailable') {
      console.error('Tip: The Aura instance might still be initializing.');
      console.error('   Wait 60 seconds and try again.\n');
    } else if (error.code === 'Neo.ClientError.Security.Unauthorized') {
      console.error('Tip: Check your credentials in the .env file.\n');
    }
    
    process.exit(1);
  } finally {
    if (session) await session.close();
    await driver.close();
  }
}

testConnection();
