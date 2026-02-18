import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log('Tables found:', result);
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
