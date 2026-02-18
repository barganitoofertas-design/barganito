const { Client } = require('pg');

const projectRef = 'fzpakajuwkctyxlzwlpa';
const passwordEncoded = '159PodjI)_&h%23jdQi1_%40'; // Encoded for # and @

const variations = [
  {
    name: 'User: postgres.fzpakajuwkctyxlzwlpa, Host: db.fzpakajuwkctyxlzwlpa.supabase.co',
    url: `postgresql://postgres.${projectRef}:${passwordEncoded}@db.${projectRef}.supabase.co:5432/postgres`
  },
  {
    name: 'User: postgres, Host: db.fzpakajuwkctyxlzwlpa.supabase.co',
    url: `postgresql://postgres:${passwordEncoded}@db.${projectRef}.supabase.co:5432/postgres`
  },
  {
    name: 'User: postgres.fzpakajuwkctyxlzwlpa, Host: aws-1...pooler.supabase.com:5432',
    url: `postgresql://postgres.${projectRef}:${passwordEncoded}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`
  },
  {
    name: 'User: postgres, Host: aws-1...pooler.supabase.com:5432',
    url: `postgresql://postgres:${passwordEncoded}@aws-1-sa-east-1.pooler.supabase.com:5432/postgres`
  }
];

async function testAll() {
  for (const v of variations) {
    console.log(`Testing: ${v.name}...`);
    const client = new Client({ connectionString: v.url, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      console.log('  SUCCESS!');
      await client.end();
      return v.url;
    } catch (err) {
      console.log(`  FAILED: ${err.message}`);
    }
  }
  return null;
}

testAll().then(result => {
  if (result) {
    console.log('\nUse this DIRECT_URL:', result);
  } else {
    console.log('\nNone of the variations worked.');
  }
});
