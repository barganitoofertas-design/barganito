const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  const directUrlMatch = envContent.match(/DIRECT_URL="([^"]+)"/);
  
  if (!directUrlMatch) {
    console.error('DIRECT_URL not found in .env');
    return;
  }
  
  const connectionString = directUrlMatch[1];
  console.log('Testing connection to:', connectionString.replace(/:[^:]+@/, ':****@'));
  
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('SUCCESS: Connected to database');
    const res = await client.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
    console.log('Tables found:', res.rows.map(r => r.tablename));
    await client.end();
  } catch (err) {
    console.error('FAILURE:', err.message);
  }
}

run();
