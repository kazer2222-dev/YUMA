import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const result: any[] = await prisma.$queryRawUnsafe("SELECT sql FROM sqlite_master WHERE type='table' AND name='space_members'");
        console.log('SpaceMember Schema:', result[0]?.sql);

        const count = await prisma.space.count();
        console.log(`Total spaces: ${count}`);
    } catch (e) {
        console.error('Error:', e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
