const { Client } = require('pg');

const config = {
  connectionString: "postgresql://postgres.tpvodidxmyykbyzdvrma:159PodjI%29_%26h%25jdQi1_@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
  connectionTimeoutMillis: 10000,
};

const sql = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "url" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Promotion" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "discountPercentage" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "NotificationConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT,
    "productNamePattern" TEXT,
    "targetPrice" DOUBLE PRECISION,
    "targetDiscount" DOUBLE PRECISION,
    "lastAlertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationConfig_pkey" PRIMARY KEY ("id")
);
`;

async function run() {
  console.log('Attempting to connect...');
  const client = new Client(config);
  try {
    await client.connect();
    console.log('Connected! Creating tables...');
    await client.query(sql);
    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
