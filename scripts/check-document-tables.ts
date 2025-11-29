import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDocumentTables() {
  try {
    // Try to query the documents table
    const count = await prisma.document.count();
    console.log('✅ Document tables exist! Found', count, 'documents');
    return true;
  } catch (error: any) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.error('❌ Document tables do not exist in the database.');
      console.error('\n📋 Please run the following command to create the tables:');
      console.error('   npx prisma migrate dev --name add_document_management');
      console.error('\n   OR for development (faster):');
      console.error('   npx prisma db push');
      return false;
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentTables()
  .then((exists) => {
    process.exit(exists ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error checking tables:', error);
    process.exit(1);
  });














