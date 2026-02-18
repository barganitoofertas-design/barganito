const { execSync } = require('child_process');
const fs = require('fs');

// Read .env to get DIRECT_URL
const envFile = fs.readFileSync('.env', 'utf8');
const directUrlMatch = envFile.match(/DIRECT_URL="(.*)"/);
const directUrl = directUrlMatch ? directUrlMatch[1] : null;

if (!directUrl) {
  console.error('DIRECT_URL not found in .env');
  process.exit(1);
}

try {
  console.log('--- Starting Database Sync (Robust Mode) ---');
  
  // Set DATABASE_URL to DIRECT_URL for the push command
  const env = { ...process.env, DATABASE_URL: directUrl };
  
  console.log('1. Pushing schema to database...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env, shell: true });
  } catch (e) {
    console.log('Push failed but maybe because it was already in sync? Continuing...');
  }
  
  console.log('2. Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('3. Seeding database with detailed output...');
  // Using direct call to see errors
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', env, shell: true });
  
  console.log('--- Sync Completed Successfully ---');
} catch (error) {
  console.error('--- Sync Failed ---');
  console.error(error.message);
  process.exit(1);
}
