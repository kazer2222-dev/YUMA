import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  // Default admin email - you can change this
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yuma.com';
  const adminName = process.env.ADMIN_NAME || 'Admin User';

  // Check if admin user already exists
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { adminRole: true },
  });

  if (adminUser) {
    // Check if user already has admin role
    if (adminUser.adminRole) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
      console.log(`   Admin ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      return;
    }

    // User exists but doesn't have admin role, add it
    await prisma.adminRole.create({
      data: {
        userId: adminUser.id,
        role: 'ADMIN',
      },
    });

    console.log(`✅ Admin role added to existing user: ${adminEmail}`);
    return;
  }

  // Create new admin user
  adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
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
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Name: ${adminUser.name}`);
  console.log(`   User ID: ${adminUser.id}`);
  console.log(`   Admin Role: ${adminUser.adminRole?.role}`);
  console.log(`\n📧 To log in:`);
  console.log(`   1. Go to http://localhost:3000/auth`);
  console.log(`   2. Enter email: ${adminEmail}`);
  console.log(`   3. Check console for PIN (in development mode)`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
















