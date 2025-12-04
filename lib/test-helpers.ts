/**
 * Test Helper Utilities
 * 
 * This file contains helper functions for testing, including:
 * - User creation and authentication
 * - Test data setup
 * - API request helpers
 * - Database utilities
 */

import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * Create a test user in the database
 */
export async function createTestUser(options: {
  email: string;
  name?: string;
  password?: string;
  googleId?: string;
  emailVerified?: boolean;
}) {
  const hashedPassword = options.password 
    ? await bcrypt.hash(options.password, 10)
    : null;

  return await prisma.user.create({
    data: {
      email: options.email,
      name: options.name || options.email.split('@')[0],
      password: hashedPassword,
      googleId: options.googleId,
      emailVerified: options.emailVerified ?? false,
    },
  });
}

/**
 * Create a test user with session (for authenticated tests)
 */
export async function createAuthenticatedUser(options: {
  email: string;
  name?: string;
}) {
  const user = await createTestUser(options);
  
  // Generate tokens
  const { accessToken, refreshToken } = AuthService.generateTokens({
    id: user.id,
    email: user.email,
    name: user.name || undefined,
  });

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      lastActiveAt: new Date(),
    },
  });

  return {
    user,
    session,
    token: accessToken,
  };
}

/**
 * Create a test space
 */
export async function createTestSpace(options: {
  name: string;
  description?: string;
  ownerId: string;
}) {
  return await prisma.space.create({
    data: {
      name: options.name,
      description: options.description,
      ownerId: options.ownerId,
    },
  });
}

/**
 * Create a test task
 */
export async function createTestTask(options: {
  title: string;
  description?: string;
  spaceId: string;
  assigneeId?: string;
  status?: string;
}) {
  return await prisma.task.create({
    data: {
      title: options.title,
      description: options.description,
      spaceId: options.spaceId,
      assigneeId: options.assigneeId,
      status: options.status || 'todo',
    },
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  // Delete in reverse order of dependencies
  await prisma.task.deleteMany({
    where: {
      space: {
        name: {
          startsWith: 'Test ',
        },
      },
    },
  });

  await prisma.space.deleteMany({
    where: {
      name: {
        startsWith: 'Test ',
      },
    },
  });

  await prisma.session.deleteMany({
    where: {
      user: {
        email: {
          contains: '@test.com',
        },
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@test.com',
      },
    },
  });
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(
  url: string,
  token: string,
  options: RequestInit = {}
) {
  return fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(token),
      ...options.headers,
    },
  });
}

/**
 * Wait for condition with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Generate test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Seed test data for a complete test scenario
 */
export async function seedTestScenario() {
  // Create admin user
  const admin = await createTestUser({
    email: 'admin@test.com',
    name: 'Test Admin',
  });

  // Create regular user
  const user = await createAuthenticatedUser({
    email: 'user@test.com',
    name: 'Test User',
  });

  // Create space
  const space = await createTestSpace({
    name: 'Test Space',
    description: 'A test space for testing',
    ownerId: admin.id,
  });

  // Create tasks
  const tasks = await Promise.all([
    createTestTask({
      title: 'Test Task 1',
      spaceId: space.id,
      assigneeId: user.user.id,
    }),
    createTestTask({
      title: 'Test Task 2',
      spaceId: space.id,
      status: 'in-progress',
    }),
  ]);

  return {
    admin,
    user,
    space,
    tasks,
  };
}
















