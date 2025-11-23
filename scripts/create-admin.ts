// Simple script to create admin user
// Run with: npx tsx scripts/create-admin.ts <email> [name]

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@yuma.com';
  const name = process.argv[3] || process.env.ADMIN_NAME || 'Admin User';

  console.log(`\n🔐 Creating admin user...`);
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${name}\n`);

  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      include: { adminRole: true },
    });

    if (user) {
      if (user.adminRole) {
        console.log(`✅ User already exists and is an admin!`);
        console.log(`   User ID: ${user.id}`);
        return;
      }

      // Add admin role
      await prisma.adminRole.create({
        data: {
          userId: user.id,
          role: 'ADMIN',
        },
      });

      console.log(`✅ Admin role added to existing user!`);
      console.log(`   User ID: ${user.id}`);
    } else {
      // Create new admin user
      user = await prisma.user.create({
        data: {
          email,
          name,
          adminRole: {
            create: {
              role: 'ADMIN',
            },
          },
        },
        include: {
          adminRole: true,
        },
      });

      console.log(`✅ Admin user created successfully!`);
      console.log(`   User ID: ${user.id}`);
    }

    console.log(`\n📝 Next steps:`);
    console.log(`   1. Start your dev server: npm run dev`);
    console.log(`   2. Go to: http://localhost:3000/auth`);
    console.log(`   3. Enter email: ${email}`);
    console.log(`   4. Check console for PIN (development mode)`);
    console.log(`   5. Log in and access: http://localhost:3000/admin\n`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
