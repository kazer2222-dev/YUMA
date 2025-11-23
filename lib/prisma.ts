import { PrismaClient } from '@prisma/client'

// Explicitly load environment variables if not already loaded
if (!process.env.DATABASE_URL && typeof window === 'undefined') {
  try {
    // Try to load dotenv if available (for server-side)
    require('dotenv').config();
  } catch (e) {
    // dotenv not available or already loaded
  }
}

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  const errorMsg = 'DATABASE_URL environment variable is not set. Please check your .env file.\n' +
    'Expected location: .env in the project root\n' +
    'Expected format: DATABASE_URL="file:./prisma/dev.db"';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force recreation of PrismaClient to ensure it uses the correct connection
// This fixes issues where the client was generated with Data Proxy mode
let prismaInstance = globalForPrisma.prisma;

// In development, clear cached instance on first load to avoid old Data Proxy instances
// This ensures we use the freshly generated client after prisma generate
if (process.env.NODE_ENV !== 'production' && !globalThis.__prisma_client_initialized) {
  console.log('[Prisma] Development mode - clearing cached instance on first load');
  prismaInstance = undefined;
  globalForPrisma.prisma = undefined;
  globalThis.__prisma_client_initialized = true;
}

// Create new instance if needed
if (!prismaInstance) {
  console.log('[Prisma] Creating new PrismaClient instance');
  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

export const prisma = prismaInstance

