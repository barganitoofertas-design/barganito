const projectRef = 'tpvodidxmyykbyzdvrma';
const user = `postgres.${projectRef}`;
const passwordRaw = '159PodjI)_&h%jdQi1_'; // Assuming this is raw

const passwordEncoded = encodeURIComponent(passwordRaw);
const host = 'aws-1-sa-east-1.pooler.supabase.com';

const dbUrl = `postgresql://${user}:${passwordEncoded}@${host}:6543/postgres?pgbouncer=true`;
const directUrl = `postgresql://${user}:${passwordEncoded}@${host}:5432/postgres`;

console.log('DATABASE_URL=' + dbUrl);
console.log('DIRECT_URL=' + directUrl);
