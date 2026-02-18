const { Client } = require('pg');
require('dotenv').config();

async function test() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
  });
  try {
    console.log('Connecting to:', process.env.DIRECT_URL.replace(/:[^:]+@/, ':****@'));
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
}

test();
