import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Google Auth Space Creation Logic...');

    // 1. Create dummy user
    const email = `test-google-${Date.now()}@example.com`;
    console.log(`Creating user: ${email}`);

    const user = await prisma.user.create({
        data: {
            email,
            name: 'Test User',
            emailVerified: true,
        }
    });

    console.log(`User created: ${user.id}`);

    try {
        // 2. Attempt to create space with roles (copied from route.ts)
        const tickerBase = user.id.slice(-6).toUpperCase();
        console.log('Creating space...');

        const space = await prisma.space.create({
            data: {
                name: 'Personal',
                slug: `personal-${user.id}`,
                ticker: `P-${tickerBase}`,
                members: {
                    create: {
                        userId: user.id,
                        role: 'OWNER'
                    }
                },
                roles: {
                    create: [
                        {
                            name: 'Admin',
                            description: 'Full access to all space features and settings',
                            isDefault: true,
                            isSystem: true,
                            permissions: {
                                create: [
                                    { permissionKey: 'manage_space', granted: true },
                                    { permissionKey: 'view_space', granted: true },
                                ]
                            }
                        },
                        {
                            name: 'Member',
                            description: 'Can create and edit content',
                            isDefault: true,
                            isSystem: true,
                            permissions: {
                                create: [
                                    { permissionKey: 'view_space', granted: true },
                                ]
                            }
                        },
                        {
                            name: 'Viewer',
                            description: 'Read-only access',
                            isDefault: true,
                            isSystem: true,
                            permissions: {
                                create: [
                                    { permissionKey: 'view_space', granted: true },
                                ]
                            }
                        }
                    ]
                },
                settings: {
                    create: {
                        allowCustomFields: true,
                        allowIntegrations: true,
                        aiAutomationsEnabled: true
                    }
                }
            }
        });

        console.log(`✅ Space created successfully: ${space.id}`);

        // 3. Assign Admin role
        console.log('Assigning Admin role...');
        const adminRole = await prisma.spaceRole.findFirst({
            where: { spaceId: space.id, name: 'Admin' }
        });

        if (adminRole) {
            await prisma.spaceMember.update({
                where: {
                    spaceId_userId: {
                        spaceId: space.id,
                        userId: user.id
                    }
                },
                data: { roleId: adminRole.id }
            });
            console.log('✅ Admin role assigned');
        } else {
            console.error('❌ Admin role not found');
        }

    } catch (error) {
        console.error('❌ Error during space creation:', error);
    } finally {
        // Cleanup
        console.log('Cleaning up...');
        await prisma.user.delete({ where: { id: user.id } });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
